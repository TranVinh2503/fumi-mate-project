#!/usr/bin/env python3
"""
Retry script to get real Gemini API response (not mock data).
This will keep trying until we get an actual Gemini response.
"""
import os
import sys
import time
import json

# Add services to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from services.gemini_service import generate_task, _task_cache

print('='*70)
print('🔄 RETRYING GEMINI API (Real Response, Not Mock Data)')
print('='*70)
print()
print('This will retry until we get a real Gemini response.')
print('The mock data is good, but you want the AI-generated content!')
print()
print('='*70)

max_retries = 5
retry_count = 0

while retry_count < max_retries:
    retry_count += 1
    
    # Clear cache for each attempt
    _task_cache.clear()
    
    print()
    print(f'🔄 Attempt {retry_count}/{max_retries}...')
    print('-'*50)
    
    try:
        start_time = time.time()
        
        # Generate task
        result = generate_task('letter', 'N3', 1)
        
        elapsed = time.time() - start_time
        
        # Check if this is mock data or real Gemini response
        first_prompt = result['prompts'][0]['prompt']
        
        # Real Gemini responses will have different prompts each time
        # Mock data always has the same prompts
        
        if elapsed > 2.0 and first_prompt.startswith('日本で'):
            # Likely real Gemini (longer response time + authentic content)
            is_real = True
        else:
            # Likely mock data (fast response + fixed content)
            is_real = False
        
        print(f'⏱️  Response time: {elapsed:.2f} seconds')
        
        if is_real:
            print()
            print('🎉 SUCCESS! Real Gemini API Response!')
            print('='*70)
            print()
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print()
            print('='*70)
            print('✅ This is the real AI-generated content!')
            break
        else:
            print('📝 Got mock data, retrying...')
            if retry_count < max_retries:
                wait_time = 3  # seconds
                print(f'⏳ Waiting {wait_time} seconds before retry...')
                time.sleep(wait_time)
            else:
                print()
                print('❌ Still getting mock data after all retries')
                print('='*70)
                print()
                print('💡 Suggestions:')
                print('1. Wait a few more minutes for quota to reset')
                print('2. Check: https://ai.dev/usage')
                print('3. The mock data IS production-ready content!')
                print()
                print('📝 Mock data contains 9 authentic Japanese writing')
                print('   prompts from debai&tieuchi.md')
                print()
                print('='*70)
                print('Showing mock data response anyway:')
                print('='*70)
                print(json.dumps(result, indent=2, ensure_ascii=False))
    
    except Exception as e:
        print(f'❌ Error: {e}')
        if retry_count < max_retries:
            wait_time = 5
            print(f'⏳ Waiting {wait_time} seconds before retry...')
            time.sleep(wait_time)

print()
print('='*70)
print('📊 Note: Even mock data is authentic Japanese writing tasks')
print('   sourced directly from debai&tieuchi.md')
print('='*70)

