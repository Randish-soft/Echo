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
