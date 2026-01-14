#!/usr/bin/env python3
"""Test script for Fumi-Mate API"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_register():
    """Test user registration"""
    print("=" * 50)
    print("Testing REGISTER endpoint")
    print("=" * 50)
    
    # Test 1: Register a new student
    url = f"{BASE_URL}/auth/register"
    data = {
        "username": "test_student_py",
        "password": "password123",
        "role": "student"
    }
    
    print(f"\nPOST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 201

def test_login():
    """Test user login"""
    print("\n" + "=" * 50)
    print("Testing LOGIN endpoint")
    print("=" * 50)
    
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "student_hana",
        "password": "password123"
    }
    
    print(f"\nPOST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_me(token):
    """Test get current user"""
    print("\n" + "=" * 50)
    print("Testing ME endpoint")
    print("=" * 50)
    
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nGET {url}")
    print(f"Headers: {headers}")
    
    response = requests.get(url, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 200

def main():
    print("🔧 Fumi-Mate API Test Script")
    print()
    
    # Test register
    if test_register():
        print("\n✅ Register: SUCCESS")
    else:
        print("\n❌ Register: FAILED")
    
    # Test login with existing user
    token = test_login()
    if token:
        print("\n✅ Login: SUCCESS")
        if test_me(token):
            print("\n✅ Me: SUCCESS")
        else:
            print("\n❌ Me: FAILED")
    else:
        print("\n❌ Login: FAILED")

if __name__ == "__main__":
    main()

