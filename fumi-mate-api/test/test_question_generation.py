"""
Test script for Question Generation API
Run this after starting the Flask server to test the new endpoints.
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5001/api"
TEST_USERNAME = "sensei_akiko"
TEST_PASSWORD = "password123"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_response(response):
    """Pretty print JSON response"""
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)
    print(f"\nStatus Code: {response.status_code}")

def test_login():
    """Test login and get JWT token"""
    print_section("1. Testing Login")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        }
    )
    
    print_response(response)
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        print(f"\n✅ Login successful! Token: {token[:20]}...")
        return token
    else:
        print("\n❌ Login failed!")
        return None

def test_generate_task(token):
    """Test the existing /generate endpoint"""
    print_section("2. Testing Task Generation (Existing Endpoint)")
    
    response = requests.post(
        f"{BASE_URL}/task/generate",
        json={
            "topic": "letter",
            "level": "N5",
            "numQuestions": 1
        }
    )
    
    print_response(response)
    
    if response.status_code == 200:
        print("\n✅ Task generation successful!")
    else:
        print("\n❌ Task generation failed!")

def test_generate_question(token, genre, topic, level):
    """Test the new /generate-question endpoint"""
    print_section(f"3. Testing Question Generation: {genre} - {topic} ({level})")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/task/generate-question",
        headers=headers,
        json={
            "genre": genre,
            "topic": topic,
            "level": level
        }
    )
    
    print_response(response)
    
    if response.status_code == 201:
        question_id = response.json().get('question', {}).get('id')
        print(f"\n✅ Question generated and saved! ID: {question_id}")
        return question_id
    else:
        print("\n❌ Question generation failed!")
        return None

def test_list_questions(token, filters=None):
    """Test the /questions endpoint"""
    print_section("4. Testing List Questions")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    url = f"{BASE_URL}/task/questions"
    if filters:
        params = "&".join([f"{k}={v}" for k, v in filters.items()])
        url += f"?{params}"
        print(f"Filters: {filters}")
    
    response = requests.get(url, headers=headers)
    
    print_response(response)
    
    if response.status_code == 200:
        total = response.json().get('total', 0)
        print(f"\n✅ Retrieved {total} questions")
    else:
        print("\n❌ Failed to retrieve questions!")

def test_duplicate_question(token, genre, topic, level):
    """Test duplicate detection"""
    print_section("5. Testing Duplicate Detection")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("Attempting to create the same question again...")
    
    response = requests.post(
        f"{BASE_URL}/task/generate-question",
        headers=headers,
        json={
            "genre": genre,
            "topic": topic,
            "level": level
        }
    )
    
    print_response(response)
    
    if response.status_code == 409:
        print("\n✅ Duplicate detection working correctly!")
    elif response.status_code == 201:
        print("\n⚠️  Warning: Duplicate was not detected (might be different content from Gemini)")
    else:
        print("\n❌ Unexpected response!")

def test_invalid_requests(token):
    """Test error handling"""
    print_section("6. Testing Error Handling")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Missing fields
    print("\nTest 6.1: Missing required fields")
    response = requests.post(
        f"{BASE_URL}/task/generate-question",
        headers=headers,
        json={"genre": "手紙"}
    )
    print(f"Status: {response.status_code} - {response.json().get('error')}")
    
    # Test 2: Invalid genre
    print("\nTest 6.2: Invalid genre")
    response = requests.post(
        f"{BASE_URL}/task/generate-question",
        headers=headers,
        json={
            "genre": "invalid_genre",
            "topic": "test",
            "level": "N3"
        }
    )
    print(f"Status: {response.status_code} - {response.json().get('error')}")
    
    # Test 3: Invalid level
    print("\nTest 6.3: Invalid level")
    response = requests.post(
        f"{BASE_URL}/task/generate-question",
        headers=headers,
        json={
            "genre": "手紙",
            "topic": "test",
            "level": "N5"
        }
    )
    print(f"Status: {response.status_code} - {response.json().get('error')}")
    
    print("\n✅ Error handling tests completed!")

def main():
    """Run all tests"""
    print("\n" + "🚀 "*20)
    print("  QUESTION GENERATION API TEST SUITE")
    print("🚀 "*20)
    
    # Step 1: Login
    token = test_login()
    if not token:
        print("\n❌ Cannot proceed without authentication token!")
        return
    
    # Step 2: Test existing task generation
    test_generate_task(token)
    
    # Wait for rate limiting
    print("\n⏳ Waiting 30 seconds for rate limiting...")
    time.sleep(30)
    
    # Step 3: Test new question generation
    question_id = test_generate_question(token, "手紙", "ホームステイの思い出", "N3")
    
    # Wait for rate limiting
    print("\n⏳ Waiting 30 seconds for rate limiting...")
    time.sleep(30)
    
    # Step 4: Test another question
    test_generate_question(token, "スピーチ", "人生の教訓", "N2")
    
    # Step 5: List all questions
    test_list_questions(token)
    
    # Step 6: List filtered questions
    test_list_questions(token, {"genre": "手紙", "level": "N3"})
    
    # Step 7: Test duplicate detection (using cache)
    if question_id:
        test_duplicate_question(token, "手紙", "ホームステイの思い出", "N3")
    
    # Step 8: Test error handling
    test_invalid_requests(token)
    
    print("\n" + "✅ "*20)
    print("  ALL TESTS COMPLETED!")
    print("✅ "*20 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
