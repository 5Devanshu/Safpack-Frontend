# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine
# Copy SPA to Nginx web root
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# Nginx config for SPA + caching
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# simple healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
