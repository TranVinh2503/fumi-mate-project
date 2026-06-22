import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Dict, List, Any, Optional
import json
import time
import threading
import hashlib
import re
import signal
# Rate limiting for free tier
from pathlib import Path
_rate_limit_lock = threading.Lock()
_last_api_call = 0
GEMINI_RATE_LIMIT_SECONDS = 30
# ... các thư viện khác
load_dotenv()
# Cache for free tier
_task_cache = {}

DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
DEFAULT_GEMINI_REQUEST_TIMEOUT_SECONDS = 20
DEFAULT_GEMINI_GRADING_MAX_OUTPUT_TOKENS = 4096

def _get_gemini_model_name() -> str:
    return os.getenv('GEMINI_MODEL', DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL

def _get_gemini_request_timeout_seconds() -> float:
    raw_timeout = os.getenv('GEMINI_REQUEST_TIMEOUT_SECONDS', str(DEFAULT_GEMINI_REQUEST_TIMEOUT_SECONDS)).strip()
    try:
        timeout = float(raw_timeout)
    except ValueError:
        timeout = DEFAULT_GEMINI_REQUEST_TIMEOUT_SECONDS
    return max(1.0, timeout)

def _get_gemini_grading_max_output_tokens() -> int:
    raw_tokens = os.getenv('GEMINI_GRADING_MAX_OUTPUT_TOKENS', str(DEFAULT_GEMINI_GRADING_MAX_OUTPUT_TOKENS)).strip()
    try:
        tokens = int(raw_tokens)
    except ValueError:
        tokens = DEFAULT_GEMINI_GRADING_MAX_OUTPUT_TOKENS
    return max(1024, tokens)

def _generate_content_with_timeout(model, prompt, **kwargs):
    timeout = _get_gemini_request_timeout_seconds()
    print(f"[GEMINI] model={_get_gemini_model_name()} timeout={timeout}s")
    if threading.current_thread() is not threading.main_thread():
        return model.generate_content(prompt, **kwargs)

    def _handle_timeout(signum, frame):
        raise TimeoutError(f"Gemini request exceeded {timeout}s")

    previous_handler = signal.getsignal(signal.SIGALRM)
    signal.signal(signal.SIGALRM, _handle_timeout)
    signal.setitimer(signal.ITIMER_REAL, timeout)
    try:
        return model.generate_content(prompt, **kwargs)
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous_handler)

def _log_gemini_finish_reason(response) -> None:
    try:
        candidate = response.candidates[0] if response.candidates else None
        if candidate:
            print(f"[GEMINI] finish_reason={getattr(candidate, 'finish_reason', None)}")
    except Exception:
        pass

def _log_ai_grading_result(label: str, data: Dict[str, Any], raw_text: Optional[str] = None) -> None:
    print(f"[AI-GRADING:{label}] method={data.get('grading_method')} total={data.get('total_score')} overall={data.get('overall_score')} grade={data.get('grade')}")
    print(f"[AI-GRADING:{label}] criteria_levels={json.dumps(data.get('criteria_levels', {}), ensure_ascii=False)}")
    print(f"[AI-GRADING:{label}] criteria_scores={json.dumps(data.get('criteria_scores', {}), ensure_ascii=False)}")
    print(f"[AI-GRADING:{label}] criteria_feedback={json.dumps(data.get('criteria_feedback', {}), ensure_ascii=False)}")
    print(f"[AI-GRADING:{label}] corrected_text_preview={(data.get('corrected_text') or '')[:300]}")
    if data.get('error_reason'):
        print(f"[AI-GRADING:{label}] error_reason={data.get('error_reason')}")
    if raw_text is not None:
        print(f"[AI-GRADING:{label}] raw_response_preview={raw_text[:1500]}")

def _extract_json_object(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()

    start = text.find("{")
    if start < 0:
        raise ValueError("AI response did not contain a JSON object")

    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start:index + 1]

    raise ValueError("AI response JSON object was not closed")

