# -- Build stage --
FROM node:24.14.1-alpine3.23 AS builder
WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy ALL workspace package.json files first. 
# This is required for npm workspaces to work correctly during 'npm ci'.
COPY common/package.json ./common/package.json
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

# Install all dependencies for the entire workspace
RUN npm ci

# Copy common source and build it
COPY common/ ./common/
RUN npm run build --workspace=common

# Copy frontend source
COPY frontend/ ./frontend/

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
