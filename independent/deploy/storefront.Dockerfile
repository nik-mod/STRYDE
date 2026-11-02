FROM node:24-bookworm-slim AS build
WORKDIR /app/storefront
COPY storefront/package*.json ./
RUN npm ci
COPY storefront/ ./
COPY design/ /app/design/
COPY scripts/ /app/scripts/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/storefront/.next/standalone ./
COPY --from=build --chown=node:node /app/storefront/.next/static ./.next/static
COPY --from=build --chown=node:node /app/storefront/public ./public
COPY --from=build --chown=node:node /app/storefront/design ./design
USER node
EXPOSE 3000
CMD ["node", "server.js"]
