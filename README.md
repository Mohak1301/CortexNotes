# CortexNotes

CortexNotes is an authenticated document-research workspace for chatting with PDFs, pasted notes, and public web pages. Supabase Auth manages user identities and sessions; the Express API scopes every Qdrant read and mutation to the verified Supabase user ID.

## Local development

Requirements: Node.js 20.11+, OpenAI, Qdrant, and a Supabase project.

1. In Supabase, keep the Email provider enabled. Decide whether users must confirm their email under **Authentication → Providers → Email**.
2. Copy the project URL and publishable key from **Project Settings → API** into `backend/.env`.
3. Add the deployed frontend URL to Supabase's allowed Site URL / Redirect URLs before production launch.
4. Start both services:

```bash
cd backend
cp env.example .env
npm install
npm start
```

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_API_URL` when the browser API is not hosted at `http://localhost:5000` in development or behind the same origin in production.

## Authentication architecture

- Passwords are submitted only to the Express BFF and immediately exchanged with Supabase Auth; CortexNotes never stores or logs them.
- Access and refresh tokens are held in `HttpOnly` cookies and are never available to frontend JavaScript.
- Session restoration transparently rotates expired access tokens through the refresh cookie.
- Every protected request is verified with Supabase Auth and receives `req.user`; the immutable user ID becomes the Qdrant workspace filter.
- Mutations require a cryptographically random double-submit CSRF token in addition to the session cookie.
- Login and registration use a dedicated IP rate limit. API and AI-ingestion limits apply separately by IP and authenticated user.
- Source indexes are restored from Qdrant after sign-in, including on a different device.

## Cookie deployment settings

For a same-site deployment such as `app.example.com` and `api.example.com`, use:

```env
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=true
```

If the frontend and API use unrelated domains such as `example.vercel.app` and `example.onrender.com`, browsers require:

```env
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
```

The API CORS allowlist must contain the exact frontend origin. Never use `*` with credentialed requests.

## Other production controls

- Helmet headers, strict credentialed CORS, disabled framework disclosure, no-store responses and graceful shutdown
- Workspace-scoped Qdrant retrieval, listing and deletion using verified user IDs
- PDF signature checks, sanitized filenames, bounded text/message/web content and extraction limits
- SSRF-resistant URL imports with DNS and redirect validation, private-network blocking and timeouts
- Centralized non-leaking errors with request IDs and required production configuration validation

The built-in limiter is suitable for one API process. Multi-instance deployments must enforce a shared gateway limit or use Redis.

## Verification

```bash
cd backend && npm test
cd frontend && npm run build
```

Backend tests cover credential normalization, password policy, cookie parsing, CSRF enforcement, identifier generation, ingestion boundaries, filename sanitization and private-network URL rejection.
