#!/usr/bin/env python3
"""
Direct test of gemini-2.5-flash model.
"""
from dotenv import load_dotenv
load_dotenv()

import sys
import os
import json
import time

# Add services to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.gemini_service import generate_task, _task_cache

print('='*60)
print('🧪 Testing Gemini API with gemini-2.5-flash')
print('='*60)

# Clear cache
_task_cache.clear()

# Test
print('\n📤 Sending request to Gemini API...')
start_time = time.time()

result = generate_task('letter', 'N3', 1)

elapsed = time.time() - start_time

print(f'\n⏱️  Response time: {elapsed:.2f} seconds')
print('-'*60)

# Check source
if result['prompts'][0]['prompt'].startswith('日本で'):
    source = '✅ GEMINI API'
else:
    source = '📝 FALLBACK MOCK DATA'

print(f'\n📡 Source: {source}')
print(f'\n📋 Task: {result["title"]}')
print(f'📊 Level: {result["level"]}')
print(f'📝 Prompts: {len(result["prompts"])}')
print(f'\n🎌 First Prompt (Japanese):')
print(result['prompts'][0]['prompt'][:100] + '...')

# Write result to file for inspection
with open('test_result.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print('\n' + '='*60)
print('✅ Test Complete! Result saved to test_result.json')
print('='*60)

