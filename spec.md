# Template AI Spec *(spec.md — commit trước hạn chốt spec: 21:00 17/9, tại CP4 · quality bar chốt từ thời điểm nộp)*

> Cấu trúc phủ đúng "SPEC 8 phần" của chương trình: Bằng chứng (§1-§2) · Lát cắt (§4) · Canvas (đính kèm CP1) · Augment/Automate (§4) · 4 đường đi của trải nghiệm (§6) · Kiểu lỗi (§5) · Kiểm thử (§7) · Phân công (§8). Hướng dẫn viết từng mục: `02-guide.md`.

# AI SPEC — SlideAlive: biến slide khô khan thành phiên học tương tác · Nhóm E403 · Zone 3A
Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Lesson Studio  [x] D — Học tập thích ứng & tương tác  [ ] E — Làn mở
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job
- Job executor + workflow (đính kèm worksheet JTBD / ảnh sơ đồ):
  - Job executor: học viên đang học hoặc ôn lại bài trên VLearn trước quiz/spec/lab.
  - Workflow hiện tại: mở slide/transcript/video bài giảng -> đọc lại các bullet và đoạn chữ dài -> tự đoán ý chính -> nếu không hiểu thì hỏi tutor/bạn học/Discord -> quay lại slide để tìm nguồn.
  - Điểm kẹt: nhiều slide có dạng tĩnh, nhiều chữ, ít tương tác nên học viên dễ đọc lướt, mất tập trung và khó biết mình đã thật sự hiểu hay chưa.
- Core JTBD (không tên sản phẩm/AI trong câu):
  - Khi ôn một phần bài có nhiều khái niệm, học viên muốn được kéo vào một hoạt động ngắn buộc mình dự đoán, trả lời và giải thích lại, để biết mình đã hiểu đúng trước khi làm quiz/spec/lab.
- Problem statement (KHÔNG chữ AI):
  - Học viên đang ôn bài từ slide nhưng nội dung trình bày khô khan, nhiều chữ và đơn điệu; vì vậy họ dễ mất tập trung, thiếu hứng thú, đọc qua mà không tự kiểm tra được mức hiểu, dẫn tới học sai hoặc không nhớ được ý chính khi cần áp dụng.
- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - Nhóm dự kiến dùng chuẩn B: mining local trong thư mục `data/` để tìm bằng chứng cho pain "slide khô khan / mất tập trung / cần ví dụ hoặc tương tác hơn".
  - Số liệu mining / kết quả khảo sát (n = ?, % xác nhận):
    - Chưa chốt số liệu. Dự kiến mining các nguồn:
      - `data/vlearn-pack/chatlog/tutor_turns.csv`: đếm các lượt hỏi có tín hiệu học viên không hiểu hoặc cần diễn giải lại, ví dụ từ khóa "khó hiểu", "không hiểu", "giải thích lại", "ví dụ", "tóm tắt", "dễ hiểu hơn", "slide", "đoạn này".
      - `data/vlearn-pack/slides/`: kiểm tra các slide nhiều chữ/bullet, ít câu hỏi hoặc hoạt động tương tác.
      - `data/vlearn-pack/transcript/`: tìm các đoạn giảng có khái niệm trừu tượng nhưng slide đi kèm khó tự học lại.
      - `data/discord-pack/k4_messages.csv` nếu có: tìm tín hiệu học viên hỏi lại nội dung, xin ví dụ, hoặc bị kẹt khi tự ôn.
  - ≥5 quote/ví dụ nguyên văn + nguồn:
    - TODO sau khi mining data local: ghi ít nhất 5 ví dụ nguyên văn, kèm file nguồn, dòng/id bản ghi và phương pháp lọc để TA kiểm lại được.

## §2. Impact & quyết định chọn
- Bảng impact ≥3 ứng viên (bao nhiêu người · tần suất · tốn gì mỗi lần · khả thi):

