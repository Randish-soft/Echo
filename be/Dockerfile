FROM node:18

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies (no native builds needed)
RUN npm install

# Copy the rest of your files
COPY . .

# Build TypeScript code (if needed)
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
