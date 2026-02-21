FROM node:25-alpine AS build
WORKDIR /app/
COPY frontend/traffic-lights/package*.json ./
RUN npm install
COPY frontend/traffic-lights/ .
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]