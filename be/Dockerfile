# be/Dockerfile
FROM node:22.13.1

WORKDIR /be

# Copy package files first
COPY package*.json ./
RUN npm install

# Copy source code & build
COPY . .
RUN npx tsc

# Expose 5000 internally
EXPOSE 5001
CMD ["node", "dist/server.js"]
