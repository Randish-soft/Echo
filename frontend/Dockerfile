FROM node:20-alpine

RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Install deps first (cached)
COPY package*.json ./
RUN npm install

# Copy rest (will be overridden by bind mount at runtime)
COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=1
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
