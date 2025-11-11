#!/bin/bash
set -e

echo "Starting Ollama service..."
ollama serve &

echo "Waiting for Ollama to be ready..."
sleep 5

echo "Pulling model ${OLLAMA_MODEL:-llama3.1:8b}..."
ollama pull "${OLLAMA_MODEL:-llama3.1:8b}"

echo "Ollama is ready!"
wait
