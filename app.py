import os

from flask import Flask
from flask import request, jsonify
from src.translator import translate_content

app = Flask(__name__)

@app.route("/")
def translator():
    content = request.args.get("content", default = "", type = str)
    is_english, translated_content = translate_content(content)
    return jsonify({
        "is_english": is_english,
        "translated_content": translated_content,
    })

@app.route("/health")
def health():
    """Health check endpoint for monitoring."""
    try:
        # Quick test translation
        is_eng, _ = translate_content("Hello")
        return jsonify({
            "status": "healthy",
            "ollama_connected": True
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "ollama_connected": False,
            "error": str(e)
        }), 503


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))