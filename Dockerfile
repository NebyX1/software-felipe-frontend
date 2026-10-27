# =======================================================
# Stage 1: Build
# Vite bakes VITE_* env vars at compile time.
# In Coolify: configure BACKEND_URL as a runtime variable (see README).
# Docker manual: --build-arg VITE_API_URL=https://api.example.com
# =======================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Optional public API prefix; same-origin /api is the default.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# =======================================================
# Stage 2: Serve (nginx:alpine — no Node in runtime image)
# =======================================================
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config (gzip + cache-control + SPA fallback + health check)
ENV BACKEND_URL=http://backend:5000
ENV NGINX_ENVSUBST_FILTER="^BACKEND_URL$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/19-validate-backend.sh /docker-entrypoint.d/19-validate-backend.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/19-validate-backend.sh && chmod +x /docker-entrypoint.d/19-validate-backend.sh

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Coolify / Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
