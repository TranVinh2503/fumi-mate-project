import os
import google.generativeai as genai
from typing import Dict, List, Any
import json

def generate_task(topic: str, level: str, num_questions: int) -> Dict[str, Any]:
    """
    Generate a task with questions and answers using Gemini AI.
    Falls back to mock data if Gemini fails.
    """
    try:
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Create prompt
        prompt = f"""
        Generate a Japanese language learning task for {level} level students.
        Topic: {topic}
        Number of questions: {num_questions}

        Create {num_questions} multiple-choice or fill-in-the-blank questions related to the topic.
        Each question should have:
        - A unique ID (starting from 1)
        - The question text
        - The correct answer

        Format the response as JSON:
        {{
            "taskId": 1,
            "title": "Task Title",
            "questions": [
                {{
                    "id": 1,
                    "question": "Question text here?",
                    "answer": "Correct answer here"
                }},
                ...
            ]
        }}

        Make sure the questions are appropriate for {level} level and relevant to {topic}.
        """

        # Generate content
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Try to parse JSON
        if result_text.startswith('```json'):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith('```'):
            result_text = result_text[3:-3].strip()

        task_data = json.loads(result_text)

        # Validate structure
        if not all(key in task_data for key in ['taskId', 'title', 'questions']):
            raise ValueError("Invalid response structure")

        return task_data

    except Exception as e:
        print(f"Gemini API error: {e}")
        print(f"API Key present: {bool(os.getenv('GEMINI_API_KEY'))}")
        # Fallback to mock data
        return generate_mock_task(topic, level, num_questions)

def generate_mock_task(topic: str, level: str, num_questions: int) -> Dict[str, Any]:
    """
    Generate mock task data when Gemini fails.
    """
    # Define Japan-specific questions based on level
    japan_questions = {
        "beginner": [
            {"question": "What is the capital city of Japan?", "answer": "Tokyo"},
            {"question": "How do you say 'hello' in Japanese?", "answer": "Konnichiwa"},
            {"question": "What is the name of Japan's currency?", "answer": "Yen"},
            {"question": "What is sushi made of?", "answer": "Rice and fish"},
            {"question": "What is the traditional Japanese garment called?", "answer": "Kimono"}
        ],
        "intermediate": [
            {"question": "What does 'arigatou gozaimasu' mean?", "answer": "Thank you very much"},
            {"question": "Which mountain is considered sacred in Japan?", "answer": "Mount Fuji"},
            {"question": "What is the name of the bullet train in Japan?", "answer": "Shinkansen"},
            {"question": "What festival celebrates the cherry blossoms?", "answer": "Hanami"},
            {"question": "What is the traditional Japanese tea ceremony called?", "answer": "Chanoyu"}
        ],
        "advanced": [
            {"question": "What does 'omotenashi' mean in Japanese culture?", "answer": "Hospitality"},
            {"question": "What is the significance of Mount Fuji in Japanese culture?", "answer": "It represents purity and is a symbol of Japan"},
            {"question": "What is 'tatemae' and 'honne' in Japanese communication?", "answer": "Tatemae is public face/behavior, honne is true feelings"},
            {"question": "What is the concept of 'wa' in Japanese society?", "answer": "Harmony and peace"},
            {"question": "What is the meaning of 'giri' and 'ninjo'?", "answer": "Giri is duty/obligation, ninjo is human emotion"}
        ]
    }

    questions = []
    if topic.lower() == "japan":
        # Use Japan-specific questions
        level_questions = japan_questions.get(level.lower(), japan_questions["beginner"])
        for i in range(num_questions):
            q = level_questions[i % len(level_questions)]
            questions.append({
                "id": i + 1,
                "question": q["question"],
                "answer": q["answer"]
            })
    else:
        # Fallback to generic mock questions
        for i in range(1, num_questions + 1):
            questions.append({
                "id": i,
                "question": f"Mock question {i} about {topic} for {level} level?",
                "answer": f"Mock answer {i}"
            })

    return {
        "taskId": 1,
        "title": f"Japanese Language Task: {topic} ({level})",
        "questions": questions
    }
