# Question Generation API Documentation

## Overview
This API provides endpoints for generating Japanese writing questions using Gemini AI and managing them in the QuestionBank database.

## Endpoints

### 1. Generate Task (Existing - Now Fixed)
**Endpoint:** `POST /api/task/generate`

**Description:** Generate a complete task with multiple questions using Gemini AI.

**Authentication:** Not required

**Request Body:**
```json
{
  "topic": "letter",
  "level": "N5",
  "numQuestions": 2
}
```

**Response (200 OK):**
```json
{
  "taskId": 1234567890,
  "title": "Japanese Writing: Letter",
  "level": "N5",
  "description": "Write in Japanese about letter. Follow the rubric for assessment.",
  "prompts": [
    {
      "id": 1,
      "type": "letter",
      "prompt": "日本で１週間ホームスティしました...",
      "wordCount": 500,
      "vocabulary": ["ホームスティ", "お世话", "思い出"],
      "grammar": ["〜ました", "〜てください", "〜と思います"]
    }
  ],
  "rubric": {
    "criteria": [...]
  }
}
```

---

### 2. Generate Single Question (NEW)
**Endpoint:** `POST /api/task/generate-question`

**Description:** Generate a single question and save it to QuestionBank database.

**Authentication:** Required (JWT token)

**Authorization:** Teacher role only

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "genre": "手紙",
  "topic": "ホームステイ",
  "level": "N3"
}
```

**Valid Values:**
- `genre`: "手紙" (letter), "スピーチ" (speech), "意見・感想" (opinion/impression)
- `level`: "N3", "N2"
- `topic`: Any string describing the topic

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Question generated and saved successfully",
  "question": {
    "id": 123,
    "genre": "手紙",
    "topic": "ホームステイ",
    "content": "日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい...",
    "level": "N3",
    "required_points": "[\"楽しかった思い出を２つ以上書く\",\"感謝の気持ちを伝える\",\"また会いたい気持ちを伝える\"]",
    "similarity_hash": "a1b2c3d4e5f6..."
  }
}
```

**Error Responses:**

400 Bad Request - Missing or invalid fields:
```json
{
  "error": "Missing required fields: genre, topic, level"
}
```

400 Bad Request - Invalid genre:
```json
{
  "error": "Invalid genre. Must be one of: 手紙, スピーチ, 意見・感想"
}
```

400 Bad Request - Invalid level:
```json
{
  "error": "Invalid level. Must be one of: N3, N2"
}
```

409 Conflict - Duplicate question:
```json
{
  "error": "A similar question already exists in the database",
  "details": "This question appears to be a duplicate based on content similarity"
}
```

---

### 3. List Questions (NEW)
**Endpoint:** `GET /api/task/questions`

**Description:** Retrieve all questions from QuestionBank with optional filtering and pagination.

**Authentication:** Required (JWT token)

**Authorization:** Any authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `genre` (optional): Filter by genre ("手紙", "スピーチ", "意見・感想")
- `level` (optional): Filter by level ("N3", "N2")
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Requests:**
```
GET /api/task/questions
GET /api/task/questions?genre=手紙
GET /api/task/questions?level=N3
GET /api/task/questions?genre=手紙&level=N3
GET /api/task/questions?limit=10&offset=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "total": 150,
  "limit": 50,
  "offset": 0,
  "questions": [
    {
      "id": 1,
      "genre": "手紙",
      "topic": "ホームステイ",
      "content": "日本で１週間ホームスティしました...",
      "level": "N3",
      "required_points": "[\"楽しかった思い出を２つ以上書く\",\"感謝の気持ちを伝える\"]"
    },
    {
      "id": 2,
      "genre": "スピーチ",
      "topic": "人生の言葉",
      "content": "あなたの人生や考え方に大きな影響を...",
      "level": "N2",
      "required_points": "[\"言葉との出会いを説明する\",\"その意味を述べる\"]"
    }
  ]
}
```

---

## Features

### 1. Gemini AI Integration
- Uses Google's Gemini 2.5 Flash model
- Generates authentic Japanese writing prompts
- Includes required points (mandatory ideas) for each question
- Falls back to mock data if API fails

### 2. Rate Limiting
- Free tier optimization: 1 API call per 30 seconds
- Thread-safe concurrent access control
- Automatic waiting between requests

### 3. Caching
- Response caching to reduce API calls
- Cache key based on genre, topic, and level
- Improves performance for repeated requests

### 4. Deduplication
- SHA-256 hash of question content
- Prevents duplicate questions in database
- Returns 409 Conflict if duplicate detected

### 5. Error Handling
- Graceful fallback to mock data
- Detailed error messages
- Database transaction rollback on errors

---

## Testing Examples

### Using cURL

**Generate a question:**
```bash
curl -X POST http://localhost:5000/api/task/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "genre": "手紙",
    "topic": "ホームステイ",
    "level": "N3"
  }'
```

**List all questions:**
```bash
curl -X GET http://localhost:5000/api/task/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**List filtered questions:**
```bash
curl -X GET "http://localhost:5000/api/task/questions?genre=手紙&level=N3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Python

```python
import requests

# Login first to get JWT token
login_response = requests.post('http://localhost:5000/api/auth/login', json={
    'username': 'sensei_akiko',
    'password': 'password123'
})
token = login_response.json()['access_token']

# Generate a question
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'http://localhost:5000/api/task/generate-question',
    headers=headers,
    json={
        'genre': '手紙',
        'topic': 'ホームステイ',
        'level': 'N3'
    }
)

print(response.json())
```

---

## Environment Variables

Make sure to set the following environment variable:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

---

## Database Schema

The questions are stored in the `question_bank` table:

```sql
CREATE TABLE question_bank (
    id INTEGER PRIMARY KEY,
    genre ENUM('手紙', 'スピーチ', '意見・感想') NOT NULL,
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    level ENUM('N3', 'N2') NOT NULL,
    required_points TEXT NOT NULL,
    similarity_hash VARCHAR(64) UNIQUE NOT NULL
);
```

---

## Notes

1. **Rate Limiting:** The free tier of Gemini API has rate limits. The service automatically waits between requests.

2. **Caching:** Questions are cached in memory. Restart the server to clear the cache.

3. **Mock Data:** If Gemini API fails or is unavailable, the service automatically falls back to predefined mock questions.

4. **Authentication:** The `/generate-question` endpoint requires teacher authentication. Make sure to include a valid JWT token.

5. **Deduplication:** The similarity hash prevents exact duplicates. Similar questions with different wording will still be saved.