def _parse_model_json(raw_text: str) -> Dict[str, Any]:
    json_text = _extract_json_object(raw_text)
    try:
        return json.loads(json_text, strict=False)
    except json.JSONDecodeError as error:
        compact_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", json_text)
        try:
            return json.loads(compact_text, strict=False)
        except json.JSONDecodeError:
            raise error

def _truncate_text(value: Any, max_chars: int) -> str:
    text = str(value or "").strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "..."

def _limit_string_list(values: Any, max_items: int = 3, max_chars: int = 120) -> List[str]:
    if not isinstance(values, list):
        return []
    return [_truncate_text(item, max_chars) for item in values[:max_items]]

def _compact_grading_feedback(result: Dict[str, Any], original_content: str = "") -> Dict[str, Any]:
    result["feedback_text"] = _truncate_text(result.get("feedback_text"), 360)
    result["strengths"] = _limit_string_list(result.get("strengths"), max_items=3, max_chars=120)
    result["improvements"] = _limit_string_list(result.get("improvements"), max_items=3, max_chars=120)
    result["corrected_text"] = _truncate_text(result.get("corrected_text"), max(len(original_content or "") + 250, 900))

    criteria_feedback = result.get("criteria_feedback")
    if isinstance(criteria_feedback, dict):
        result["criteria_feedback"] = {
            str(key): _truncate_text(value, 180)
            for key, value in criteria_feedback.items()
        }

    detailed_analysis = result.get("detailed_analysis")
    if isinstance(detailed_analysis, dict):
        for section_value in detailed_analysis.values():
            if not isinstance(section_value, dict):
                continue
            for key, value in list(section_value.items()):
                if isinstance(value, list):
                    section_value[key] = _limit_string_list(value, max_items=3, max_chars=120)
                elif isinstance(value, str):
                    section_value[key] = _truncate_text(value, 180)

    return result

def _salvage_partial_gemini_result(raw_text: str, rubric_data: Dict[str, Any], content: str, reason: str) -> Optional[Dict[str, Any]]:
    criteria_match = re.search(r'"criteria_levels"\s*:\s*\{([^}]*)\}', raw_text or "", re.DOTALL)
    if not criteria_match:
        return None

    levels = {}
    for key, level in re.findall(r'"([1-7])"\s*:\s*"(M[1-4])"', criteria_match.group(1), flags=re.IGNORECASE):
        levels[key] = level.upper()

    if len(levels) < 7:
        return None

    criteria_feedback = {}
    for criterion in rubric_data.get("rubric", {}).get("criteria", []):
        criterion_id = str(criterion.get("id"))
        level = levels.get(criterion_id, "M2")
        level_desc = criterion.get("levels", {}).get(level, {}).get("desc") or criterion.get("descriptions", {}).get(level) or ""
        criteria_feedback[criterion_id] = _truncate_text(level_desc or f"Gemini chọn mức {level}; cần giáo viên kiểm tra lại.", 160)

    result = _normalize_7_criteria_result({
        "criteria_levels": levels,
        "criteria_feedback": criteria_feedback,
        "feedback_text": "Gemini đã chọn được mức cho từng tiêu chí nhưng JSON bị cắt trước khi hoàn tất. Giáo viên nên kiểm tra lại nhận xét.",
        "strengths": ["Có thể dùng mức điểm Gemini chọn làm tham khảo."],
        "improvements": ["Kiểm tra lại nhận xét vì phản hồi Gemini bị cắt giữa chừng."],
        "corrected_text": content,
        "error_reason": reason,
        "grading_method": "ai_7_criteria_gemini_partial"
    }, rubric_data)
    return _compact_grading_feedback(result, content)

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

LEVEL_ORDER = ("M4", "M3", "M2", "M1")

