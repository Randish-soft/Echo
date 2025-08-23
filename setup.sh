#!/bin/bash

# Echo Project Setup Script
# This script sets up the complete folder structure and initial files for the Echo SaaS platform

echo "🚀 Setting up Echo - Documentation Generation SaaS Platform..."

# Create main project directories
mkdir -p {frontend,backend,docs,config,scripts,tests}

# Frontend structure (React/Next.js)
mkdir -p frontend/{public,src/{components/{common,dashboard,auth,documentation},pages,styles,utils,hooks,context,services},assets/{images,icons}}

# Backend structure (Node.js/Express or Python Flask/Django)
mkdir -p backend/{src/{controllers,models,services,middleware,utils,routes},config,tests,uploads,temp}

# Documentation and configuration
mkdir -p docs/{api,user-guide,developer}
mkdir -p config/{nginx,docker,kubernetes}

# Create frontend files
cat > frontend/package.json << 'EOF'
{
  "name": "echo-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "^1.5.0",
    "@tailwindcss/forms": "^0.5.6",
    "lucide-react": "^0.263.1",
    "react-markdown": "^9.0.0",
    "prismjs": "^1.29.0"
  },
  "devDependencies": {
    "@types/node": "20.8.0",
    "@types/react": "18.2.25",
    "@types/react-dom": "18.2.11",
    "autoprefixer": "10.4.16",
    "eslint": "8.51.0",
    "eslint-config-next": "14.0.0",
    "postcss": "8.4.31",
    "tailwindcss": "3.3.5",
    "typescript": "5.2.2"
  }
}
EOF

# Backend package.json (Node.js)
cat > backend/package.json << 'EOF'
{
  "name": "echo-backend",
  "version": "1.0.0",
  "description": "Echo - Documentation Generation API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5",
    "axios": "^1.5.0",
    "openai": "^4.8.0",
    "@octokit/rest": "^20.0.1",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
EOF

# Environment files
cat > backend/.env.example << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/echo

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# GitHub API
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
TEMP_PATH=./temp
EOF

# Frontend environment
cat > frontend/.env.local.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
EOF

# Docker configuration
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/echo
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mongodb

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=echo

volumes:
  mongodb_data:
EOF

# Frontend Dockerfile
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
EOF

# Backend Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
EOF

# Tailwind CSS configuration
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
EOF

# Next.js configuration
cat > frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig
EOF

# Basic Express server
cat > backend/src/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Echo API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Echo API running on http://localhost:${PORT}`);
});
EOF

# GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
        
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run tests
      run: |
        cd backend
        npm test
EOF

# Project README
cat > README.md << 'EOF'
# Echo - Documentation Generation SaaS

Echo is a powerful SaaS platform that automatically generates comprehensive documentation for your GitHub repositories using AI.

## 🚀 Features

- **GitHub Integration**: Connect your repositories securely
- **AI-Powered Analysis**: Advanced code understanding and documentation generation
- **Multiple Documentation Types**: Internal and external documentation
- **Modern UI**: Clean, responsive interface
- **Real-time Processing**: Live updates during documentation generation

## 🏗️ Project Structure

```
├── frontend/           # Next.js React application
├── backend/            # Node.js Express API
├── docs/              # Project documentation
├── config/            # Configuration files
├── scripts/           # Utility scripts
└── tests/             # Test files
```

## 🛠️ Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd echo
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Start with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Or start manually**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm install
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm install
   npm run dev
   ```

## 📚 Documentation

- [API Documentation](docs/api/)
- [User Guide](docs/user-guide/)
- [Developer Guide](docs/developer/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
EOF

# Create gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/frontend/.next/
/frontend/out/
/frontend/build/
/backend/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# macOS
.DS_Store

# Windows
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Temporary files
temp/
uploads/
*.tmp
EOF

# Make the script executable and provide final instructions
echo ""
echo "✅ Echo project structure created successfully!"
echo ""
echo "📁 Project structure:"
echo "├── frontend/          # Next.js React application"
echo "├── backend/           # Node.js Express API"  
echo "├── docs/             # Documentation"
echo "├── config/           # Configuration files"
echo "├── docker-compose.yml # Docker setup"
echo "└── README.md         # Project documentation"
echo ""
echo "🚀 Next steps:"
echo "1. Copy environment variables:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.local.example frontend/.env.local"
echo ""
echo "2. Update environment variables with your API keys"
echo ""
echo "3. Start the application:"
echo "   Option A (Docker): docker-compose up -d"
echo "   Option B (Manual): Run 'npm install && npm run dev' in both frontend/ and backend/"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔧 Don't forget to:"
echo "- Set up your GitHub OAuth App"
echo "- Get OpenAI API key"
echo "- Configure MongoDB connection"
echo ""
echo "Happy coding! 🎉"