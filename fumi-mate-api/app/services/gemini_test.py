import google.generativeai as genai
from google.api_core import exceptions
import os
from dotenv import load_dotenv

load_dotenv()
# 1. DÁN API KEY CỦA BẠN VÀO ĐÂY (Nằm trong dấu ngoặc kép)

API_KEY = os.getenv('GEMINI_API_KEY')

print("⏳ Đang khởi tạo kết nối tới Google Gemini API...",API_KEY)

try:
    # Khai báo key
    genai.configure(api_key=API_KEY)
    
    # Chọn model 1.5 flash chuẩn
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    print("🤖 Đang gửi một câu hỏi cực ngắn để test...")
    
    # Gửi prompt siêu ngắn để tiết kiệm Quota
    response = model.generate_content("Xin chào, bạn có đang hoạt động không? Trả lời tôi trong 1 câu nhé.")
    
    print("\n✅ KẾT QUẢ TỪ AI:")
    print("=" * 40)
    print(response.text.strip())
    print("=" * 40)
    print("🎉 CHÚC MỪNG! API KEY CỦA BẠN ĐANG HOẠT ĐỘNG HOÀN HẢO!")

except exceptions.ResourceExhausted:
    print("\n❌ LỖI 429: Lượt dùng miễn phí của API Key này đã cạn kiệt (Quota Exceeded).")
    print("👉 Giải pháp: Vui lòng dùng tài khoản Gmail khác để tạo API Key mới.")
except exceptions.NotFound:
    print("\n❌ LỖI 404: Không tìm thấy Model.")
    print("👉 Giải pháp: Đổi chữ 'gemini-1.5-flash' ở dòng 14 thành 'gemini-1.5-flash-latest'")
except exceptions.InvalidArgument:
    print("\n❌ LỖI 400: API Key không hợp lệ (Unauthorized).")
    print("👉 Giải pháp: Kiểm tra xem bạn copy key có bị thiếu/thừa khoảng trắng không.")
except Exception as e:
    print(f"\n❌ LỖI KHÔNG XÁC ĐỊNH:\n{e}")