FROM node:22.12.0

# Set the working directory
WORKDIR /app

# Install dependencies first to leverage Docker caching
COPY package*.json ./
RUN npm install

# Ensure TypeScript is globally available (if needed)
RUN npm install -g typescript

# Copy the rest of the code (you can skip this if you're going to rely solely on mounting)
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# Run Vite in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