| Ứng viên pain | Người bị ảnh hưởng | Tần suất | Tốn gì mỗi lần | Khả thi trong hackathon |
|---|---:|---:|---|---|
| Slide khô khan, nhiều chữ, dễ mất tập trung khi học/ôn bài | Hầu hết học viên dùng VLearn để học lại bài | Mỗi buổi học/ôn quiz/spec/lab | Mất thời gian đọc lại, học lướt, tưởng hiểu nhưng không giải thích lại được | Cao: chọn 1 slide/1 đoạn transcript và biến thành hoạt động tương tác 3 phút |
| Học viên hỏi tutor nhưng câu hỏi mơ hồ, tutor trả lời chưa đúng mức hiểu | Nhóm học viên chủ động hỏi tutor | Khi gặp đoạn khó | Có thể nhận câu trả lời quá dài, chưa đúng trọng tâm hoặc thiếu nguồn | Trung bình: cần mining chatlog và thiết kế guardrail trả lời |
| Học viên không biết mình hổng concept nào trước quiz/spec | Học viên chuẩn bị quiz/spec/lab | Trước deadline hoặc bài kiểm tra | Ôn dàn trải, bỏ sót phần yếu, mất điểm ở phần đáng lẽ sửa được | Trung bình: cần map concept và bộ câu hỏi đánh giá |

- Ứng viên ĐÃ LOẠI + vì sao:
  - Tối ưu tutor trả lời câu hỏi mơ hồ: có data mạnh nhưng thiên về Track A, chưa trực tiếp giải quyết pain nhóm chọn là slide đơn điệu và mất tập trung.
  - Bản đồ lỗ hổng concept trước quiz/spec: impact cao nhưng phạm vi lớn hơn, cần concept graph/golden set nhiều hơn để demo thuyết phục.
- Ứng viên CHỌN + vì sao (bằng số):
  - Chọn "slide khô khan, nhiều chữ, dễ mất tập trung khi học/ôn bài" vì ảnh hưởng tới phần lớn học viên mỗi khi tự học trên VLearn, có thể kiểm chứng bằng mining slide/chatlog/transcript và có thể cắt rất nhỏ: 1 slide -> 1 hoạt động tương tác -> 1 câu kiểm tra cuối. Mục tiêu validation ban đầu: tối thiểu 5 học viên ngoài nhóm học thử, so sánh câu trả lời trước/sau phiên học.

## §3. Giải pháp tương tự đã nghiên cứu
- [Sản phẩm 1]: flow / đáng học / đáng né / mình khác gì
- [Sản phẩm 2]: ...

## §4. Thiết kế
- Lát cắt MỘT CÂU (1 user · 1 việc · 1 quyết định AI · 1 kết quả):
- Non-goals (≥3 thứ KHÔNG build):
- Mức prototype nhắm tới: [ ] Sketch [ ] Mock [ ] Working — phần nào mock, phần nào thật:
- Automation: [ ] augment [ ] conditional [ ] automate — lý do theo cost-of-error:
- §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR, xem guide):
  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8) [bảng theo guide §2.5]

## §6. Bốn đường đi của trải nghiệm
- Happy path: · Low-confidence (②): · Failure/không căn cứ (①): · Correction (user sửa):
- Khi bị đòi ngoài phạm vi (③): · Case đặc thù domain (④):

## §7. Kiểm thử
- Chiều chất lượng + định nghĩa kiểm chứng được:
- Golden set (≥20 case theo cơ cấu trong guide §2.6, file trong eval/):
- Quality bar (chốt từ hạn chốt spec của khoá, giữ nguyên sau đó): "Đạt khi ≥ ___% qua bộ, và ___"
- Kết quả các lượt chạy (bảng % — cập nhật đến trước CP6):

## §8. Phân công & kế hoạch
- Phân công có tên: spec / evidence / prompt / code / demo
- Willing users (≥2 tên) + kế hoạch vòng validation *(bonus, nếu làm)*:
- Multi-prototype (nếu làm): trục khác biệt của ≥2 phương án + lý do chọn:

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
