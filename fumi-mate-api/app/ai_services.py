import json
from typing import Dict, Any, Optional
import re

def generate_ai_feedback(content: str, task=None, difficulty: str = 'N3') -> Dict[str, Any]:
    """
    Priority 1: Rubric Gemini grading (task.task_type_id)
    Priority 2: Dynamic heuristic fallback 
    Snake_case JSON output + DEBUG logs
    """
    print(f"[AI-FEEDBACK] Content length: {len(content)} | Task: {task.task_type_id if task else None} | Difficulty: {difficulty}")
    
    try:
        from app.services.gemini_service import grade_writing_submission
        
        # Priority 1: Use rubric-based Gemini grading
        if task and task.task_type_id is not None:
            print("[AI-FEEDBACK] Using GEMINI RUBRIC (task_type_id)")
            try:
                feedback = grade_writing_submission(task.task_type_id, content, difficulty=difficulty)
                feedback['grading_method'] = feedback.get('grading_method') or 'gemini_rubric'
                feedback['overall_score'] = feedback.get('total_score') or feedback.get('overall_score', 0)
                print(f"[AI-FEEDBACK] ✅ GEMINI success: {feedback.get('overall_score', 0)}")
                return _standardize_snake_case(feedback)
            except Exception as gemini_err:
                print(f"[AI-FEEDBACK] ❌ GEMINI failed ({gemini_err}) → FALLBACK")
        
        # Priority 2: Dynamic heuristic fallback
        print("[AI-FEEDBACK] Using HEURISTIC FALLBACK")
        result = _calculate_heuristic_score(content, difficulty)
        result['grading_method'] = 'heuristic_dynamic'
        print(f"[AI-FEEDBACK] ✅ HEURISTIC: {result['overall_score']}")
        return result
        
    except ImportError as ie:
        print(f"[AI-FEEDBACK] ❌ ImportError ({ie}) → HEURISTIC")
        result = _calculate_heuristic_score(content, difficulty)
        result['grading_method'] = 'heuristic_fallback'
        return result
    except Exception as e:
        print(f"[AI-FEEDBACK] ❌ CRITICAL ERROR ({e})")
        result = _get_error_feedback()
        result['grading_method'] = 'error'
        return result

def _calculate_heuristic_score(content: str, difficulty: str = 'N3') -> Dict[str, Any]:
    # \"\"\"
    # Dynamic scoring based on:
    # - Content length (30pts)
    # - Japanese chars (30pts)  
    # - Sentence variety (25pts)
    # - Difficulty adjustment
    # \"\"\"
    content = content.strip()
    content_length = len(content)
    
    # Japanese character count
    japanese_chars = len(re.findall(r'[\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9fff]', content))
    
    # Sentence count (periods, etc.)
    sentences = len(re.split(r'[。！？]', content))
    
    # Score components
    length_score = min(30, content_length * 0.1)  # 30pts max
    jp_chars_score = min(30, japanese_chars * 1.5)  # 30pts max
    sentence_score = min(25, sentences * 4)  # 25pts max
    fluency_score = min(15, (content_length / 20) * (sentences / 5))  # Bonus
    
    base_score = length_score + jp_chars_score + sentence_score + fluency_score
    
    # Difficulty adjustment
    multipliers = {'N5': 0.8, 'N4': 0.9, 'N3': 1.0, 'N2': 1.1, 'N1': 1.2}
    multiplier = multipliers.get(difficulty, 1.0)
    overall_score = round(min(100, base_score * multiplier), 1)
    
    # Dynamic feedback
    feedback_parts = []
    if content_length < 100:
        feedback_parts.append("Write longer content for better expression")
    elif content_length > 300:
        feedback_parts.append("Excellent length!")
    
    if japanese_chars < 15:
        feedback_parts.append("Add more Japanese vocabulary")
    elif japanese_chars > 50:
        feedback_parts.append("Great use of Japanese characters!")
    
    if sentences < 3:
        feedback_parts.append("Use complete sentences")
    
    feedback_text = f"Length: {content_length} chars, {japanese_chars} JP chars, {sentences} sentences. " + " | ".join(feedback_parts)
    
    grade = "A" if overall_score >= 90 else "B" if overall_score >= 80 else "C" if overall_score >= 70 else "D" if overall_score >= 60 else "F"
    
    strengths = ["Good effort"] + (["Good Japanese usage"] if japanese_chars > 20 else [])
    improvements = ["Practice consistently"] + (["More vocabulary"] if japanese_chars < 15 else [])
    
    return {
        "feedback_text": feedback_text.strip(),
        "overall_score": overall_score,
        "grade": grade,
        "criteria_scores": _heuristic_7_criteria_scores(overall_score),
        "strengths": strengths,
        "improvements": improvements,
        "action_plan": [
            "Write 200+ characters daily",
            "Learn 10 new words per topic",
            "Practice varied sentence structures"
        ],
        "practice_exercises": [
            {
                "title": f"Daily Journal ({difficulty})",
                "description": "Write 150 chars about your day"
            }
        ],
        "detailed_analysis": {}
    }

def _heuristic_7_criteria_scores(overall_score: float) -> Dict[str, float]:
    weights = {
        "1": 0.15,
        "2": 0.15,
        "3": 0.15,
        "4": 0.20,
        "5": 0.15,
        "6": 0.10,
        "7": 0.10,
    }
    return {criterion_id: round(overall_score * weight, 1) for criterion_id, weight in weights.items()}

def _standardize_snake_case(feedback: Dict[str, Any]) -> Dict[str, Any]:
    # \"\"\"
    # Convert camelCase keys to snake_case for DB/frontend consistency
    # \"\"\"
    snake_map = {
        'overallScore': 'overall_score',
        'criteriaScores': 'criteria_scores', 
        'feedBackText': 'feedback_text',
        'actionPlan': 'action_plan',
        'practiceExercises': 'practice_exercises',
        'detailedAnalysis': 'detailed_analysis',
        'totalScore': 'overall_score'
    }
    
    result = {}
    for key, value in feedback.items():
        new_key = snake_map.get(key, key.lower().replace(' ', '_'))
        result[new_key] = value
    
    return result

def _get_error_feedback() -> Dict[str, Any]:

    return {
        "feedback_text": "Grading service temporarily unavailable. Content saved successfully.",
        "overall_score": 0,
        "grade": "N/A",
        "action_plan": ["Please try again later"],
        "practice_exercises": [],
        "detailed_analysis": {},
        "criteria_scores": {str(i): 0 for i in range(1, 8)},
        "strengths": [],
        "improvements": []
    }
