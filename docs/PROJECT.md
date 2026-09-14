# CortexNotes — Project Documentation

A NotebookLM-style research workspace. A signed-in user adds up to four **sources**
(PDF, pasted text, or a public web page), the backend chunks and embeds them into a
shared Qdrant collection tagged with that user's Supabase ID, and the chat endpoint
answers questions using only the chunks retrieved from that user's own workspace.

Status: working prototype deployed as Vercel (frontend) + Render (API) + Qdrant Cloud +
Supabase Auth + OpenAI. 25 commits, single `main` branch, no CI.

---

## 1. System at a glance

```
Browser (React 19 SPA, Vercel)
    │  fetch(credentials: 'include'), X-CSRF-Token header
    │  prod: same-origin /api/* → Vercel rewrite → Render
    ▼
Express 4 BFF (Node >= 20.11, ESM, Render)
    ├── /api/auth/*  ──► Supabase Auth REST (/auth/v1) — no supabase-js, raw fetch
    ├── /api/pdfupload | /api/text | /api/link
    │        └─► chunk → OpenAI text-embedding-3-small → Qdrant upsert
    ├── /api/chat
    │        └─► embed question → Qdrant top-k (k=3, filtered by userId)
    │            → OpenAI gpt-4.1-mini chat completion
    └── /api/sources  (list / delete one / clear all — all filtered by userId)
```

There is **no application database**. Qdrant is the only persistence layer: source
metadata lives in the vector payloads, and a `localStorage` copy acts as an offline
fallback for the source list. Chat history is React state only and is lost on refresh.

### Repository layout

```
backend/
  server.js               app wiring, middleware order, timeouts, graceful shutdown
  config.js               env parsing + validation, frozen config object
  helpers.js              ingestion: pdfloader / textloader / urlloader
  persona.js              UNUSED legacy persona prompt (see §8)
  controllers/            auth, upload, chat, sources
  routes/                 thin routers, per-route rate limits, multer config
  middleware/auth.js      requireAuth (Supabase token check), requireCsrf
  middleware/security.js  requestContext, rateLimit, notFound, errorHandler
  services/               supabaseAuth.js, vectorIndexes.js, chatCompletion.js
  utils/                  cookies.js, validation.js
  test/                   13 node:test unit tests
  docker-compose.yml      local Qdrant on :6333
frontend/
  src/App.js              4 routes + Toaster
  src/contexts/           AuthContext (session restore, login/register/logout)
  src/utils/apiUtils.js   fetch wrapper: CSRF header, 35s abort, 401 refresh-and-retry
  src/config/api.js       endpoint table + base-URL resolution
  src/components/         LandingPage, AuthPage, Dashboard, MainApp,
                          SourcesPanel, ChatPanel, MobileUploadModal,
                          ProtectedRoute, StudioPanel*, RobotCenter*   (*unused)
  vercel.json             /api/* rewrite to Render + CSP and security headers
```

---

## 2. Request lifecycle

`backend/server.js:24-64` fixes the middleware order, and it is load-bearing:

1. `requestContext` — assigns `req.requestId` (UUID), sets `X-Request-Id` and
   `Cache-Control: no-store` on **every** response.
2. `helmet` — CSP disabled here (the CSP is served by Vercel for the SPA),
   `crossOriginResourcePolicy: same-site`, HSTS only in production.
3. `cors` — strict allowlist built from `FRONTEND_URLS`/`FRONTEND_URL`
   (plus `http://localhost:3000` outside production), `credentials: true`,
   methods limited to GET/POST/DELETE/OPTIONS. A request with no `Origin`
   (non-browser client) is allowed through and still hits auth.
4. Body parsers — JSON capped at 1 MB, urlencoded at 64 KB / 20 params.
5. `/health` — public, before auth.
6. `/api/auth/*` — mounted **before** the auth guard, so it is public by design.
7. `requireAuth` → `requireCsrf` → general `rateLimit` → feature routers.
8. `notFound` → `errorHandler`.

