# -- Build stage --
FROM node:24.14.1-alpine3.23 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g @angular/cli
COPY frontend/ frontend/
RUN npm ci

# Generate environment file with the provided API key
ARG GOOGLE_MAPS_API_KEY=''
RUN printf "export const environment = {\n  production: true,\n  googleMapsApiKey: '%s',\n};\n" \
    "${GOOGLE_MAPS_API_KEY}" > frontend/src/environments/environment.local.ts

RUN npm run build --workspace=frontend -- --configuration=production

# -- Production stage --
FROM nginx:1.29.8-alpine3.23

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist/livin_frontend/browser/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
