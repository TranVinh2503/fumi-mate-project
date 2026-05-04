import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Dict, List, Any, Optional
import json
import time
import threading
import hashlib
# Rate limiting for free tier
from pathlib import Path
_rate_limit_lock = threading.Lock()
_last_api_call = 0
GEMINI_RATE_LIMIT_SECONDS = 30
# ... các thư viện khác
load_dotenv()
# Cache for free tier
_task_cache = {}

# Predefined vocabulary and grammar hints for each topic
TOPIC_HINTS = {
    "letter": {
        "vocabulary": ["ホームスティ", "お世话", "思い出", "感謝", "気持ち", "ホストファミリー"],
        "grammar": ["〜ました", "〜てください", "〜と思います", "〜すぎます", "〜なければなりません"]
    },
    "speech": {
        "vocabulary": ["人生", "考え方", "影響", "出会い", "意味", "価値観"],
        "grammar": ["〜あげた", "〜について", "〜ために", "〜ようになりました", "〜の一番"]
    },
    "opinion": {
        "vocabulary": ["映画", "感想", "場面", "理由", "学んだ", "現代", "問題"],
        "grammar": ["〜について", "〜の原因", "〜べき", "と考えられる", "ではないでしょうか"]
    },
    "narrative": {
        "vocabulary": ["経験", "失敗", "気持ち", "立ち直る", "乗り越える", "教训"],
        "grammar": ["〜たことがあります", "〜ようになった", "〜なければなりません", "〜からこそ"]
    },
    "comparison": {
        "vocabulary": ["メリット", "デメリット", "比較", "一方", "それぞれ", "結論"],
        "grammar": ["〜に対して", "〜より", "〜と同じくらい", "に違いはがありません", "各有"]
    }
}

# Default hints for unknown topics
DEFAULT_HINTS = {
    "vocabulary": ["日本語", "作文", "表現", "文法", "語彙"],
    "grammar": ["〜たい", "〜と思います", "〜なければなりません", "例如"]
}

def generate_task(topic: str, level: str, num_questions: int) -> Dict[str, Any]:
    """
    Generate a Japanese writing task with prompts and rubric using Gemini AI.
    
    Flow:
    1. Gemini returns plain text (Japanese writing prompt)
    2. Backend constructs full JSON structure
    3. Fall back to mock data on error
    
    Optimized for free tier with:
    - Rate limiting (1 call per 30 seconds)
    - Thread-safe concurrent access control
    - Response caching
    - Short prompt + low tokens (free tier friendly)
    """
    # Check cache first
    cache_key = f"{topic}:{level}:{num_questions}"
    if cache_key in _task_cache:
        print("✅ Using cached result")
        return _task_cache[cache_key]
    
    with _rate_limit_lock:
        current_time = time.time()
        global _last_api_call
        time_since_last_call = current_time - _last_api_call
        
        if time_since_last_call < GEMINI_RATE_LIMIT_SECONDS:
            wait_time = GEMINI_RATE_LIMIT_SECONDS - time_since_last_call
            print(f"⏳ Rate limiting: waiting {wait_time:.1f} seconds...")
            time.sleep(wait_time)
        
        _last_api_call = time.time()
        
        # Generate prompt text from Gemini (plain text only)
        prompt_text = _call_gemini_for_prompt(topic, level, num_questions)
        
        # Construct JSON structure (backend handles this)
        task_data = _construct_task_json(topic, level, num_questions, prompt_text)
        
        # Cache and return
        _task_cache[cache_key] = task_data
        print("✅ Task generated successfully")
        return task_data

def _call_gemini_for_prompt(topic: str, level: str, num_questions: int) -> Optional[str]:
    """
    Call Gemini API to get plain text Japanese writing prompt.
    Returns None if API fails (will use mock data).
    
    Key: Gemini returns PLAIN TEXT only, not JSON!
    """
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Plain text prompt (NOT JSON) - simple and reliable
        prompt = f"""Write a Japanese writing prompt for {level} level students.
Topic: {topic}
Type: Write 1 creative Japanese writing prompt (letter, speech, opinion, narrative, or comparison).
Language: Japanese only, 200-300 characters.
Content: Include context, situation, and what to write about.

Output: Just the Japanese text, nothing else. No JSON, no markdown, no explanations.

Example:
日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。
"""

        print(f"🔄 Calling Gemini API for plain text prompt...")
        
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.7,
                'max_output_tokens': 150,  # Very short - just the prompt text
            }
        )
        
        # Get plain text - NO JSON parsing needed!
        result_text = response.text.strip()
        
        # Clean up any accidental markdown
        result_text = result_text.strip()
        if result_text.startswith('```'):
            lines = result_text.split('\n')
            result_text = '\n'.join(lines[1:-1]) if len(lines) > 2 else lines[0]
        
        print(f"✅ Gemini returned plain text: {result_text[:50]}...")
        return result_text
        
    except Exception as e:
        print(f"⚠️  Gemini API error: {e}")
        return None

