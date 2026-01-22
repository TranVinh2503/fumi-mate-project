from dotenv import load_dotenv
load_dotenv()
from services.gemini_service import generate_task
import json

# Test the service
result = generate_task('Japanese N5 Vocabulary', 'N5', 2)
print(json.dumps(result, indent=2, ensure_ascii=False))
