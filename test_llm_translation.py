#!/usr/bin/env python3
"""
Test script to demonstrate LLM translation with Ollama.

Usage:
    # Test with hardcoded translations (default)
    python test_llm_translation.py
    
    # Test with Ollama LLM (requires Ollama running)
    USE_LLM=true python test_llm_translation.py
"""

import os
import sys

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

from src.translator import translate_content, OLLAMA_AVAILABLE

def main():
    use_llm = os.getenv("USE_LLM", "false").lower() == "true"
    
    print("=" * 60)
    print("Translation Microservice Test")
    print("=" * 60)
    print(f"Mode: {'LLM (Ollama)' if use_llm else 'Hardcoded'}")
    print(f"Ollama Available: {OLLAMA_AVAILABLE}")
    print("=" * 60)
    print()
    
    # Test cases
    test_cases = [
        ("Hello, how are you?", "English text"),
        ("Bonjour, comment allez-vous?", "French text"),
        ("Hola, ¿cómo estás?", "Spanish text"),
        ("こんにちは、お元気ですか？", "Japanese text"),
        ("你好，你好吗？", "Chinese text"),
        ("Dies ist eine Nachricht auf Deutsch", "German text (hardcoded)"),
    ]
    
    for content, description in test_cases:
        print(f"Testing: {description}")
        print(f"Input: {content}")
        
        try:
            is_english, translated = translate_content(content)
            print(f"Is English: {is_english}")
            print(f"Translation: {translated}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("-" * 60)
        print()
    
    print("=" * 60)
    print("Test complete!")
    print()
    
    if not use_llm:
        print("💡 Tip: To test with Ollama LLM, run:")
        print("   USE_LLM=true python test_llm_translation.py")
    elif not OLLAMA_AVAILABLE:
        print("⚠️  Warning: Ollama library not available")
        print("   Install with: uv sync")
    else:
        print("✅ Using Ollama LLM for translation")
        print()
        print("📝 Note: Make sure Ollama is running:")
        print("   ollama serve")

if __name__ == "__main__":
    main()