def _construct_task_json(topic: str, level: str, num_questions: int, prompt_text: Optional[str]) -> Dict[str, Any]:
    """
    Construct full JSON task structure in backend.
    Uses Gemini text if available, otherwise mock data.
    """
    # Get hints for this topic
    hints = TOPIC_HINTS.get(topic.lower(), DEFAULT_HINTS)
    
    # Use Gemini prompt or fallback to mock
    if prompt_text and len(prompt_text) > 10:
        prompts_list = [
            {
                "id": 1,
                "type": topic.lower(),
                "prompt": prompt_text,
                "wordCount": 500,
                "vocabulary": hints["vocabulary"][:5],
                "grammar": hints["grammar"][:3]
            }
        ]
    else:
        # Use mock prompts
        prompts_list = _get_mock_prompts(topic, num_questions)
    
    # Construct full rubric
    rubric = _get_rubric()
    
    return {
        "taskId": int(time.time()),
        "title": f"Japanese Writing: {topic.title()}",
        "level": level.upper(),
        "description": f"Write in Japanese about {topic}. Follow the rubric for assessment.",
        "prompts": prompts_list,
        "rubric": rubric
    }

def _get_mock_prompts(topic: str, num_questions: int) -> List[Dict[str, Any]]:
    """Get mock prompts from predefined list."""
    writing_prompts = [
        {
            "id": 1,
            "type": "letter",
            "prompt": "日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
            "wordCount": 500,
            "vocabulary": ["ホームスティ", "お世话", "思い出", "感謝", "気持ち"],
            "grammar": ["〜ました", "〜てください", "〜と思います"]
        },
        {
            "id": 2,
            "type": "speech",
            "prompt": "あなたの人生や考え方に大きな影響をあたえた「言葉」や「一文」を一つえらび、その言葉との出会い、意味、その言葉のおかげで変わった方法について話しなさい。",
            "wordCount": 500,
            "vocabulary": ["人生", "考え方", "影響", "出会い", "意味"],
            "grammar": ["〜あげた", "〜について", "〜ため"]
        },
        {
            "id": 3,
            "type": "opinion",
            "prompt": "最近、１本の映画を見ました。その映画について感想を書きなさい。いちばん心に残った場面を説明して、その理由と、映画から学んだことをまとめましょう。",
            "wordCount": 500,
            "vocabulary": ["映画", "感想", "場面", "理由", "学んだ"],
            "grammar": ["〜しました", "〜について", "〜ましょう"]
        },
        {
            "id": 4,
            "type": "letter",
            "prompt": "クラスメートがしばらく病気で学校を休んでいます。その友だちに、心配している気持ちと早くよくなってほしい気持ちを伝える手紙を書きなさい。最近のクラスのようすも少し知らせてあげましょう。",
            "wordCount": 500,
            "vocabulary": ["クラスメート", "病気", "学校", "心配", "気持ち"],
            "grammar": ["〜ています", "〜してください", "〜あげましょう"]
        },
        {
            "id": 5,
            "type": "narrative",
            "prompt": "あなたがこれまでに経験した「失敗」の中で、今でもよくおぼえているものを一つえらびなさい。そのときどんな失敗をして、どんな気持ちになり、どうやって立ち直ったのか、そしてその経験から何を学んだのかを、具体的に話しなさい。",
            "wordCount": 500,
            "vocabulary": ["経験", "失敗", "気持ち", "立ち直る", "学んだ"],
            "grammar": ["〜した", "どんな", "〜たのか", "〜か"]
        },
        {
            "id": 6,
            "type": "opinion",
            "prompt": "現代の学生が抱えているストレスについて、あなたの考えを書きなさい。どんなストレスがあるのか、具体的な例を挙げて説明し、その原因と、ストレスを減らすために学生ができることについても書きましょう。",
            "wordCount": 500,
            "vocabulary": ["現代", "学生", "ストレス", "原因", "減らす"],
            "grammar": ["〜について", "どんな", "〜ために", "〜ましょう"]
        },
        {
            "id": 7,
            "type": "letter",
            "prompt": "高校の後輩が「大学日本語学科で勉強しようかどうか」迷っています。その後輩にカウンセラーの手紙を書きなさい。日本語学科のよい点と困った点を説明して、アドバイスをしましょう。",
            "wordCount": 500,
            "vocabulary": ["高校", "後輩", "大学", "日本語", "学科"],
            "grammar": ["〜かどうか", "〜迷って", "〜してください"]
        },
        {
            "id": 8,
            "type": "opinion",
            "prompt": "人はよく「第一印象が大事だ」と言いますが、見た目だけで人を判断してしまうこともあります。あなたは外見で人を決めつけてしまったことがありますか。その経験を振り返りながら、この問題について考えを述べなさい。",
            "wordCount": 500,
            "vocabulary": ["第一印象", "見た目", "判断", "外見", "経験"],
            "grammar": ["〜ですが", "〜こともあります", "〜ながら"]
        },
        {
            "id": 9,
            "type": "comparison",
            "prompt": "大学生にとって、一人暮らしと実家暮らしはどちらがよいと思いますか、自分や友だちの経験を含めて、それぞれのメリット・デメリットを書き、あなたの考えをしっかり書きなさい。",
            "wordCount": 500,
            "vocabulary": ["大学生", "一人暮らし", "実家暮らし", "メリット", "デメリット"],
            "grammar": ["〜にとって", "どちら", "〜と思います", "〜てください"]
        }
    ]
    
    # Return prompts for the topic
    topic_map = {
        "letter": [1, 4, 7],
        "speech": [2],
        "opinion": [3, 6, 8],
        "narrative": [5],
        "comparison": [9]
    }
    
    available_prompts = []
    if topic.lower() in topic_map:
        for pid in topic_map[topic.lower()]:
            available_prompts.append(writing_prompts[pid-1])
    else:
        available_prompts = writing_prompts
    
    return available_prompts[:num_questions]

