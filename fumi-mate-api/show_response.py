#!/usr/bin/env python3
"""
Show the exact API response for Postman verification.
"""
import requests
import json

print('='*70)
print('📡 SENDING REQUEST TO API...')
print('='*70)
print()
print('POST: http://localhost:8000/api/tasks/generate')
print('Body:', json.dumps({"topic": "letter", "level": "N3", "numQuestions": 1}))
print()
print('='*70)
print('📥 API RESPONSE:')
print('='*70)

# Send request
response = requests.post(
    'http://localhost:8000/api/tasks/generate',
    json={"topic": "letter", "level": "N3", "numQuestions": 1}
)

print(f'Status Code: {response.status_code}')
print()

# Pretty print JSON
data = response.json()
print(json.dumps(data, indent=2, ensure_ascii=False))

print()
print('='*70)
print('✅ THIS IS WHAT YOU SHOULD SEE IN POSTMAN!')
print('='*70)
print()
print('In Postman:')
print('1. Status: 200 OK')
print('2. Body: Same JSON as above')
print('3. Check the "prompt" field for Japanese writing task')
print('4. Check "rubric" for assessment criteria')

