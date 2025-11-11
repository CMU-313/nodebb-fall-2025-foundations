"""
Translation module for NodeBB posts.

This module provides language detection and translation using Ollama LLM.
"""

import os
from ollama import Client


def get_ollama_client():
    """Get Ollama client."""
    ollama_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    client = Client(host=ollama_url)
    return client


def get_language(post: str, client, model_name: str = "llama3.1:8b") -> str:
    """
    Detect the language of the post using Ollama LLM.
    
    Args:
        post: The text to analyze
        client: Ollama client instance
        model_name: The model to use
        
    Returns:
        Language name as a string (e.g., "English", "Spanish")
    """
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


def get_translation(post: str, client, model_name: str = "llama3.1:8b") -> str:
    """
    Translate non-English text to English using Ollama LLM.
    
    Args:
        post: The text to translate
        client: Ollama client instance
        model_name: The model to use
        
    Returns:
        Translated text in English
    """
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


def translate_with_llm(content: str) -> tuple[bool, str]:
    """
    Translate content using Ollama LLM.
    
    Args:
        content: The text to check and translate
        
    Returns:
        Tuple of (is_english, translated_content)
    """
    client = get_ollama_client()
    model_name = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    
    # Detect language
    language = get_language(content, client, model_name)
    
    # Check if it's English
    if language.strip().lower() == "english":
        return True, content
    
    # Translate to English
    translated = get_translation(content, client, model_name)
    return False, translated


def translate_content(content: str) -> tuple[bool, str]:
    """
    Main translation function. Detects language and translates to English if needed.
    
    Args:
        content: The text content to translate
        
    Returns:
        Tuple of (is_english, translated_content):
        - is_english: True if the original content was in English
        - translated_content: The English translation (or original if already English)
    """
    if not content or not content.strip():
        return True, content
    
    # Use Ollama LLM only - no fallback
    return translate_with_llm(content)