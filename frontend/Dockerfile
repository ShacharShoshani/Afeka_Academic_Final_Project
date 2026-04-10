# -- Build stage --
FROM node:22-alpine AS builder
WORKDIR /app

COPY frontend/package.json ./
RUN npm install

COPY frontend/angular.json frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.spec.json ./
COPY frontend/src/ src/
COPY frontend/public/ public/

# Generate environment file with the provided API key
ARG GOOGLE_MAPS_API_KEY=''
RUN printf "export const environment = {\n  production: true,\n  googleMapsApiKey: '%s',\n};\n" \
    "${GOOGLE_MAPS_API_KEY}" > src/environments/environment.local.ts

RUN npx ng build --configuration=production

# -- Production stage --
FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/livin_frontend/browser/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