Because the guards are mounted on the `/api` prefix as a whole, every feature route
is authenticated by default. Adding a new public route means mounting it above
line 59 — there is no per-route opt-out.

**Error contract.** `errorHandler` (`middleware/security.js:56`) treats 4xx as
"expected" and echoes `error.message`; anything 5xx is logged with the request ID and
replaced by a generic `"The server could not complete the request"`. Controllers
therefore signal intent by attaching `status` to thrown Errors:
`throw Object.assign(new Error('...'), { status: 413 })`. That idiom is used
throughout `utils/validation.js` and `helpers.js`.

**Timeouts.** `server.requestTimeout = REQUEST_TIMEOUT_MS + 5s`, headers timeout
capped at 65s, keep-alive 5s. `SIGTERM`/`SIGINT` close the server and hard-exit
after 10s.

---

## 3. Authentication and session model

CortexNotes is a **backend-for-frontend**: the browser never talks to Supabase and
never holds a token in JavaScript.

- `services/supabaseAuth.js` is a hand-rolled client over the Supabase Auth REST API
  (`/signup`, `/token?grant_type=password`, `/token?grant_type=refresh_token`,
  `/user`, `/logout`) using the publishable key plus a 10s `AbortController` timeout.
  A timeout surfaces as HTTP 503.
- On login/register the controller mints a 32-byte `base64url` CSRF token and sets
  three cookies (`utils/cookies.js`):

  | Cookie      | Contents               | HttpOnly | Max-Age |
  |-------------|------------------------|----------|---------|
  | `cn_access` | Supabase access token  | yes      | `expires_in` (≈1h) |
  | `cn_refresh`| Supabase refresh token | yes      | 30 days |
  | `cn_csrf`   | CSRF token             | yes      | 30 days |

  All three are `Path=/api`, with `SameSite`/`Secure`/`Domain` from config. The CSRF
  token is also returned in the JSON body — that copy is what the SPA keeps in memory
  and echoes back in `X-CSRF-Token`, giving a double-submit check against a cookie
  the page cannot read.
- `requireAuth` (`middleware/auth.js:12`) calls Supabase `/user` on **every**
  protected request — no local JWT verification, no caching. It sets `req.user`,
  `req.accessToken`, and `req.workspaceId = user.id`. This is the simple, always-fresh
  choice; it also means one upstream Supabase call per API request.
- `requireCsrf` skips GET/HEAD/OPTIONS and otherwise compares cookie vs header with
  `crypto.timingSafeEqual` (length-checked first, since `timingSafeEqual` throws on
  mismatched lengths).
- `GET /api/auth/session` is the refresh path: if `cn_access` is dead but `cn_refresh`
  is valid, it rotates the whole cookie set and returns a fresh CSRF token; otherwise
  it clears cookies and returns 401.
- Password policy asymmetry is deliberate (`controllers/authController.js:23`):
  registration requires 10–128 chars, login accepts 1–128 so pre-existing shorter
  passwords still work.
- Supabase error codes are mapped to human sentences in `AUTH_ERROR_MESSAGES`;
  anything unmapped falls back to a generic message, and the real code is only
  written to the server log with the request ID.

**Client side.** `apiUtils.js` holds the CSRF token in a module variable, attaches
`credentials: 'include'`, aborts after 35s, and on a 401 from a non-auth endpoint
transparently calls `/api/auth/session` once and replays the request. If that fails it
dispatches a `cortex:auth-expired` window event, which `AuthContext` listens for to
drop the user to signed-out. `ProtectedRoute` renders a spinner during the initial
session probe so a refresh does not flash the login page.

---

## 4. Ingestion pipeline

All three loaders live in `backend/helpers.js` and end the same way: attach metadata →
`OpenAIEmbeddings(text-embedding-3-small)` → `QdrantVectorStore.fromDocuments` →
`ensureVectorIndexes`.

The metadata written onto every chunk is what the rest of the system keys off:

```js
{ userId, sourceId, documentType: 'pdf'|'text'|'url',
  sourceName, sourceSize, sourceUploadedAt, uploadedAt,
  originalFilename?, sourceUrl? }
```

