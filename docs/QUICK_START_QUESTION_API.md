# Quick Start Guide - Question Generation API

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Python 3.8+
- Flask server running
- Gemini API key (optional - will use mock data if not available)

### Step 1: Set Up Environment

```bash
# Navigate to the API directory
cd fumi-mate-api

# Set your Gemini API key (optional)
echo "GEMINI_API_KEY=your_api_key_here" >> .env

# Install dependencies (if not already done)
pip install -r requirements.txt
```

### Step 2: Start the Server

```bash
# Run the Flask server
python run.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

### Step 3: Test the API

Open a new terminal and run the test script:

```bash
python test_question_generation.py
```

This will automatically test all endpoints!

---

## 📖 Manual Testing with cURL

### 1. Login to Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sensei_akiko",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "sensei_akiko",
    "role": "teacher"
  }
}
```

**Copy the `access_token` for next steps!**

---

### 2. Generate a Question

Replace `YOUR_TOKEN` with the token from step 1:

```bash
curl -X POST http://localhost:5000/api/task/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "genre": "手紙",
    "topic": "ホームステイの思い出",
    "level": "N3"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Question generated and saved successfully",
  "question": {
    "id": 1,
    "genre": "手紙",
    "topic": "ホームステイの思い出",
    "content": "日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい...",
    "level": "N3",
    "required_points": "[\"楽しかった思い出を２つ以上書く\",\"感謝の気持ちを伝える\"]",
    "similarity_hash": "a1b2c3..."
  }
}
```

---

### 3. List All Questions

```bash
curl -X GET http://localhost:5000/api/task/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "total": 5,
  "limit": 50,
  "offset": 0,
  "questions": [
    {
      "id": 1,
      "genre": "手紙",
      "topic": "ホームステイの思い出",
      "content": "日本で１週間ホームスティしました...",
      "level": "N3",
      "required_points": "[...]"
    }
  ]
}
```

---

### 4. Filter Questions

**By genre:**
```bash
curl -X GET "http://localhost:5000/api/task/questions?genre=手紙" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**By level:**
```bash
curl -X GET "http://localhost:5000/api/task/questions?level=N3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Combined filters:**
```bash
curl -X GET "http://localhost:5000/api/task/questions?genre=手紙&level=N3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With pagination:**
```bash
curl -X GET "http://localhost:5000/api/task/questions?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Common Use Cases

### Use Case 1: Generate Multiple Questions

```bash
# Generate a letter question
curl -X POST http://localhost:5000/api/task/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"genre": "手紙", "topic": "友達への手紙", "level": "N3"}'

# Wait 30 seconds (rate limiting)
sleep 30

# Generate a speech question
curl -X POST http://localhost:5000/api/task/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"genre": "スピーチ", "topic": "私の夢", "level": "N2"}'
```

### Use Case 2: Browse Questions by Category

```bash
# Get all letter questions
curl -X GET "http://localhost:5000/api/task/questions?genre=手紙" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all N3 level questions
curl -X GET "http://localhost:5000/api/task/questions?level=N3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 3: Paginate Through Large Result Sets

```bash
# Get first 10 questions
curl -X GET "http://localhost:5000/api/task/questions?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get next 10 questions
curl -X GET "http://localhost:5000/api/task/questions?limit=10&offset=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐍 Python Example

```python
import requests
import time

# Configuration
BASE_URL = "http://localhost:5000/api"

# 1. Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "sensei_akiko",
    "password": "password123"
})
token = response.json()["access_token"]

# 2. Set headers
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 3. Generate a question
response = requests.post(
    f"{BASE_URL}/task/generate-question",
    headers=headers,
    json={
        "genre": "手紙",
        "topic": "ホームステイ",
        "level": "N3"
    }
)
question = response.json()
print(f"Generated question ID: {question['question']['id']}")

# 4. Wait for rate limiting
time.sleep(30)

# 5. Generate another question
response = requests.post(
    f"{BASE_URL}/task/generate-question",
    headers=headers,
    json={
        "genre": "スピーチ",
        "topic": "環境問題",
        "level": "N2"
    }
)

# 6. List all questions
response = requests.get(f"{BASE_URL}/task/questions", headers=headers)
questions = response.json()
print(f"Total questions: {questions['total']}")

# 7. Filter questions
response = requests.get(
    f"{BASE_URL}/task/questions?genre=手紙&level=N3",
    headers=headers
)
filtered = response.json()
print(f"Filtered questions: {filtered['total']}")
```

---

## ⚠️ Important Notes

### Rate Limiting
- **Free Tier:** 1 API call per 30 seconds
- The service automatically waits between requests
- Cached results are returned immediately

### Authentication
- All endpoints require JWT authentication
- `/generate-question` requires **teacher role**
- `/questions` accepts any authenticated user

### Valid Values
**Genres:**
- `手紙` (Letter)
- `スピーチ` (Speech)
- `意見・感想` (Opinion/Impression)

**Levels:**
- `N3`
- `N2`

### Error Codes
- `400` - Bad request (missing/invalid fields)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not a teacher)
- `409` - Conflict (duplicate question)
- `500` - Internal server error

---

## 🔧 Troubleshooting

### Problem: "GEMINI_API_KEY not found"
**Solution:** The API will automatically use mock data. No action needed, or add your API key to `.env`

### Problem: "Rate limiting: waiting X seconds"
**Solution:** This is normal. Wait for the countdown or use cached results.

### Problem: "Unauthorized"
**Solution:** Make sure you're including the JWT token in the Authorization header.

### Problem: "Forbidden - Teacher role required"
**Solution:** Login with a teacher account (e.g., sensei_akiko).

### Problem: "Duplicate question detected"
**Solution:** The question already exists. Try a different topic or wait for cache to clear.

---

## 📚 Next Steps

1. ✅ Test the API with the provided test script
2. ✅ Try generating questions with different genres and topics
3. ✅ Explore filtering and pagination
4. 📖 Read the full documentation in `API_QUESTION_GENERATION.md`
5. 🚀 Integrate with your frontend application

---

## 🆘 Need Help?

- Check `API_QUESTION_GENERATION.md` for detailed documentation
- Run `python test_question_generation.py` for automated testing
- Review `TODO.md` for implementation details
- Check server logs for error messages

---

**Happy Question Generating! 🎉**
