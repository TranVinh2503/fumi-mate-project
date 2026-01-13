# API Testing Guide for Japanese Writing Tasks

## Overview
The updated `generate_task` API now generates Japanese writing tasks instead of multiple choice questions. The API is located at `/api/tasks/generate`.

## API Endpoint
```
POST http://localhost:5000/api/tasks/generate
```

## Request Format
```json
{
  "topic": "letter",        // Options: letter, speech, opinion, narrative, comparison
  "level": "intermediate",   // Options: beginner, intermediate, advanced
  "numQuestions": 2          // Number of writing prompts to generate
}
```

## Response Structure
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

## Quick Test Requests

### 1. Letter Writing Task (2 prompts)
```json
{
  "topic": "letter",
  "level": "intermediate",
  "numQuestions": 2
}
```

### 2. Opinion Essay (1 prompt)
```json
{
  "topic": "opinion",
  "level": "beginner",
  "numQuestions": 1
}
```

### 3. Speech Writing (1 prompt)
```json
{
  "topic": "speech",
  "level": "intermediate",
  "numQuestions": 1
}
```

### 4. Narrative Writing (1 prompt)
```json
{
  "topic": "narrative",
  "level": "advanced",
  "numQuestions": 1
}
```

### 5. Comparison Essay (1 prompt)
```json
{
  "topic": "comparison",
  "level": "beginner",
  "numQuestions": 1
}
```

## Available Topics
- **letter**: Japanese letter writing (手紙)
- **speech**: Speech/presentation writing (スピーチ)
- **opinion**: Opinion and impression essays (意見・感想)
- **narrative**: Narrative/descriptive writing
- **comparison**: Comparison and contrast essays

## Available Levels
- **beginner**: N5-N4 level vocabulary and grammar
- **intermediate**: N4-N3 level vocabulary and grammar
- **advanced**: N3-N2 level vocabulary and grammar

## Features
- Each prompt includes authentic Japanese writing tasks
- Vocabulary lists with relevant terms
- Grammar patterns to focus on
- Complete 4-criteria assessment rubric
- 500-character word count requirement
- Topic-based filtering

## Error Handling
The API will return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (missing or invalid parameters)
- 500: Internal Server Error

## Note
If the Gemini API key is not configured or fails, the API will automatically fall back to the mock data with predefined Japanese writing prompts from the `debai&tieuchi.md` document.
