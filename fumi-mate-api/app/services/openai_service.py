import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

from app.services.gemini_service import (
    _compact_grading_feedback,
    _fallback_7criteria_feedback,
    _find_writing_task,
    _parse_model_json,
    _log_ai_grading_result,
    _normalize_7_criteria_result,
)

load_dotenv()

DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
DEFAULT_OPENAI_REQUEST_TIMEOUT_SECONDS = 30
OPENAI_GRADING_PROMPT_VERSION = 'rubric_7criteria_v2_strict'
OPENAI_RUBRIC_VERSION = 'writing_rubric_2026_7criteria'


def _get_openai_model_name() -> str:
    return os.getenv('OPENAI_MODEL', DEFAULT_OPENAI_MODEL).strip() or DEFAULT_OPENAI_MODEL


def _get_openai_timeout_seconds() -> float:
    raw_timeout = os.getenv('OPENAI_REQUEST_TIMEOUT_SECONDS', str(DEFAULT_OPENAI_REQUEST_TIMEOUT_SECONDS)).strip()
    try:
        timeout = float(raw_timeout)
    except ValueError:
        timeout = DEFAULT_OPENAI_REQUEST_TIMEOUT_SECONDS
    return max(1.0, timeout)


def _grading_json_schema() -> Dict[str, Any]:
    string_array_schema = {
        "type": "array",
        "items": {"type": "string"}
    }

    criteria_score_schema = {
        "type": "object",
        "properties": {str(i): {"type": "number"} for i in range(1, 8)},
        "required": [str(i) for i in range(1, 8)],
        "additionalProperties": False
    }

    criteria_level_schema = {
        "type": "object",
        "properties": {str(i): {"type": "string", "enum": ["M4", "M3", "M2", "M1"]} for i in range(1, 8)},
        "required": [str(i) for i in range(1, 8)],
        "additionalProperties": False
    }

    criteria_feedback_schema = {
        "type": "object",
        "properties": {str(i): {"type": "string"} for i in range(1, 8)},
        "required": [str(i) for i in range(1, 8)],
        "additionalProperties": False
    }

    return {
        "type": "object",
        "properties": {
            "criteria_scores": criteria_score_schema,
            "criteria_levels": criteria_level_schema,
            "total_score": {"type": "number"},
            "overall_score": {"type": "number"},
            "grade": {"type": "string", "enum": ["A", "B", "C", "D", "F"]},
            "feedback_text": {"type": "string"},
            "strengths": string_array_schema,
            "improvements": string_array_schema,
            "corrected_text": {"type": "string"},
            "criteria_feedback": criteria_feedback_schema,
            "detailed_analysis": {
                "type": "object",
                "properties": {
                    "language": {
                        "type": "object",
                        "properties": {
                            "issues": string_array_schema,
                            "suggestions": string_array_schema
                        },
                        "required": ["issues", "suggestions"],
                        "additionalProperties": False
                    },
                    "kanji_orthography": {
                        "type": "object",
                        "properties": {
                            "feedback": {"type": "string"}
                        },
                        "required": ["feedback"],
                        "additionalProperties": False
                    },
                    "style_usage": {
                        "type": "object",
                        "properties": {
                            "feedback": {"type": "string"}
                        },
                        "required": ["feedback"],
                        "additionalProperties": False
                    }
                },
                "required": ["language", "kanji_orthography", "style_usage"],
                "additionalProperties": False
            },
            "grading_method": {"type": "string"},
        },
        "required": [
            "criteria_scores",
            "criteria_levels",
            "total_score",
            "overall_score",
            "grade",
            "feedback_text",
            "strengths",
            "improvements",
            "corrected_text",
            "criteria_feedback",
            "detailed_analysis",
            "grading_method"
        ],
        "additionalProperties": False
    }


