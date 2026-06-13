# AB Group Assignment And Grading Rules

Tài liệu này mô tả cách chia `experimental_group` trong bảng `user` và các quy luật chấm/hiển thị kết quả sau khi chia nhóm.

## Mục tiêu

Hệ thống chia sinh viên thành 2 nhóm:

- `control`: nhóm nhìn thấy kết quả do giáo viên chấm/chữa.
- `variant`: nhóm nhìn thấy kết quả do AI chấm.

Việc chia nhóm phục vụ nghiên cứu so sánh trải nghiệm/kết quả giữa nhóm giáo viên chấm và nhóm AI chấm. Hệ thống không hiển thị cho sinh viên biết bài của mình do giáo viên hay AI chấm.

## Quy luật chia nhóm

Command `ab-test-assign-from-graded` chia nhóm theo danh sách sinh viên đã được giáo viên chấm/chữa trước đó:

- Sinh viên có trong file đầu vào: gán `experimental_group = 'control'`.
- Sinh viên còn lại: gán `experimental_group = 'variant'`.
- Nếu nhóm `control` chưa đủ gần 50% tổng số sinh viên, command chọn thêm một số sinh viên chưa được chấm vào `control` để giáo viên có thể chấm bù.
- Tài khoản sinh viên có `username` không phải mã số sẽ bị bỏ qua mặc định để tránh lẫn tài khoản test.
- Có thể dùng `--include-non-numeric` nếu thật sự muốn đưa cả tài khoản không phải mã số sinh viên vào chia nhóm.

Seed mặc định là `20260517`, nên danh sách sinh viên được chọn thêm vào `control` có thể tái lập nếu chạy lại cùng dữ liệu đầu vào.

## File đầu vào

File đầu vào là CSV hoặc TXT chứa mã sinh viên đã được giáo viên chấm/chữa.

CSV có header:

```csv
student_code
2407060054
2407060164
2407060134
```

Hoặc TXT mỗi dòng một mã:

```txt
2407060054
2407060164
2407060134
```

Mã sinh viên trong file được match với `user.username`.

## Dry Run

Mặc định command chỉ chạy thử và không cập nhật database:

```bash
cd fumi-mate-api
python manage.py ab-test-assign-from-graded --graded-file /path/to/graded_students.csv --report-file /tmp/ab_group_report.json
```

Report cho biết:

- Tổng số sinh viên được đưa vào chia nhóm.
- Số lượng `control`.
- Số lượng `variant`.
- Sinh viên `control` do có trong danh sách đã giáo viên chấm.
- Sinh viên `control` được chọn thêm để giáo viên chấm bù.
- Mã sinh viên trong file nhưng không tìm thấy trong database.
- Tài khoản non-numeric bị bỏ qua.

## Apply

Chỉ chạy apply sau khi đã kiểm tra report:

```bash
cd fumi-mate-api
python manage.py ab-test-assign-from-graded --graded-file /path/to/graded_students.csv --apply
```

Khi apply, command cập nhật trực tiếp `experimental_group` trong bảng `user`.

## Quy Luật Chấm Bài Sau Khi Chia Nhóm

### Nhóm `control`

- Giáo viên chấm thủ công.
- Giáo viên có thể nhập điểm, nhận xét chi tiết theo rubric và upload file Word đã chữa.
- Khi giáo viên bấm hoàn tất/gửi kết quả, submission được set `status = 'teacher_graded'`.
- Sinh viên chỉ nhìn thấy kết quả sau khi bài đã được gửi kết quả.

### Nhóm `variant`

- Giáo viên không chấm thủ công.
- Giao diện giáo viên chỉ cho phép bấm `AI Grade` để gọi AI chấm.
- Hệ thống có thể tạo nhiều kết quả AI cho cùng một bài, ví dụ `Gemini` và `ChatGPT/OpenAI`.
- Sau khi AI chấm xong, giáo viên kiểm tra các kết quả, chọn một kết quả chính thức rồi bấm gửi kết quả AI.
- Khi gửi kết quả AI, submission được set `status = 'teacher_graded'`.
- Sinh viên chỉ nhìn thấy kết quả AI đã được giáo viên chọn và gửi.

Backend cũng chặn chấm thủ công cho nhóm `variant`. Nếu gọi API chấm tay với sinh viên nhóm AI, hệ thống trả lỗi và yêu cầu dùng `AI Grade`.

## Quy Luật Hiển Thị Cho Sinh Viên

Sinh viên không thấy nhãn phân biệt AI/GV. Giao diện chỉ hiển thị kết quả bài chấm theo nhóm và trạng thái publish.

Quy luật hiện tại:

