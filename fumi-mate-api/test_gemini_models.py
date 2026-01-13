#!/usr/bin/env python3
"""
Test script to check available Gemini models for your API key.
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

import google.generativeai as genai

# Load API key
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("❌ GEMINI_API_KEY not found in .env file")
    exit(1)

print(f"✅ API Key found: {api_key[:10]}...")
genai.configure(api_key=api_key)

print("\n📋 Listing available Gemini models...")
print("-" * 50)

available_models = []
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"✅ {m.name}")
        print(f"   Methods: {m.supported_generation_methods}")
        print(f"   Input: {m.input_token_limit}")
        print(f"   Output: {m.output_token_limit}")
        print()
        available_models.append(m.name)

print(f"\n📊 Total models with generateContent: {len(available_models)}")

if not available_models:
    print("❌ No models available with generateContent method")
    print("💡 Try updating google-generativeai package:")
    print("   pip install --upgrade google-generativeai")

