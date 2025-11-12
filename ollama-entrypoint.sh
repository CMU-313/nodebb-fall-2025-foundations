#!/bin/bash
set -e

echo "Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

echo "Waiting for Ollama to be ready..."
until ollama list >/dev/null 2>&1; do
    sleep 1
    echo "Ollama is ready!"
done

echo "Pulling model ${OLLAMA_MODEL:-llama3.2:3b}..."
ollama pull "${OLLAMA_MODEL:-llama3.2:3b}"

echo "Model ready! Ollama is fully operational."

# Keep container running
wait $OLLAMA_PID