`sourceId` is `` `${type}_${crypto.randomUUID()}` `` (`utils/validation.js:15`) —
unguessable, and its shape is re-validated on delete.

### PDF — `POST /api/pdfupload`
multer memory storage, single file, `fileFilter` on `application/pdf`, size capped at
`MAX_PDF_BYTES`. The controller additionally checks the real `%PDF-` magic bytes
before doing any work (`uploadController.js:10`), so a renamed file is rejected with
415 rather than reaching the parser. The filename passes through `cleanFilename`
(NFKC normalize, strip control chars / `/` / `\`, truncate to 120) before being used
in a temp path. `PDFLoader` needs a path, so the buffer is written to `os.tmpdir()`
with a random suffix and unlinked in `finally`. Post-parse guard: reject if
> 500 pages or > `MAX_EXTRACTED_CHARS`. One chunk per page (PDFLoader default).

### Text — `POST /api/text`
`validateText` requires non-empty and ≤ `MAX_TEXT_CHARS`.
`RecursiveCharacterTextSplitter` at chunk 1000 / overlap 200.
Auto-named `Text Document <locale date>` — note this uses the **server's** locale.

### URL — `POST /api/link`
The SSRF-hardened path, and the most defensive code in the repo:

1. `validatePublicUrl` — http/https only, no embedded credentials, reject `localhost`
   and `*.local`, then `dns.lookup(all: true)` and reject if **any** resolved address
   is private (RFC1918, loopback, link-local, `0.0.0.0/8`, plus IPv6 ULA/link-local
   and IPv4-mapped forms).
2. Manual redirect following, max 4 hops, **re-validating the resolved host at every
   hop** — this is what closes the redirect-to-internal-IP hole.
3. `AbortController` per hop at `REQUEST_TIMEOUT_MS`; content-type must be
   `text/html` or `text/plain`.
4. Size enforced twice: declared `Content-Length`, then a streaming byte counter that
   cancels the reader once `MAX_WEB_BYTES` is exceeded, with a per-read timeout race.
5. `cheerio` strips `script/style/noscript/svg`, takes `body` text, collapses
   whitespace; empty → 400, over `MAX_EXTRACTED_CHARS` → 413.
6. Split at chunk 1000 / overlap 160.

A residual gap worth knowing: DNS resolution happens at validation time and the
`fetch` resolves again — the classic TOCTOU/DNS-rebinding window is not closed.

---

## 5. Retrieval and chat

`controllers/chatController.js`:

1. `validateChatMessage` — non-empty, ≤ `MAX_CHAT_CHARS` (4000).
2. Open the existing Qdrant collection, `ensureVectorIndexes`.
3. Retrieve **k = 3** with a hard filter `metadata.userId == req.workspaceId`.
4. Build a system prompt that embeds `JSON.stringify(relevantChunk)` as *Context*,
   with an explicit instruction to treat the context as untrusted and never follow
   instructions found inside it — a deliberate prompt-injection guard, since the
   context is arbitrary user-supplied web/PDF text.
5. `gpt-4.1-mini`, `temperature 0.2`, `max_tokens 1200`, request timeout from config
   (`services/chatCompletion.js` keeps `timeout` in the SDK *options*, not the request
   body — there is a test pinning exactly that).
6. Respond `{ reply }`.

Design consequences to be aware of:

- **Single-turn.** Only the system prompt and the current message are sent. No
  conversation history reaches the model, so follow-ups like "explain that more"
  have no referent.
- **No citations.** The retrieved chunks carry page numbers and source names in their
  metadata, and the prompt mentions page numbers, but nothing in the response schema
  or UI surfaces which source an answer came from.
- **k=3 across the whole workspace.** With four sources indexed, one dominant source
  can crowd out the others; there is no per-source filter or re-ranking.
- The persona instructions are commented out (§8) — current answers are in the plain
  "AI assistant grounded in your context" voice.

---

## 6. Workspace isolation

One Qdrant collection holds every user's chunks. Isolation is entirely a
**payload filter** on `metadata.userId`, applied in all four places that touch
vectors: chat retrieval, list, delete-one, delete-all.

`services/vectorIndexes.js` provisions keyword payload indexes on `metadata.userId`
and `metadata.sourceId`, memoized per collection name in a module-level `Map` holding
the in-flight promise (so concurrent callers share one attempt, and a failure clears
the entry so the next request retries). Without those indexes Qdrant filtering is
slow, and the code treats provisioning failure as a 503 rather than silently
proceeding.

`GET /api/sources` reconstructs the source list by scrolling up to 10,000 points for
the user, deduplicating by `sourceId`, and sorting by `uploadedAt` descending. This is
what makes a workspace reappear after signing in on a different device. The frontend
mirrors the result into `localStorage` under `cortexNotes_sources_<userId>` and falls
back to it only when the API call fails.

`DELETE /api/sources/:sourceId` validates the id against
`/^(pdf|text|url)_[0-9a-f-]{36}$/i` before issuing a filtered delete that requires
**both** the user condition and the source id — a valid id from another workspace
matches nothing.

---

## 7. Configuration

`config.js` parses everything once, validates ranges, and freezes the result;
a bad value throws at boot rather than misbehaving later.
`assertProductionConfig()` runs before `express()` and, when `NODE_ENV=production`,
requires `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION_NAME`,
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, a non-empty frontend origin list, and
`AUTH_COOKIE_SECURE=true` whenever `AUTH_COOKIE_SAME_SITE=none`.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | 5000 | |
| `NODE_ENV` | development | gates HSTS, localhost CORS, prod config assertion |
| `FRONTEND_URL` / `FRONTEND_URLS` | — | exact origins; comma-separated for the plural form |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | — | `SUPABASE_ANON_KEY` accepted as an alias |
| `AUTH_COOKIE_SAME_SITE` | `lax` | `none` for cross-site frontend/API domains |
| `AUTH_COOKIE_SECURE` | `NODE_ENV==='production'` | |
| `AUTH_COOKIE_DOMAIN` | — | e.g. `.example.com` |
| `TRUST_PROXY` | false | set `true` behind exactly one proxy (Render) so `req.ip` is real |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | 60000 / 120 | general API bucket |
| `EXPENSIVE_RATE_LIMIT_MAX` | 12 | chat and ingestion buckets |
| `MAX_PDF_BYTES` | 10 MB (hard max 25 MB) | |
| `MAX_TEXT_CHARS` | 200k (max 1M) | |
| `MAX_CHAT_CHARS` | 4k (max 20k) | |
| `MAX_WEB_BYTES` | 2 MB (max 5 MB) | |
| `MAX_EXTRACTED_CHARS` | 1M (max 5M) | post-extraction cap for PDF and web |
| `REQUEST_TIMEOUT_MS` | 30000 (1s–120s) | upstream fetches, OpenAI, server timeout base |
| `QDRANT_URL` / `QDRANT_API_KEY` / `QDRANT_COLLECTION_NAME` | `http://localhost:6333`, —, `cortex-notes` | defaults are applied ad-hoc in controllers, **not** via `config.js` |

Frontend: `REACT_APP_API_URL` overrides everything; otherwise development calls
`http://localhost:5000` directly and production uses relative `/api/*` so the
`vercel.json` rewrite proxies to Render — which is what keeps cookies same-site in
the deployed setup.

### Rate limiting

`middleware/security.js:15` is a hand-rolled fixed-window limiter over an in-process
`Map`. Each request increments **two** buckets — `ip` and, once authenticated,
`workspace` — and a 429 fires if either exceeds the limit, so rotating client
identity does not buy extra quota. Buckets: `auth` (10 / 15 min), `auth-session`
(120 / 15 min), `general` (120 / min), `chat` and `ingestion` (12 / min each).
`RateLimit-*` and `Retry-After` headers are emitted. Cleanup is lazy: expired
entries are swept only once the map exceeds 10,000 keys.

This is per-process state. Multiple Render instances multiply the effective limit —
the README flags this, and a shared gateway limit or Redis is the real fix.

---

## 8. Known rough edges

Not bugs that break the app, but things a new contributor should see before touching
the code:

1. **`backend/node_modules` is committed** — 17,466 of the repo's 17,522 tracked
   files. `backend/.gitignore` says `node-modules` (hyphen, and no leading slash),
   which never matched. Fixing it means correcting the ignore file and
   `git rm -r --cached backend/node_modules`.
2. **~200 lines of commented-out persona prompt** sit inside
   `chatController.js:47`, and `backend/persona.js` exports the same content as
   `getHiteshSystemPrompt()` — imported by nothing. Both are dead weight; pick one
   home or delete both.
3. **`StudioPanel.js` and `RobotCenter.js` are never imported.** StudioPanel is a
   NotebookLM-style "Audio / Video / Mind map" tool shelf that was never wired up.
4. **The 4-source limit is client-side only.** `MAX_DOCUMENTS = 4` lives in
   `Dashboard.js:22` and is checked in three components; the API happily indexes a
   fifth source. Enforcement belongs in the upload controllers.
5. **Qdrant defaults are duplicated** across `helpers.js`, `chatController.js` and
   `sourcesController.js` instead of coming from `config.js`, so the
   `'cortex-notes'` fallback is repeated four times.
6. **Dead branch** in `chatController.js`: `if (relevantChunk.length === 0)` assigns
   the empty array to itself, and a stale comment says "No user filtering needed since
   no authentication" — left over from the pre-auth version.
7. **No chat persistence.** Refreshing the dashboard clears the conversation.
8. **Frontend has no tests** (`react-scripts test` exists, no test files), and
   `frontend/build/` is checked into the working tree though ignored by git.
9. **DNS rebinding** on URL import (§4) remains theoretically open.

---

## 9. Running and verifying

Local Qdrant:

```bash
cd backend && docker compose up -d
```

Backend:

```bash
cd backend && cp env.example .env && npm install && npm start
```

Frontend:

```bash
cd frontend && npm install && npm start
```

Verification — the backend suite is 13 `node:test` unit tests covering credential
normalization and the password policy, cookie parsing, CSRF double-submit, source-id
generation, text/chat bounds, filename sanitization, private-URL rejection, the
OpenAI request shape, and payload-index provisioning. All 13 pass:

```bash
cd backend && npm test
```

```bash
cd frontend && npm run build
```

There is no integration or end-to-end coverage — nothing exercises a real Supabase,
Qdrant, or OpenAI call.

---

## 10. API reference

All `/api/*` routes except `/health` and `/api/auth/*` require the `cn_access` cookie;
all non-GET routes additionally require `X-CSRF-Token` matching `cn_csrf`.
Every response carries `X-Request-Id`, and errors are `{ error, requestId }`.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/health` | — | `{ status: 'ok' }` |
| POST | `/api/auth/register` | `{ name, email, password }` | 201 `{ user, csrfToken }` or 201 `{ requiresEmailConfirmation: true, message }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, csrfToken }` |
| GET | `/api/auth/session` | — | `{ user, csrfToken }` / 401 |
| POST | `/api/auth/logout` | — | 204 |
| POST | `/api/pdfupload` | multipart `pdf` | `{ message, source }` |
| POST | `/api/text` | `{ text }` | `{ message, source }` |
| POST | `/api/link` | `{ link }` | `{ message, source }` |
| POST | `/api/chat` | `{ message }` | `{ reply }` |
| GET | `/api/sources` | — | `{ sources: [...] }` |
| DELETE | `/api/sources/:sourceId` | — | `{ message, sourceId }` |
| DELETE | `/api/sources` | — | `{ message }` |

`user` is `{ id, email, name, emailVerified }`.
`source` is `{ id, name, type: 'PDF'|'TEXT'|'URL', size, uploadedAt, sourceUrl?, originalFilename? }`.
