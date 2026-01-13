import os
import google.generativeai as genai
from typing import Dict, List, Any, Optional
import json
import time
import threading

# Rate limiting for free tier
_rate_limit_lock = threading.Lock()
_last_api_call = 0
GEMINI_RATE_LIMIT_SECONDS = 30

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

