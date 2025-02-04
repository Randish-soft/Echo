# Build stage
FROM node:22.12.0 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g typescript
RUN npm install --save-dev @types/react @types/react-dom @types/react-router-dom

COPY . .

RUN npm run build

# Production stage
FROM nginx:latest

# Copy the built frontend assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom NGINX configuration
COPY nginx-config/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
