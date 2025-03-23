FROM node:22.13.1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start in dev mode; or you can do a production build
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
