FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY backend/ ./
# Build-time placeholders only; no database/network migration in the image build.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build JWT_SECRET=build-only-not-a-runtime-secret COOKIE_SECRET=build-only-not-a-runtime-secret STORE_CORS=http://localhost ADMIN_CORS=http://localhost AUTH_CORS=http://localhost
RUN npm run build
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/.medusa/server ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
RUN mkdir -p /app/static && chown node:node /app/static
USER node
EXPOSE 9000
CMD ["npm", "run", "start"]
