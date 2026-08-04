# SalonFlow — production image
#
# Multi-stage so the runtime image carries only the standalone server output
# and the Prisma engine, not the toolchain that produced them.
#
# Build:  docker build -t salonflow .
# Run:    docker run -p 3100:3100 --env-file .env salonflow

# --- deps ------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app

# OpenSSL is required by the Prisma query engine on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- build -----------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next build` needs DATABASE_URL to be *parseable*, not reachable — no page is
# statically rendered against the database, so a placeholder is enough here.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DIRECT_DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV SESSION_SECRET="build-time-placeholder-value-32-characters-min"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate && npm run build && npm run build:cli

# --- runtime ---------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

# Run unprivileged. `node` (uid 1000) ships with the base image.
USER node

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Migrations and the Prisma CLI are needed at deploy time (`prisma migrate
# deploy`), which standalone tracing does not include.
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=build --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Operator CLI, pre-bundled to plain JavaScript. `src/` and `tsx` are not in
# this image, so the TypeScript entry points cannot be run here directly.
#
#   node dist/cli/bootstrap.mjs    # create the first tenant and owner account
#   node dist/cli/check-mail.mjs   # verify SMTP before customers depend on it
COPY --from=build --chown=node:node /app/dist/cli ./dist/cli

EXPOSE 3100

# The standalone bundle emits its own minimal server; `next start` is not used.
CMD ["node", "server.js"]
