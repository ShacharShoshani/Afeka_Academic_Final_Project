# -- Build stage --
FROM node:24.14.1-alpine3.23 AS builder
WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src/ src/
RUN npx tsc

# -- Production stage --
FROM node:24.14.1-alpine3.23
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist/ dist/

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