def _get_rubric() -> Dict[str, Any]:
    """Get standard rubric structure."""
    return {
        "criteria": [
            {
                "name": "Task Achievement",
                "japanese": "タスク達成度",
                "maxPoints": 25,
                "levels": {
                    "excellent": "22-25",
                    "good": "17-21",
                    "satisfactory": "12-16",
                    "needsImprovement": "0-11"
                }
            },
            {
                "name": "Content",
                "japanese": "内容・構成",
                "maxPoints": 25,
                "levels": {
                    "excellent": "22-25",
                    "good": "17-21",
                    "satisfactory": "12-16",
                    "needsImprovement": "0-11"
                }
            },
            {
                "name": "Vocabulary",
                "japanese": "語彙・表現",
                "maxPoints": 25,
                "levels": {
                    "excellent": "22-25",
                    "good": "17-21",
                    "satisfactory": "12-16",
                    "needsImprovement": "0-11"
                }
            },
            {
                "name": "Grammar",
                "japanese": "文法・表記の正確さ",
                "maxPoints": 25,
                "levels": {
                    "excellent": "22-25",
                    "good": "17-21",
                    "satisfactory": "12-16",
                    "needsImprovement": "0-11"
                }
            }
        ]
    }

def generate_mock_task(topic: str, level: str, num_questions: int) -> Dict[str, Any]:
    """
    Generate mock Japanese writing task data when Gemini fails.
    Kept for backward compatibility - delegates to main functions.
    """
    # Check cache first
    cache_key = f"mock:{topic}:{level}:{num_questions}"
    if cache_key in _task_cache:
        return _task_cache[cache_key]
    
    prompts_list = _get_mock_prompts(topic, num_questions)
    rubric = _get_rubric()
    
    task_data = {
        "taskId": int(time.time()),
        "title": f"Japanese Writing Task: {topic.title()}",
        "level": level.upper(),
        "description": f"Write in Japanese focusing on {topic}. Follow the rubric for assessment.",
        "prompts": prompts_list,
        "rubric": rubric
    }
    
    _task_cache[cache_key] = task_data
    return task_data

