# syntax=docker/dockerfile:1

# ---- Stage 1: production dependencies only ----
FROM node:20-alpine AS deps

WORKDIR /app

# Manifests first so dependency layers stay cached when only source changes.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime

# dumb-init forwards SIGTERM so the graceful shutdown in server.js actually runs.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Never run the app as root.
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
