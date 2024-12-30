# Use a lightweight Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port (optional, for clarity)
EXPOSE 5001

# Run in dev mode (for local dev) - in production, you'd do: npm run build + npm run start
CMD ["npm", "run", "dev"]
