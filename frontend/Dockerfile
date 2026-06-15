# ─── Stage 1: Build Angular ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Quel projet builder : "frontend" (defaut) ou "admin"
ARG PROJECT=frontend

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx ng build --project ${PROJECT} --configuration production

# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:alpine
ARG PROJECT=frontend

COPY --from=builder /app/dist/${PROJECT}/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]