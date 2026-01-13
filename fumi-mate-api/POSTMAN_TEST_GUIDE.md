# Postman API Testing Guide

## 🚀 API Endpoint Details

### Generate Japanese Writing Task

**URL:** `POST http://localhost:8000/api/tasks/generate`

**Method:** `POST`

**Content-Type:** `application/json`

---

## 📝 Request Body

### Basic Request (JSON):
```json
{
    "topic": "letter",
    "level": "N3",
    "numQuestions": 1
}
```

### Parameters:
- **topic** (string): Type of writing task
  - Options: `letter`, `speech`, `opinion`, `narrative`, `comparison`
  - Example: `"letter"`

- **level** (string): Japanese proficiency level
  - Options: `N5`, `N4`, `N3`, `N2`, `N1`
  - Example: `"N3"`

- **numQuestions** (integer): Number of writing prompts to generate
  - Range: 1-9
  - Example: `1`

---

## 📋 Example Requests for Different Topics

### 1. Test with Letter Topic
```json
{
    "topic": "letter",
    "level": "N3",
    "numQuestions": 1
}
```

### 2. Test with Opinion Topic
```json
{
    "topic": "opinion",
    "level": "N3",
    "numQuestions": 2
}
```

### 3. Test with Speech Topic
```json
{
    "topic": "speech",
    "level": "N2",
    "numQuestions": 1
}
```

### 4. Test with Multiple Prompts
```json
{
    "topic": "letter",
    "level": "N4",
    "numQuestions": 3
}
```

---

## 🎯 Postman Setup Steps

### Step 1: Start the Server
```bash
cd /Users/tranphuong/Documents/GitHub/fumi-mate-project/fumi-mate-api
python app.py
```

### Step 2: Open Postman

### Step 3: Create New Request
1. Click **"+"** to create a new tab
2. Select **POST** method
3. Enter URL: `http://localhost:8000/api/tasks/generate`

### Step 4: Set Headers
Click **Headers** tab and add:
- **Key:** `Content-Type`
- **Value:** `application/json`

### Step 5: Set Body
Click **Body** tab:
1. Select **"raw"** option
2. Select **JSON** from dropdown
3. Enter your JSON request body

### Step 6: Send Request
Click **Send** button

---

## ✅ Expected Response

### Success Response (200 OK):
```json
{
    "taskId": 1,
    "title": "Japanese Writing Task: Letter",
    "level": "N3",
    "description": "Write in Japanese focusing on letter. Follow the rubric for assessment.",
    "prompts": [
        {
            "id": 1,
            "type": "letter",
            "prompt": "日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
            "wordCount": 500,
            "vocabulary": [
                "ホームスティ",
                "お世話",
                "思い出",
                "感謝",
                "気持ち"
            ],
            "grammar": [
                "〜ました",
                "〜てください",
                "〜と思います"
            ]
        }
    ],
    "rubric": {
        "criteria": [
            {
                "name": "Task Achievement",
                "japanese": "タスク達成度",
                "maxPoints": 25
            },
            {
                "name": "Content & Organization",
                "japanese": "内容・構成",
                "maxPoints": 25
            },
            {
                "name": "Vocabulary & Expression",
                "japanese": "語彙・表現",
                "maxPoints": 25
            },
            {
                "name": "Grammar & Accuracy",
                "japanese": "文法・表記の正確さ",
                "maxPoints": 25
            }
        ]
    }
}
```

### Error Response (400 Bad Request):
```json
{
    "error": "Missing required fields: topic, level, numQuestions"
}
```

---

## 🧪 Quick Test Commands

### Using curl (Terminal):
```bash
curl -X POST http://localhost:8000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "letter", "level": "N3", "numQuestions": 1}'
```

### Using Python:
```python
import requests
import json

response = requests.post(
    'http://localhost:8000/api/tasks/generate',
    json={
        'topic': 'letter',
        'level': 'N3',
        'numQuestions': 1
    }
)

print(json.dumps(response.json(), indent=2, ensure_ascii=False))
```

---

## 📊 Available Topics

| Topic | Japanese | Description | Example Prompts |
|-------|----------|-------------|-----------------|
| letter | 手紙 | Formal/informal letters | Host family, sick friend, advice |
| speech | スピーチ | Oral presentations | Influential words, experiences |
| opinion | 意見・感想 | Opinion essays | Movies, stress, first impressions |
| narrative | ナラティブ | Personal narratives | Failures, experiences |
| comparison | 比較 | Comparison essays | Living arrangements, choices |

---

## 💡 Tips

1. **Start with numQuestions=1** to see the structure
2. **Try different topics** to explore all 9 writing prompts
3. **Use N3 or N4** for intermediate students
4. **Check vocabulary and grammar hints** in each response
5. **Refer to the rubric** for assessment criteria

---

## 🔗 Related Files

- API Code: `routes/tasks.py`
- Service Logic: `services/gemini_service.py`
- Documentation: `docs/debai&tieuchi.md`
- Rubric Guide: `docs/debai&tieuchi.md` (section II)