def _find_writing_task(rubric_data: Dict[str, Any], task_type_id: int) -> Optional[Dict[str, Any]]:
    writing_tasks = rubric_data.get("writing_tasks", {})

    pre_post = writing_tasks.get("pre_post_test")
    if pre_post and pre_post.get("id") == task_type_id:
        return {
            "id": pre_post.get("id"),
            "type": pre_post.get("type"),
            "title": pre_post.get("title"),
            "prompt_ja": pre_post.get("prompt_ja"),
            "prompt_vi": pre_post.get("prompt_vi"),
            "requirements": pre_post.get("requirement", {})
        }

    for task_type, tasks in writing_tasks.items():
        if not isinstance(tasks, list):
            continue
        for task in tasks:
            if task.get("id") == task_type_id:
                return {
                    "id": task.get("id"),
                    "type": task_type,
                    "title": task.get("title") or task.get("topic"),
                    "topic": task.get("topic"),
                    "prompt_ja": task.get("prompt_ja"),
                    "prompt_vi": task.get("prompt_vi"),
                    "requirements": task.get("requirements", [])
                }

    return None

def get_writing_task_info(task_type_id: int) -> Optional[Dict[str, Any]]:
    rubric_path = Path(__file__).parent / '../constants/writing_rubric.json'
    with open(rubric_path, 'r', encoding='utf-8') as f:
        rubric_data = json.load(f)
    return _find_writing_task(rubric_data, int(task_type_id))

def _grade_from_score(total_score: float) -> str:
    if total_score >= 90:
        return "A"
    if total_score >= 80:
        return "B"
    if total_score >= 70:
        return "C"
    if total_score >= 60:
        return "D"
    return "F"

def _normalize_7_criteria_result(result: Dict[str, Any], rubric_data: Dict[str, Any]) -> Dict[str, Any]:
    criteria = rubric_data.get("rubric", {}).get("criteria", [])
    criteria_levels = result.get("criteria_levels") or {}
    criteria_scores = result.get("criteria_scores") or {}
    normalized_levels: Dict[str, str] = {}
    normalized_scores: Dict[str, float] = {}

    for criterion in criteria:
        criterion_id = str(criterion.get("id"))
        allowed_scores = criterion.get("scores", {})
        level = str(criteria_levels.get(criterion_id, "")).upper()

        if level not in allowed_scores:
            raw_score = float(criteria_scores.get(criterion_id, 0) or 0)
            level = min(
                LEVEL_ORDER,
                key=lambda key: abs(float(allowed_scores.get(key, 0)) - raw_score)
            )

        normalized_levels[criterion_id] = level
        normalized_scores[criterion_id] = float(allowed_scores[level])

    total_score = round(sum(normalized_scores.values()), 2)
    result["criteria_levels"] = normalized_levels
    result["criteria_scores"] = normalized_scores
    result["total_score"] = total_score
    result["overall_score"] = total_score
    result["grade"] = result.get("grade") or _grade_from_score(total_score)
    result["grading_method"] = result.get("grading_method") or "ai_7_criteria_gemini"
    return result

