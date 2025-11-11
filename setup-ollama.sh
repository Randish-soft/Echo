#!/bin/bash

# Echo - Ollama Setup Script
# This script pulls the required LLM model for documentation generation

echo "========================================="
echo "  Echo - Ollama Model Setup"
echo "========================================="
echo ""

# Check if Ollama container is running
if ! docker ps | grep -q echo_ollama; then
    echo "❌ Ollama container is not running."
    echo "Please start the services with: docker-compose up -d"
    exit 1
fi

echo "✅ Ollama container is running"
echo ""

# Pull the default model (llama3.1:8b)
echo "📥 Pulling llama3.1:8b model (this will take a few minutes)..."
echo "Model size: ~4.7GB"
echo ""

docker exec -it echo_ollama ollama pull llama3.1:8b

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Model successfully installed!"
    echo "========================================="
    echo ""
    echo "You can now generate AI-powered documentation in Echo."
    echo ""
    echo "Optional: Install alternative models:"
    echo "  - Mistral (faster, 4GB):     docker exec -it echo_ollama ollama pull mistral:7b"
    echo "  - CodeLlama (code-focused):  docker exec -it echo_ollama ollama pull codellama:7b"
    echo "  - DeepSeek Coder (best):     docker exec -it echo_ollama ollama pull deepseek-coder:6.7b"
    echo ""
    echo "To change the model, update OLLAMA_MODEL in docker-compose.yml"
    echo ""
else
    echo ""
    echo "❌ Failed to pull model. Please check your internet connection."
    echo ""
    exit 1
fi
