# syntax=docker/dockerfile:1

# ----- deps: install all dependencies (incl. dev, needed for the build) -----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ----- builder: produce the standalone Next.js output -----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ----- dev: live-reload server; source + node_modules are bind/volume-mounted
#        at runtime (see docker-compose.dev.yml). No app code is copied in. -----
FROM node:22-alpine AS dev
# libc6-compat lets Next's SWC/Turbopack native binaries load on Alpine (musl).
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3021
# compose overrides this to `yarn install && next dev` against the mounted source.
CMD ["yarn", "dev"]

# ----- migrator: apply Drizzle migrations before the app starts (compose runs
#        this to completion first). Reuses deps' node_modules (has drizzle-kit);
#        the standalone runner image has neither drizzle-kit nor db/migrations. -----
FROM deps AS migrator
WORKDIR /app
COPY drizzle.config.ts ./
COPY db ./db
CMD ["yarn", "db:migrate"]

# ----- runner: minimal runtime image -----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3021
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3021
CMD ["node", "server.js"]