def _fallback_7criteria_feedback(content: str, rubric_data: Dict[str, Any], reason: str = "") -> Dict[str, Any]:
    content = (content or "").strip()
    japanese_chars = len(re.findall(r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]', content))
    sentence_count = max(1, len([s for s in re.split(r'[。！？\n]', content) if s.strip()]))
    content_len = len(content)

    if content_len >= 450 and japanese_chars >= 250 and sentence_count >= 8:
        default_level = "M3"
    elif content_len >= 220 and japanese_chars >= 120 and sentence_count >= 4:
        default_level = "M2"
    else:
        default_level = "M1"

    criteria_levels = {}
    for criterion in rubric_data.get("rubric", {}).get("criteria", []):
        criterion_id = str(criterion.get("id"))
        criteria_levels[criterion_id] = default_level

    result = _normalize_7_criteria_result({
        "criteria_levels": criteria_levels,
        "criteria_feedback": {
            "1": "Chấm tạm bằng heuristic vì AI chưa khả dụng; giáo viên nên kiểm tra lại yêu cầu đề.",
            "2": "Chấm tạm dựa trên độ dài, lượng chữ Nhật và số câu.",
            "3": "Chưa phân tích sâu liên kết ý do AI không phản hồi.",
            "4": "Chưa phân tích lỗi ngữ pháp chi tiết do AI không phản hồi.",
            "5": "Chưa phân tích độ đa dạng từ vựng chi tiết do AI không phản hồi.",
            "6": "Chưa rà soát chính tả/kanji chi tiết do AI không phản hồi.",
            "7": "Chưa đánh giá sắc thái văn phong chi tiết do AI không phản hồi."
        },
        "feedback_text": "Hệ thống đã tạo điểm tạm theo rubric 7 tiêu chí vì dịch vụ AI chưa phản hồi ổn định. Giáo viên cần xem lại trước khi lưu điểm cuối cùng.",
        "strengths": ["Bài đã được ghi nhận và có thể chấm theo rubric."],
        "improvements": ["Kiểm tra lại từng tiêu chí trước khi dùng làm điểm chính thức."],
        "corrected_text": content,
        "error_reason": reason,
        "detailed_analysis": {
            "language": {
                "issues": [reason] if reason else [],
                "suggestions": ["Bấm AI chấm lại khi cấu hình GEMINI_API_KEY hoạt động hoặc chấm thủ công theo rubric."]
            }
        },
        "grading_method": "heuristic_7_criteria_fallback"
    }, rubric_data)

    return result

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
        model = genai.GenerativeModel(_get_gemini_model_name())

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
        
        response = _generate_content_with_timeout(
            model,
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
        model = genai.GenerativeModel(_get_gemini_model_name())

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
        
        response = _generate_content_with_timeout(
            model,
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
    """Grade student writing using Gemini + 7-criteria rubric (M4/M3/M2/M1 -> scores).

    Requirements:
    - Must return JSON with:
      - criteria_scores: keys "1".."7" mapping to exact scores: 15/11.25/7.5/3.75, except:
        - criterion 4 uses 20/15/10/5
        - criterion 6-7 use 10/7.5/5/2.5
      - criteria_levels: keys "1".."7" mapping to level strings "M1".."M4" (or "M4-M1" variants)
    - FE expects the same structure as Teacher screen.
    """
    rubric_path = Path(__file__).parent / '../constants/writing_rubric.json'
    with open(rubric_path, 'r', encoding='utf-8') as f:
        rubric_data = json.load(f)

    raw_text = ""

    try:
        task_info = _find_writing_task(rubric_data, int(task_type_id))
        criteria_json = json.dumps(rubric_data.get("rubric", {}).get("criteria", []), ensure_ascii=False, indent=2)
        task_json = json.dumps(task_info or {"id": task_type_id}, ensure_ascii=False, indent=2)

        prompt = f"""Bạn là một chuyên gia chấm bài viết tiếng Nhật.
NHIỆM VỤ: Chấm bài viết theo ĐÚNG 7 TIÊU CHÍ GIỐNG MÀ GIÁO VIÊN ĐANG DÙNG.


THÔNG TIN BÀI TẬP:
- Cấp độ: {difficulty}
- Task:
{task_json}
- Nội dung học sinh:
---
{content}
---

RUBRIC CHÍNH THỨC (Tổng 100 điểm):
{criteria_json}

QUY TẮC CHẤM QUAN TRỌNG:
- Bắt buộc chọn Mức cho từng tiêu chí: chỉ được là M4/M3/M2/M1.
- Điểm trong criteria_scores PHẢI LÀ GIÁ TRỊ TƯƠNG ỨNG ĐÚNG với mức đã chọn trong rubric.
- total_score = tổng 7 tiêu chí (các giá trị bắt buộc).
- grade tính theo tổng điểm (A/B/C/D/F) theo hệ thống hiện tại:
  - A: >=90, B: >=80, C: >=70, D: >=60, F: <60.
- M4 là mức xuất sắc, chỉ dùng khi tiêu chí đó gần như không có lỗi và thể hiện vượt yêu cầu.
- Không cho 100 điểm trừ khi bài hoàn toàn đáp ứng đề, phát triển ý rất tốt, gần như không lỗi ngữ pháp/từ vựng/chính tả và văn phong rất tự nhiên.
- Bài có nhiều lỗi tiếng Nhật, lặp ý, sai văn phong, thiếu ý hoặc diễn đạt chưa tự nhiên thường phải nằm ở M3/M2/M1 tùy tiêu chí.
- Nếu còn phân vân giữa hai mức, hãy chọn mức thấp hơn để đảm bảo nhất quán nghiên cứu.
- TỰ CÂN ĐỐI ĐỘ DÀI OUTPUT để JSON không bị cắt:
  - feedback_text tối đa 2 câu ngắn.
  - strengths tối đa 3 ý, mỗi ý dưới 18 từ.
  - improvements tối đa 3 ý, mỗi ý dưới 18 từ.
  - criteria_feedback mỗi tiêu chí đúng 1 câu ngắn, dưới 25 từ.
  - detailed_analysis mỗi trường chỉ 1 câu/ngắn gọn, không liệt kê dài.
  - corrected_text chỉ viết lại bài của học sinh ở độ dài tương đương hoặc ngắn hơn bài gốc; không mở rộng ý mới, không thêm ví dụ mới.

YÊU CẦU OUTPUT (Strictly valid JSON, KHÔNG thêm bất kỳ text nào ngoài JSON):
{{
  "criteria_levels": {{
    "1": "M4",
    "2": "M3",
    "3": "M2",
    "4": "M1",
    "5": "M4",
    "6": "M3",
    "7": "M2"
  }},
  "feedback_text": "Tối đa 2 câu ngắn bằng Tiếng Việt",
  "strengths": ["Tối đa 3 ý rất ngắn"],
  "improvements": ["Tối đa 3 ý rất ngắn"],
  "criteria_feedback": {{
    "1": "Một câu rất ngắn",
    "2": "Một câu rất ngắn",
    "3": "Một câu rất ngắn",
    "4": "Một câu rất ngắn",
    "5": "Một câu rất ngắn",
    "6": "Một câu rất ngắn",
    "7": "Một câu rất ngắn"
  }},
  "corrected_text": "Bản sửa tiếng Nhật ngắn gọn, không dài hơn bài gốc",
  "grading_method": "ai_7_criteria_gemini"
}}

LƯU Ý:
- Phản hồi hoàn toàn bằng Tiếng Việt ở các trường text/mảng.
- KHÔNG trả criteria_scores, total_score, overall_score, grade; backend sẽ tự tính từ criteria_levels.
- KHÔNG trả detailed_analysis để tránh JSON quá dài.
- Đảm bảo JSON hợp lệ.
"""

        API_KEY = os.getenv('GEMINI_API_KEY')
        if not API_KEY:
            raise ValueError("GEMINI_API_KEY not found")

        genai.configure(api_key=API_KEY)

        model = genai.GenerativeModel(
            _get_gemini_model_name(),
            generation_config={
                'temperature': 0.1,
                'max_output_tokens': _get_gemini_grading_max_output_tokens()
            }
        )
        
        response = _generate_content_with_timeout(model, prompt)
        _log_gemini_finish_reason(response)
        raw_text = response.text.strip()
        print(f"[GEMINI] raw_text_length={len(raw_text)}")
        result = _parse_model_json(raw_text)
        _log_ai_grading_result('raw', result, raw_text=raw_text)
        normalized_result = _normalize_7_criteria_result(result, rubric_data)
        normalized_result = _compact_grading_feedback(normalized_result, content)
        _log_ai_grading_result('normalized', normalized_result)
        return normalized_result

    except Exception as e:
        import traceback
        print(f"❌ Grading error: {traceback.format_exc()}")
        partial_result = _salvage_partial_gemini_result(raw_text, rubric_data, content, str(e))
        if partial_result:
            _log_ai_grading_result('gemini_partial', partial_result, raw_text=raw_text)
            return partial_result
        fallback_result = _fallback_7criteria_feedback(content, rubric_data, str(e))
        _log_ai_grading_result('fallback', fallback_result)
        return fallback_result
