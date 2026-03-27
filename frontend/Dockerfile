# Stage 1: Dependencies — install npm packages (non-root)
FROM node:20-alpine AS deps
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 -G nodejs nextjs
WORKDIR /app
COPY --chown=nextjs:nodejs package.json package-lock.json ./
# WORKDIR is root-owned by default; allow nextjs to create node_modules
RUN chown nextjs:nodejs /app
USER nextjs
RUN npm ci

# Stage 2: Builder — production build (non-root)
FROM node:20-alpine AS builder
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 -G nodejs nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .
RUN chown -R nextjs:nodejs /app
USER nextjs
RUN npm run build

# Stage 3: Runner — minimal production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
