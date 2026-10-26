# ---- deps: install node_modules once, shared by the other stages ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- dev: used by docker-compose for local development (hot reload) ----
FROM deps AS dev
COPY . .
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build: produce the standalone Nitro server in .output ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- prod: small runtime image, only .output is needed ----
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build /app/.output ./.output
# Applied on boot by server/plugins/migrate.ts
COPY --from=build /app/server/db/migrations ./server/db/migrations
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
