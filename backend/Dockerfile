# -- Build stage --
FROM node:24.14.1-alpine3.23 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci

COPY backend/prisma/ prisma/
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src/ src/
RUN npm install -g typescript
RUN npx tsc

# -- Production stage --
FROM node:24.14.1-alpine3.23
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci

COPY backend/prisma/ prisma/
RUN npx prisma generate

COPY --from=builder /app/dist/ dist/

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
