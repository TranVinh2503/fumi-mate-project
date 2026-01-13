#!/usr/bin/env python3
import requests
import json
import time

def test_generate_task():
    """Test the generate_task API endpoint"""
    url = 'http://localhost:5000/api/tasks/generate'
    
    # Test cases
    test_cases = [
        {
            'name': 'Letter Writing Task',
            'data': {'topic': 'letter', 'level': 'intermediate', 'numQuestions': 2}
        },
        {
            'name': 'Opinion Writing Task', 
            'data': {'topic': 'opinion', 'level': 'beginner', 'numQuestions': 1}
        },
        {
            'name': 'Speech Writing Task',
            'data': {'topic': 'speech', 'level': 'advanced', 'numQuestions': 3}
        }
    ]
    
    for test_case in test_cases:
        print(f"\n=== Testing: {test_case['name']} ===")
        try:
            response = requests.post(url, json=test_case['data'], timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Task Title: {result.get('title', 'N/A')}")
                print(f"Level: {result.get('level', 'N/A')}")
                print(f"Number of Prompts: {len(result.get('prompts', []))}")
                
                # Show first prompt details
                if result.get('prompts'):
                    first_prompt = result['prompts'][0]
                    print(f"First Prompt Type: {first_prompt.get('type', 'N/A')}")
                    print(f"First Prompt: {first_prompt.get('prompt', 'N/A')[:100]}...")
                
                # Show rubric criteria
                rubric = result.get('rubric', {})
                if rubric.get('criteria'):
                    print(f"Rubric Criteria: {len(rubric['criteria'])} criteria")
                    for criterion in rubric['criteria']:
                        print(f"  - {criterion.get('name', 'N/A')} ({criterion.get('japanese', 'N/A')}): {criterion.get('maxPoints', 0)} points")
            else:
                print(f"Error Response: {response.text}")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    print("Waiting for server to be ready...")
    time.sleep(2)
    test_generate_task()
