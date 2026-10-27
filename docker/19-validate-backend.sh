#!/bin/sh
set -eu
BACKEND_URL="${BACKEND_URL%/}"
export BACKEND_URL
if ! printf '%s' "$BACKEND_URL" | grep -Eq '^https?://[a-zA-Z0-9][a-zA-Z0-9._-]*(:[0-9]{1,5})?$'; then
    echo 'Configure BACKEND_URL como origen http(s), sin ruta, credenciales ni parámetros.' >&2
    exit 1
fi
# envsubst runs as a separate process; normalize the value in the template too.
sed -i 's@${BACKEND_URL}@'"$BACKEND_URL"'@g' /etc/nginx/templates/default.conf.template
