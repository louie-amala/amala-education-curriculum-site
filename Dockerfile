# Cloud Run image for the curriculum site.
#
# Next is built with `output: "standalone"` (see next.config.mjs), so the runtime stage carries
# only the traced server bundle plus the two directories Next deliberately leaves out of it:
# .next/static (hashed client assets) and public/ (the downloads the access gate protects).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build reads content-source/ from disk and regenerates lib/protected-paths.generated.ts;
# validateGraph() fails the build if the committed copy is stale, so the gate cannot drift.
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run sends traffic to $PORT; next's standalone server.js reads it.
ENV PORT=8080

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
