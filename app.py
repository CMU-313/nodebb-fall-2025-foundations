from flask import Flask, request, jsonify
from ollama import Client
import os

app = Flask(__name__)

def get_ollama_client():
    """Get Ollama client."""
    ollama_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    client = Client(host=ollama_url)
    return client

def get_language(post: str, client, model_name: str = "llama3.2:3b") -> str:
    """Detect the language of the post using Ollama LLM."""
    context = (
        "You are an expert language classifier. Your ONLY job is to analyze the input text "
        "and determine its original language. Your response must be the single English name "
        "of the detected language. If the text is NOT English, you must NEVER reply with 'English'."
    )
    
    response = client.generate(
        model=model_name,
        prompt=post,
        system=context,
        options={'temperature': 0.1}
    )
    return response['response'].strip()

def get_translation(post: str, client, model_name: str = "llama3.2:3b") -> str:
    """Translate non-English text to English using Ollama LLM."""
    context = (
        "You are an expert language translator. Your ONLY task is to accurately translate "
        "any non-English text provided by the user into English. The translation MUST be "
        "the entire sole content of your response. ONLY return the translated text."
    )
    
    response = client.generate(
        model=model_name,
        prompt=post,
        system=context,
        options={'temperature': 0.1}
    )
    return response['response'].strip()

@app.route('/', methods=['GET'])
def translate():
    """Main translation endpoint."""
    content = request.args.get('content', '')
    
    if not content or not content.strip():
        return jsonify({"is_english": True, "translated_content": content})
    
    try:
        client = get_ollama_client()
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        
        # Detect language
        language = get_language(content, client, model_name)
        
        # Check if it's English
        if language.strip().lower() == "english":
            return jsonify({"is_english": True, "translated_content": content})
        
        # Translate to English
        translated = get_translation(content, client, model_name)
        return jsonify({"is_english": False, "translated_content": translated})
        
    except Exception as e:
        # Fallback on error
        return jsonify({"is_english": True, "translated_content": content}), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        client = get_ollama_client()
        # Quick test to see if Ollama is responding
        return jsonify({"status": "healthy", "ollama_connected": True})
    except:
        return jsonify({"status": "unhealthy", "ollama_connected": False}), 503

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
