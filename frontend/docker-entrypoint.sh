#!/bin/sh
# Replace the build-time placeholder with the actual API key at container start.
# This avoids baking secrets into Docker image layers.

if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
  find /usr/share/nginx/html -type f -name '*.js' \
    -exec sed -i "s|__GOOGLE_MAPS_API_KEY_PLACEHOLDER__|${GOOGLE_MAPS_API_KEY}|g" {} +
fi

exec "$@"
