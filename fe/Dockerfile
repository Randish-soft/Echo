# Build stage
FROM node:22.12.0 AS build

# Set the working directory
WORKDIR /app

# Install dependencies first to leverage Docker caching
COPY package*.json ./
RUN npm install

# Ensure TypeScript is globally available (if needed)
RUN npm install -g typescript

# Install TypeScript types and related dependencies
RUN npm install --save-dev @types/react @types/react-dom @types/react-router-dom

# Run lint fix to catch common issues automatically
RUN npm run lint:fix || true

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM nginx:latest

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
