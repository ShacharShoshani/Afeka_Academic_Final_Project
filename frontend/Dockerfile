# -- Build stage --
FROM node:24.14.1-alpine3.23 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g @angular/cli
COPY frontend/ frontend/
RUN npm ci

# Build with a placeholder — the real key is injected at container startup
RUN printf "export const environment = {\n  production: true,\n  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY_PLACEHOLDER__',\n};\n" \
    > frontend/src/environments/environment.local.ts

RUN npm run build --workspace=frontend -- --configuration=production

# -- Production stage --
FROM nginx:1.29.8-alpine3.23

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/frontend/dist/livin_frontend/browser/ /usr/share/nginx/html/

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
