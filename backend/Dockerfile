# -- Build stage --
FROM node:22-alpine AS builder
WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src/ src/
RUN npx tsc

# -- Production stage --
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist/ dist/

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
