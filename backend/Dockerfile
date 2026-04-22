FROM node:18-alpine AS builder
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init postgresql-client
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY backend/scripts ./scripts
COPY backend/create_base_schema.sql ./
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
