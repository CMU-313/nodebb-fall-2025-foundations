#!/bin/bash
# Setup script for Ollama (run this when you have Ollama available)

echo "Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

echo "Starting Ollama server..."
ollama serve &

echo "Waiting for Ollama to start..."
sleep 3

echo "Pulling model..."
MODEL_NAME="${OLLAMA_MODEL:-llama3.1:8b}"
ollama pull "$MODEL_NAME"

echo "Ollama setup complete!"
echo "Model: $MODEL_NAME"
echo "Set USE_LLM=true to enable LLM translation"
