#!/usr/bin/env python3
"""
Check Gemini API status and try to generate a real response.
"""
import os
from dotenv import load_dotenv

load_dotenv()

print('='*70)
print('🔍 CHECKING GEMINI API STATUS...')
print('='*70)

# Check API Key
api_key = os.getenv('GEMINI_API_KEY')
print()
print(f"API Key Set: {'✅ Yes' if api_key else '❌ No'}")
if api_key:
    print(f"Key Preview: {api_key[:10]}...{api_key[-5:]}")
else:
    print("❌ ERROR: GEMINI_API_KEY not found in .env file")
    print()
    print("📝 To fix:")
    print("1. Create or edit .env file in fumi-mate-api directory")
    print("2. Add: GEMINI_API_KEY=your_actual_api_key_here")
    print("3. Get API key from: https://aistudio.google.com/app/apikey")

print()
print('='*70)
print('📊 QUOTA INFORMATION:')
print('='*70)
print()
print("If you're seeing 429 Rate Limit errors:")
print("1. ✅ You have an API key")
print("2. ⚠️  You've exceeded your current quota")
print()
print("💡 Solutions:")
print("   Option 1: Wait 1-2 minutes and try again")
print("   Option 2: Check usage at: https://ai.dev/usage")
print("   Option 3: Upgrade Google Cloud quota")
print()
print('='*70)