- Nếu submission chưa được gửi kết quả, sinh viên không thấy điểm/feedback dù AI đã chấm xong ở phía giáo viên.
- Nếu sinh viên thuộc `control`, sinh viên thấy kết quả giáo viên chấm sau khi giáo viên gửi.
- Nếu sinh viên thuộc `variant`, sinh viên thấy kết quả AI được giáo viên chọn sau khi giáo viên gửi kết quả AI.
- Nếu bài đã có kết quả giáo viên thật từ giai đoạn chuyển giao, hệ thống ưu tiên hiển thị kết quả giáo viên cho sinh viên dù sinh viên hiện đang ở nhóm `variant`.

Rule ưu tiên kết quả giáo viên cũ giúp tránh mất dữ liệu trong giai đoạn hệ thống chuyển từ chấm giáo viên sang phân nhóm AI/GV.

## Quy Luật Hiển Thị Cho Giáo Viên

Danh sách bài nộp dùng trạng thái đã gửi kết quả để hiển thị:

- Bài đã gửi kết quả bởi giáo viên hoặc AI: hiện `Graded`.
- Bài đã `Graded`: nút thao tác chính là `View`.
- Bài chưa gửi kết quả: hiện là bài chờ chấm/chờ xử lý.
- Bài nhóm `variant` chưa gửi kết quả: có nút `AI Grade`.
- Sau khi bấm `AI Grade`, giáo viên thấy các kết quả AI riêng theo provider/model, ví dụ Gemini và ChatGPT/OpenAI.
- Giáo viên chọn một kết quả AI để preview và gửi cho sinh viên.
- Bài nhóm `variant` đã gửi kết quả: không hiện nút `AI Grade` để tránh chấm lại sau khi đã gửi cho sinh viên.

## Trạng Thái Dữ Liệu Chính

- `user.experimental_group = 'control'`: sinh viên thuộc nhóm giáo viên chấm.
- `user.experimental_group = 'variant'`: sinh viên thuộc nhóm AI chấm.
- `submission.ai_score`: điểm AI.
- `submission.ai_feedback`: feedback AI dạng JSON.
- `submission.teacher_score`: điểm giáo viên.
- `submission.teacher_feedback`: feedback giáo viên dạng JSON.
- `submission.word_file_path`: file Word giáo viên đã chữa.
- `submission.status = 'ai_teacher_graded'`: AI đã chấm ở phía giáo viên nhưng chưa gửi cho sinh viên.
- `submission.status = 'teacher_graded'`: kết quả đã được gửi/publish cho sinh viên.
- `ai_grading_result`: bảng lưu nhiều kết quả AI cho cùng một bài.
- `ai_grading_result.provider`: `gemini` hoặc `openai`.
- `ai_grading_result.model`: model cụ thể, ví dụ `gemini-2.0-flash` hoặc `gpt-4.1-mini`.
- `ai_grading_result.feedback_json`: feedback JSON đã normalize theo rubric 7 tiêu chí.
- `ai_grading_result.is_selected`: kết quả AI được giáo viên chọn để gửi.

## Lưu Ý Deploy

- Cần cấu hình `GEMINI_API_KEY` và `GEMINI_MODEL` trong môi trường deploy.
- Nên cấu hình `GEMINI_REQUEST_TIMEOUT_SECONDS=20` hoặc thấp hơn timeout của Gunicorn để lỗi Gemini trả về có kiểm soát thay vì làm worker timeout.
- Nên cấu hình `GEMINI_GRADING_MAX_OUTPUT_TOKENS=4096`. Prompt và backend đã giới hạn độ dài nhận xét; chỉ tăng token nếu log cho thấy Gemini vẫn bị cắt JSON.
- `AI_GRADING_PROVIDERS` quyết định hệ thống gọi AI nào khi bấm `AI Grade`.
- Dùng `AI_GRADING_PROVIDERS=openai` nếu chỉ muốn chấm bằng ChatGPT/OpenAI.
- Dùng `AI_GRADING_PROVIDERS=gemini,openai` nếu muốn chấm bằng cả Gemini và ChatGPT/OpenAI để giáo viên chọn.
- Nếu dùng cả Gemini và ChatGPT/OpenAI trong cùng request, nên tăng Gunicorn timeout vì backend sẽ gọi tuần tự các provider được cấu hình.
- Nếu dùng ChatGPT/OpenAI, cần cấu hình `OPENAI_API_KEY`, `OPENAI_MODEL` và `OPENAI_REQUEST_TIMEOUT_SECONDS`.
- Cần chạy migration để tạo bảng `ai_grading_result` trước khi dùng tính năng chấm nhiều AI.

```bash
cd fumi-mate-api
flask db upgrade
```

- Nếu AI trả lỗi quota/API key/model, hệ thống có thể sinh fallback. Không dùng fallback làm điểm chính thức nếu chưa kiểm tra lại.
- Trước khi commit/deploy nên chạy:

```bash
git diff --check
cd fumi-mate-nextjs && npx tsc --noEmit
cd .. && python -m py_compile fumi-mate-api/app/api/student.py fumi-mate-api/app/api/teacher.py fumi-mate-api/app/services/gemini_service.py fumi-mate-api/manage.py
```
