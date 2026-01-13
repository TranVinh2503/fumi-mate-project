# Manual Testing Guide - Japanese Writing Tasks API

## Quick Manual Test

If the Postman collection doesn't import, you can test manually:

### 1. Start the API Server
```bash
cd fumi-mate-api
python app.py
```

### 2. Test with cURL (Terminal)

**Letter Writing Task:**
```bash
curl -X POST http://localhost:5000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "letter", "level": "intermediate", "numQuestions": 2}'
```

**Opinion Writing Task:**
```bash
curl -X POST http://localhost:5000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "opinion", "level": "beginner", "numQuestions": 1}'
```

**Speech Writing Task:**
```bash
curl -X POST http://localhost:5000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "speech", "level": "intermediate", "numQuestions": 1}'
```

### 3. Manual Postman Setup

If you prefer to create requests manually in Postman:

1. **Create New Request**
   - Method: POST
   - URL: `http://localhost:5000/api/tasks/generate`
   - Headers: `Content-Type: application/json`

2. **Body (Raw JSON):**
   ```json
   {
     "topic": "letter",
     "level": "intermediate", 
     "numQuestions": 2
   }
   ```

### 4. Expected Response

You should receive a JSON response like:
```json
{
  "taskId": 1,
  "title": "Japanese Writing Task: Letter",
  "level": "INTERMEDIATE",
  "description": "Write in Japanese focusing on letter. Follow the rubric for assessment.",
  "prompts": [
    {
      "id": 1,
      "type": "letter",
      "prompt": "日本で１週間ホームスティしました...",
      "wordCount": 500,
      "vocabulary": ["ホームスティ", "お世話", "思い出"],
      "grammar": ["〜ました", "〜てください", "〜と思います"]
    }
  ],
  "rubric": {
    "criteria": [
      {
        "name": "Task Achievement",
        "japanese": "タスク達成度",
        "maxPoints": 25,
        "description": "Focus: correct format, appropriate audience, required content, suitable length",
        "levels": {
          "excellent": "22-25: Fully meets requirements with clear communication purpose",
          "good": "17-21: Meets most requirements with minor issues",
          "satisfactory": "12-16: Partially meets requirements",
          "needsImprovement": "0-11: Does not meet basic requirements"
        }
      }
      // ... 3 more criteria
    ]
  }
}
```

## Available Test Parameters

### Topics:
- `letter` - Japanese letter writing
- `speech` - Speech/presentation writing  
- `opinion` - Opinion and impression essays
- `narrative` - Narrative/descriptive writing
- `comparison` - Comparison and contrast essays

### Levels:
- `beginner` - N5-N4 level
- `intermediate` - N4-N3 level
- `advanced` - N3-N2 level

### numQuestions:
- Any positive integer (1-9 recommended)

## Troubleshooting

**Port already in use?**
- Kill existing processes: `killall python`
- Or use a different port in `app.py`

**Connection refused?**
- Make sure the server is running
- Check that port 5000 is available
- Try: `curl http://localhost:5000` to test basic connectivity

**Wrong response format?**
- The API now returns writing tasks with prompts and rubric
- Response structure has changed from "questions" to "prompts"
- Each prompt includes Japanese text, vocabulary, and grammar patterns