def generate_single_question(genre: str, topic: str, level: str) -> Dict[str, Any]:
    """
    Generate a single Japanese writing question for QuestionBank.
    
    Args:
        genre: One of '手紙', 'スピーチ', '意見・感想'
        topic: The topic/theme for the question
        level: One of 'N3', 'N2'
    
    Returns:
        Dictionary with: content, required_points, similarity_hash
    
    Optimized for free tier with rate limiting and caching.
    """
    # Check cache first
    cache_key = f"question:{genre}:{topic}:{level}"
    if cache_key in _task_cache:
        print("✅ Using cached question")
        return _task_cache[cache_key]
    
    with _rate_limit_lock:
        current_time = time.time()
        global _last_api_call
        time_since_last_call = current_time - _last_api_call
        
        if time_since_last_call < GEMINI_RATE_LIMIT_SECONDS:
            wait_time = GEMINI_RATE_LIMIT_SECONDS - time_since_last_call
            print(f"⏳ Rate limiting: waiting {wait_time:.1f} seconds...")
            time.sleep(wait_time)
        
        _last_api_call = time.time()
        
        # Generate question from Gemini
        question_data = _call_gemini_for_single_question(genre, topic, level)
        
        # If Gemini fails, use mock data
        if not question_data:
            question_data = _generate_mock_question(genre, topic, level)
        
        # Add similarity hash for deduplication
        question_data['similarity_hash'] = _generate_similarity_hash(
            question_data['content']
        )
        
        # Cache and return
        _task_cache[cache_key] = question_data
        print("✅ Question generated successfully")
        return question_data

def _call_gemini_for_single_question(genre: str, topic: str, level: str) -> Optional[Dict[str, Any]]:
    """
    Call Gemini API to generate a single Japanese writing question.
    Returns None if API fails.
    """
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Map genre to Japanese type
        genre_map = {
            '手紙': 'letter (手紙)',
            'スピーチ': 'speech (スピーチ)',
            '意見・感想': 'opinion/impression (意見・感想)'
        }
        
        genre_description = genre_map.get(genre, genre)

        # Prompt for generating question with required points
        prompt = f"""Generate a Japanese writing question for {level} level students.

Genre: {genre_description}
Topic: {topic}

Requirements:
1. Write the question prompt in Japanese (200-300 characters)
2. Include context, situation, and what to write about
3. List 3-5 required points (mandatory ideas) that students must include in their answer

Output format (plain text, no JSON):
PROMPT:
[Japanese question prompt here]

REQUIRED_POINTS:
- [Point 1 in Japanese]
- [Point 2 in Japanese]
- [Point 3 in Japanese]

Example:
PROMPT:
日本で１週間ホームスティしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。

REQUIRED_POINTS:
- 楽しかった思い出を２つ以上書く
- 感謝の気持ちを伝える
- また会いたい気持ちを伝える
"""

        print(f"🔄 Calling Gemini API for single question...")
        
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.8,
                'max_output_tokens': 300,
            }
        )
        
        # Parse the response
        result_text = response.text.strip()
        
        # Extract prompt and required points
        parts = result_text.split('REQUIRED_POINTS:')
        if len(parts) != 2:
            print("⚠️ Unexpected response format from Gemini")
            return None
        
        prompt_part = parts[0].replace('PROMPT:', '').strip()
        points_part = parts[1].strip()
        
        # Parse required points (lines starting with -)
        required_points = []
        for line in points_part.split('\n'):
            line = line.strip()
            if line.startswith('-'):
                required_points.append(line[1:].strip())
        
        if not prompt_part or len(required_points) < 2:
            print("⚠️ Incomplete data from Gemini")
            return None
        
        print(f"✅ Gemini returned question: {prompt_part[:50]}...")
        
        return {
            'content': prompt_part,
            'required_points': json.dumps(required_points, ensure_ascii=False)
        }
        
    except Exception as e:
        print(f"⚠️ Gemini API error: {e}")
        return None


