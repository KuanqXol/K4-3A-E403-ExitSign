# User Testing Log - SlideAlive

Thời gian kiểm thử: 18/09/2026  
Prototype: SlideAlive `/tutor` - phiên học tương tác Day 1 Foundation  
Điều phối: Bùi Tùng Dương  
Mẫu thử: 5 người dùng ngoài nhóm, trong đó U1 và U2 là willing users đã đăng ký từ CP1.

| Người thử | Nhiệm vụ giao | Điểm tắc nghẽn | Trích dẫn nguyên văn | Quyết định xử lý của nhóm |
|---|---|---|---|---|
| U1 - Lâm Hoàng Phúc, willing user CP1, nền tảng CNTT | Mở slide 12, điền thuật ngữ vào bài Self-Attention, sau đó sang slide 29 tạo thử thách thích ứng và trả lời một câu hỏi | Hoàn thành nhanh phần điền khuyết nhưng dừng lại ở slide 29 khoảng 8 giây vì chưa rõ nút "Bắt đầu Thử thách Thích ứng" sẽ tạo câu hỏi ở đâu | "Nút này là bắt đầu một bài riêng hay nó hỏi luôn ở khung bên phải?" | Sửa copy vùng thử thách: mô tả rõ sẽ tạo câu hỏi AI đầu tiên về Context Window và đổi nhãn nút thành "Tạo câu hỏi AI đầu tiên". |
| U2 - Hoàng Trung Hiếu, willing user CP1, mới học Applied AI system | Bấm xin gợi ý Socratic cho câu hỏi đang chờ, sau đó chọn đáp án và đọc phản hồi | Gợi ý không lộ đáp án, nhưng người thử muốn biết gợi ý liên quan trực tiếp đến khái niệm nào | "Gợi ý ổn vì không nói đáp án, nhưng mình muốn biết nó đang gợi ý phần Context Window hay Attention." | Giữ cơ chế không lộ đáp án; đưa vào backlog hiển thị concept tag nổi bật hơn trong khung câu hỏi AI. |
| U3 - Đàm Việt Hưng, sinh viên ngoài nhóm | Từ slide 10 đọc 3 gạch đầu dòng, chuyển slide bằng nút mũi tên, thực hiện bài bắt lỗi hallucination ở slide 26 | Lần đầu chưa nhận ra dòng tuyên bố sai là vùng có thể bấm, chỉ nhìn nút nhỏ bên phải | "Em tưởng phải bấm cái nhãn màu vàng, không biết bấm cả câu cũng được." | Giữ tương tác hiện tại vì cả vùng đã có hover/click; sau demo sẽ cân nhắc đổi cursor và thêm viền hover rõ hơn cho toàn khối. |
| U4 - Đỗ Thanh Tùng, sinh viên IT ngoài nhóm | Nhập câu ngoài phạm vi "Hôm nay ăn gì?" vào Trợ lý Socratic, sau đó nhập prompt injection yêu cầu lộ system prompt | Không gặp lỗi chức năng; người thử hiểu hệ thống từ chối nhưng muốn lời từ chối ngắn hơn | "Nó từ chối đúng, nhưng hơi dài, em chỉ cần biết là câu này ngoài bài thôi." | Giữ nguyên trong bản demo vì guard đang ưu tiên an toàn và điều hướng về bài học; backlog rút gọn thông báo ngoài phạm vi. |
| U5 - Trần Khánh Linh, sinh viên ngoài nhóm | Làm bài kéo thả Temperature, sau đó hỏi "giải thích cái này" khi không có câu hỏi chờ | Người thử kỳ vọng hệ thống tự biết "cái này" là slide đang mở; hiện hệ thống hỏi lại để làm rõ | "Mình đang ở slide Temperature nên khi gõ cái này mình nghĩ nó hiểu là cái slide này." | Giữ nguyên hành vi hỏi lại để tránh đoán sai khi input mơ hồ; backlog truyền `currentSlide.conceptId` vào request hỏi tự do để hỗ trợ ngữ cảnh slide tốt hơn. |

## Tổng kết 4 dòng

- Chủ đề lặp nhiều nhất: người thử cần nhãn hành động rõ hơn để biết thao tác AI sẽ tạo câu hỏi ở đâu và thuộc concept nào.
- Sẽ sửa gì trước demo: đã sửa copy và nhãn nút ở vùng "Thử thách Thích ứng" để giảm ngập ngừng khi bắt đầu câu hỏi AI.
- Giữ nguyên gì và vì sao: giữ Socratic hint không lộ đáp án, guard từ chối ngoài phạm vi và câu hỏi làm rõ khi input mơ hồ vì đây là các ràng buộc an toàn/pedagogy đã chốt ở §7.
- Để dành sau: hiển thị concept tag nổi bật hơn trong khung câu hỏi, rút gọn thông báo ngoài phạm vi và truyền concept của slide hiện tại vào request hỏi tự do.