def _build_openai_grading_prompt(task_type_id: int, content: str, difficulty: str, rubric_data: Dict[str, Any]) -> str:
    task_info = _find_writing_task(rubric_data, int(task_type_id))
    criteria_json = json.dumps(rubric_data.get("rubric", {}).get("criteria", []), ensure_ascii=False, indent=2)
    task_json = json.dumps(task_info or {"id": task_type_id}, ensure_ascii=False, indent=2)

    return f"""Bạn là một chuyên gia chấm bài viết tiếng Nhật.
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
- total_score = tổng 7 tiêu chí.
- grade tính theo tổng điểm: A >=90, B >=80, C >=70, D >=60, F <60.
- M4 là mức xuất sắc, chỉ dùng khi tiêu chí đó gần như không có lỗi và thể hiện vượt yêu cầu.
- Không cho 100 điểm trừ khi bài hoàn toàn đáp ứng đề, phát triển ý rất tốt, gần như không lỗi ngữ pháp/từ vựng/chính tả và văn phong rất tự nhiên.
- Bài có nhiều lỗi tiếng Nhật, lặp ý, sai văn phong, thiếu ý hoặc diễn đạt chưa tự nhiên thường phải nằm ở M3/M2/M1 tùy tiêu chí.
- Nếu còn phân vân giữa hai mức, hãy chọn mức thấp hơn để đảm bảo nhất quán nghiên cứu.
- Đừng khen chung chung. Nhận xét từng tiêu chí phải nêu được lý do chọn mức.
- TỰ CÂN ĐỐI ĐỘ DÀI OUTPUT để JSON không bị cắt:
  - feedback_text tối đa 2 câu ngắn.
  - strengths tối đa 3 ý, mỗi ý dưới 18 từ.
  - improvements tối đa 3 ý, mỗi ý dưới 18 từ.
  - criteria_feedback mỗi tiêu chí đúng 1 câu ngắn, dưới 25 từ.
  - detailed_analysis mỗi trường chỉ 1 câu/ngắn gọn, không liệt kê dài.
  - corrected_text chỉ viết lại bài của học sinh ở độ dài tương đương hoặc ngắn hơn bài gốc; không mở rộng ý mới, không thêm ví dụ mới.
- Phản hồi hoàn toàn bằng Tiếng Việt ở các trường text/mảng.
- corrected_text là toàn bộ bài viết tiếng Nhật đã sửa tự nhiên hơn, giữ đúng ý chính của học sinh.
- grading_method phải là "openai_7_criteria".

Hãy trả về JSON đúng schema, không thêm giải thích ngoài JSON."""


def _extract_output_text(response_payload: Dict[str, Any]) -> str:
    output_text = response_payload.get("output_text")
    if output_text:
        return output_text

    output = response_payload.get("output") or []
    for item in output:
        for content in item.get("content") or []:
            if content.get("type") == "output_text" and content.get("text"):
                return content["text"]

    raise ValueError("OpenAI response did not include output_text")


def grade_writing_submission_openai(
    task_type_id: int,
    content: str,
    difficulty: str = 'N3',
    timeout_seconds: Optional[float] = None
) -> Dict[str, Any]:
    rubric_path = Path(__file__).parent / '../constants/writing_rubric.json'
    with open(rubric_path, 'r', encoding='utf-8') as f:
        rubric_data = json.load(f)

    start_time = time.monotonic()
    raw_text: Optional[str] = None

    try:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")

        model_name = _get_openai_model_name()
        prompt = _build_openai_grading_prompt(task_type_id, content, difficulty, rubric_data)
        payload = {
            "model": model_name,
            "input": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Bạn là hệ thống chấm bài viết tiếng Nhật theo rubric nghiên cứu. Chấm nghiêm khắc, nhất quán, không cho điểm tối đa nếu bài còn lỗi. Luôn trả JSON hợp lệ."
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "japanese_writing_grading",
                    "schema": _grading_json_schema(),
                    "strict": True
                }
            },
            "max_output_tokens": 4096,
            "temperature": 0
        }

        request = urllib.request.Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST"
        )

        timeout = timeout_seconds if timeout_seconds is not None else _get_openai_timeout_seconds()
        timeout = max(1.0, float(timeout))
        print(f"[OPENAI-GRADING] model={model_name} timeout={timeout}s")
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_payload = json.loads(response.read().decode("utf-8"))

        raw_text = _extract_output_text(response_payload).strip()
        result = _parse_model_json(raw_text)
        result["grading_method"] = "openai_7_criteria"
        result["provider"] = "openai"
        result["model"] = model_name
        result["prompt_version"] = OPENAI_GRADING_PROMPT_VERSION
        result["rubric_version"] = OPENAI_RUBRIC_VERSION

        normalized_result = _normalize_7_criteria_result(result, rubric_data)
        normalized_result = _compact_grading_feedback(normalized_result, content)
        normalized_result["grading_method"] = "openai_7_criteria"
        normalized_result["provider"] = "openai"
        normalized_result["model"] = model_name
        normalized_result["prompt_version"] = OPENAI_GRADING_PROMPT_VERSION
        normalized_result["rubric_version"] = OPENAI_RUBRIC_VERSION
        normalized_result["_raw_response"] = raw_text
        normalized_result["_latency_ms"] = int((time.monotonic() - start_time) * 1000)
        _log_ai_grading_result('openai_normalized', normalized_result, raw_text=raw_text)
        return normalized_result

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        reason = f"OpenAI HTTP {e.code}: {body}"
    except Exception as e:
        reason = str(e)

    fallback_result = _fallback_7criteria_feedback(content, rubric_data, reason)
    fallback_result["grading_method"] = "openai_7_criteria_fallback"
    fallback_result["provider"] = "openai"
    fallback_result["model"] = _get_openai_model_name()
    fallback_result["prompt_version"] = OPENAI_GRADING_PROMPT_VERSION
    fallback_result["rubric_version"] = OPENAI_RUBRIC_VERSION
    fallback_result["_raw_response"] = raw_text
    fallback_result["_latency_ms"] = int((time.monotonic() - start_time) * 1000)
    _log_ai_grading_result('openai_fallback', fallback_result, raw_text=raw_text)
    return fallback_result