def grade_writing_submission(task_type_id: int, content: str, difficulty: str = 'N3') -> Dict[str, Any]:
    """
    Grade student writing using Gemini + 7-criteria Japanese Rubric.
    """
    try:
        # 1. Load rubric data (Giả định file JSON của bạn đã cập nhật 7 tiêu chí)
        # Nếu chưa, Prompt dưới đây sẽ ghi đè định nghĩa cứng để đảm bảo chính xác.
        rubric_path = Path(__file__).parent / '../constants/writing_rubric.json'
        with open(rubric_path, 'r', encoding='utf-8') as f:
            rubric_data = json.load(f)
        
        # Lấy thông tin bài tập (Giữ nguyên logic của bạn)
        task_info = None
        # ... (Phần tìm task_info giữ nguyên như code cũ của bạn) ...

        # 2. Xây dựng Prompt dựa trên file Rubrik final.docx
        prompt = f"""Bạn là một chuyên gia chấm bài viết tiếng Nhật. Hãy chấm điểm bài viết sau dựa trên RUBRIK 7 TIÊU CHÍ.

THÔNG TIN BÀI TẬP:
- Task ID: {task_type_id}
- Chủ đề: {task_info.get('title', 'N/A')}
- Cấp độ: {difficulty}
- Nội dung học sinh: 
---
{content}
---

RUBRIK CHẤM ĐIỂM (Thang điểm 100):
1. Hoàn thành yêu cầu đề (15đ): M4(15), M3(11.25), M2(7.5), M1(3.75)
2. Nội dung & phát triển ý (15đ): M4(15), M3(11.25), M2(7.5), M1(3.75)
3. Bố cục & mạch lạc (15đ): M4(15), M3(11.25), M2(7.5), M1(3.75)
4. Ngữ pháp & cấu trúc (20đ): M4(20), M3(15), M2(10), M1(5)
5. Từ vựng (15đ): M4(15), M3(11.25), M2(7.5), M1(3.75)
6. Chữ viết & chính tả (10đ): M4(10), M3(7.5), M2(5), M1(2.5)
7. Văn phong & ngữ dụng (10đ): M4(10), M3(7.5), M2(5), M1(2.5)

QUY TẮC CHẤM:
- Với mỗi tiêu chí, hãy chọn mức (M1 đến M4) dựa trên mô tả trong rubrik.
- Điểm số phải tương ứng với mức đã chọn (Ví dụ: Tiêu chí 1 nếu chọn M3 thì điểm là 11.25).
- Tổng điểm là tổng của 7 tiêu chí.

YÊU CẦU ĐẦU RA JSON (Strictly valid JSON):
{{
  "criteria_scores": {{
    "1": float, "2": float, "3": float, "4": float, "5": float, "6": float, "7": float
  }},
  "criteria_levels": {{
    "1": "M1-M4", "2": "M1-M4", "3": "M1-M4", "4": "M1-M4", "5": "M1-M4", "6": "M1-M4", "7": "M1-M4"
  }},
  "total_score": float,
  "grade": "A/B/C/D/F",
  "feedback_text": "Đánh giá tổng quan bằng Tiếng Việt",
  "strengths": ["Liệt kê ưu điểm bằng Tiếng Việt"],
  "improvements": ["Liệt kê điểm cần cải thiện bằng Tiếng Việt"],
  "detailed_analysis": {{
    "language": {{ "issues": ["Lỗi cụ thể về từ vựng/ngữ pháp"], "suggestions": ["Cách sửa"] }},
    "kanji_orthography": {{ "feedback": "Nhận xét về chữ viết, Kanji, chính tả" }},
    "style_usage": {{ "feedback": "Nhận xét về văn phong (Thể từ điển/Lịch sự)" }}
  }}
}}
LƯU Ý: Phản hồi hoàn toàn bằng Tiếng Việt. Không thêm văn bản ngoài JSON.
"""

        # 3. Gọi Gemini API (Sử dụng Model mới nhất)
        API_KEY = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=API_KEY)
        
        # Khuyến khích dùng gemini-1.5-pro hoặc flash cho việc chấm điểm cần độ chính xác cao
        model = genai.GenerativeModel(
            'gemini-1.5-flash', 
            generation_config={
                'temperature': 0.1, # Giảm Temp để kết quả chấm điểm ổn định hơn
                'response_mime_type': "application/json"
            }
        )
        
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # 4. Xử lý kết quả
        result = json.loads(raw_text, strict=False)
        
        # Đồng bộ key cho Frontend
        result['overall_score'] = round(result.get('total_score', 0), 1)
        
        return result

    except Exception as e:
        import traceback
        print(f"❌ Grading error: {traceback.format_exc()}")
        return {
            "feedback_text": "Lỗi hệ thống khi phân tích bài viết.",
            "overall_score": 0,
            "criteria_scores": {str(i): 0 for i in range(1, 8)}
        }