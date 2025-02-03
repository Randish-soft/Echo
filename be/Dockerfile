FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code and compile TypeScript
COPY . .
RUN npx tsc

# Expose the port and run the compiled server
EXPOSE 5001
CMD ["node", "dist/server.js"]
