# fe/Dockerfile
FROM node:22.13.1

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Listen on port 5173 inside the container
EXPOSE 5173

# Tell Vite to bind to 0.0.0.0 so Docker can forward the port
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
