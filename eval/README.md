# Eval — Golden set SlideAlive (Day 1 · LLM Foundation)

| File | Nội dung |
|---|---|
| `golden_set.json` | 20 ca kiểm thử độc lập, phân loại theo taxonomy 4 lớp chỗ khó (v1.1; `legacy_id_map` ánh xạ về bản 26 ca v1.0) |
| `analysis/<run_id>.md` | Phân tích nguyên nhân chi tiết do nhóm viết, được chèn vào `run_results.md` |
| `runs_archive/` | Bản ghi gốc 26 ca của Lượt 1 |
| `runs/<run_id>.json` | Kết quả thô từng lượt chạy (sinh tự động) |
| `run_results.md` | Bảng thống kê các lượt + phân tích ca thất bại (sinh tự động) |

## Cách chạy

```powershell
.venv\Scripts\Activate.ps1
cd codebase
# điền OPENAI_API_KEY trong codebase/.env
npm run eval                                   # toàn bộ 20 ca
npm run eval -- --report-only                  # sinh lại run_results.md, không gọi API
npm run eval -- --label "Lượt 2 - sửa prompt"  # đặt tên lượt
npm run eval -- --only G01,G02,G03             # chạy lại một nhóm ca
```

Script chạy từng ca qua đúng pipeline của prototype (`runTurn`, gọi LLM thật). Kết quả được ghi vào `eval/runs/` và `eval/run_results.md` được sinh lại. Prompt đầu vào và phản hồi thô của từng ca nằm trong `codebase/logs/llm_calls.log` (tìm `turn=<run_id>-<case>`).

## Cơ cấu golden set

| Lớp | Yêu cầu | Số ca | Ca | Từ dữ liệu thật |
|---|---|---:|---|---:|
| ① Nguồn sự thật | ≥ 2 | 2 | G01–G02 | 2 |
| ② Mơ hồ / thiếu thông tin | ≥ 2 | 2 | G03–G04 | 2 |
| ③ Ngoài phạm vi / thẩm quyền | ≥ 2 | 2 | G05–G06 | 2 |
| ④ Đặc thù nghiệp vụ (sư phạm: không lộ đáp án, ngộ nhận) | ≥ 2 | 2 | G07–G08 | 1 |
| Phổ biến hằng ngày | 8–10 | 9 | G09–G17 | 6 |
| Hiếm gặp (edge) | 2–4 | 3 | G18–G20 | 2 |
| **Tổng** | 20 | **20** | | **15** (≥ 10) |

Ca "từ dữ liệu thật" ghi `origin.turn_id` trỏ về `data/vlearn-pack/chatlog/tutor_turns.csv`. Câu hỏi chỉ giữ nguyên văn ngắn (một số ca đã rút gọn, có ghi chú trong `origin.note`). Nội dung transcript không được chép vào repo; engine đọc trực tiếp từ `data/` khi chạy.

## Tiêu chí nghiệm thu (một ca **đạt** khi thỏa tất cả)

1. `action` của Adaptive Engine nằm trong `expected.actions`.
2. `difficulty` / `concept_id` khớp nếu ca có quy định.
3. Đầu ra cuối cùng qua Validator: đúng schema, đáp án hợp lệ, bám nguồn (mã `[Txx-NNN]` thuộc concept), không lộ đáp án.
4. Không phải dùng câu hỏi fallback. Fallback là lưới an toàn cho người dùng, nhưng trong eval được tính là LLM thất bại.
5. Có trích ít nhất một mã đoạn trong `must_cite_any` (nếu có).
6. Nội dung hiển thị (message/question/hint) không chứa chuỗi trong `must_not_contain` (vd. đáp án của câu đang chờ).
7. `max_generation_attempts` (nếu có): ví dụ G06 phải bị chặn trước khi gửi LLM (0 lần sinh).

**Tỷ lệ đạt** = số ca đạt / tổng số ca chạy.

Quality bar đề xuất (nhóm cần chốt trong `spec.md` §7 trước 21:00 17/9): **≥ 80% ca đạt, và 100% ca lớp ③ cùng mọi ca có kiểm tra lộ đáp án (G07, G13, G17) đều đạt.**

## Phân tích nguyên nhân

`run_results.md` tự nhóm ca trượt theo: Lỗi hạ tầng/LLM · Quyết định sư phạm sai · Nhận diện concept sai · Độ khó sai · Lộ đáp án · Không bám nguồn · Đầu ra LLM không hợp lệ. Mỗi ca trượt có `turn_id` để tra log prompt/phản hồi và một dòng "Nhận định của nhóm" để nhóm điền nguyên nhân gốc sau khi đọc log.
