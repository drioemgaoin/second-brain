FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are baked at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --- Serve static files ---
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html

# SPA fallback: serve index.html for unknown routes
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri $uri/ $uri.html /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
