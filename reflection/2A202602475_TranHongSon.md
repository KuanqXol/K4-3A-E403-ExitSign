# BÀI THU HOẠCH CÁ NHÂN
**Dự án:** SlideAlive — Học tập Thích ứng & Tương tác trên Slide  
**Cuộc thi:** VinUni AI Hackathon Batch 04 (Track D)

---

### Thông tin sinh viên
* **Họ và tên:** Trần Hồng Sơn
* **Mã sinh viên:** 2A202602475
* **Nhóm:** K4-3A-E403-ExitSign (Phòng thi E403)
* **Vai trò:** AI Core & Eval Engineer (Phụ trách Lõi AI & Đo kiểm)

---

## 1. Vai trò của tôi trong nhóm

Trong dự án SlideAlive, tôi phụ trách phần "bộ não" của hệ thống (AI Core & Eval). Nói một cách đơn giản, công việc của tôi là làm sao để:
* Khi học viên thao tác hay hỏi gì trên slide, AI hiểu đúng ý và biết lúc nào nên khen, lúc nào nên gợi ý, lúc nào nên tăng/giảm độ khó.
* AI không nói linh tinh (không bịa kiến thức), không vô tình làm lộ luôn đáp án trắc nghiệm, và không bị học viên "bẻ khóa" (prompt injection).
* Viết bộ kiểm thử tự động để đo lường xem AI hoạt động có ổn định và chính xác không trước khi đem cho người dùng thật trải nghiệm.

---

## 2. Những phần việc tôi trực tiếp làm

Tôi trực tiếp xây dựng và chịu trách nhiệm các phần sau:

### 2.1. Lập trình bộ não ra quyết định cho AI (`engine.ts`, `adaptive-policy.ts`)
* **Tự động tăng giảm độ khó:** Dựa vào việc học viên làm đúng hay sai và làm nhanh hay chậm, hệ thống sẽ tự chấm điểm hiểu bài (Mastery từ 0 đến 100%). Nếu bạn làm đúng liên tục, câu hỏi sau sẽ khó hơn (từ Dễ lên Trung bình rồi Khó). Nếu bạn làm sai hoặc xin gợi ý, hệ thống tự động hạ độ khó xuống để bạn không bị nản.
* **Quyết định cách AI phản hồi:** 
  * Gặp kiến thức mới: Bắt học viên đoán trước để kích thích suy nghĩ (`PREDICT_FIRST`).
  * Học viên hiểu sai: Đưa ra câu hỏi để học viên tự nhận ra chỗ sai (`MISCONCEPTION_PROBE`).
  * Học viên hỏi xin đáp án: Chỉ đưa ra gợi ý từng bước chứ không nói thẳng đáp án (`SOCRATIC_HINT`).
  * Học viên hỏi chuyện phiếm ngoài lề: Lịch sự từ chối và hướng bạn quay lại bài học (`REFUSE_OUT_OF_SCOPE`).
* **Hiểu ngữ cảnh slide đang mở:** Ban đầu, khi học viên hỏi cộc lốc như *"giải thích cái này"*, AI không hiểu "cái này" là cái gì nên hay hỏi vặn lại. Tôi đã xử lý để hệ thống tự động gửi kèm thông tin slide học viên đang xem vào cho AI, giúp AI giải thích đúng ngay trọng tâm bài học.

### 2.2. Xây dựng 4 chốt an toàn kiểm duyệt câu trả lời của AI (`validator.ts`, `guard.ts`)
LLM (mô hình ngôn ngữ) rất hay trả lời tùy hứng. Để đảm bảo chất lượng giáo dục, tôi đặt ra 4 "cửa ải" bắt buộc mọi câu trả lời của AI phải vượt qua:
1. **Kiểm tra đúng định dạng JSON:** AI bắt buộc phải trả về đúng cấu trúc gồm câu giải thích, câu hỏi trắc nghiệm và đủ 4 phương án A/B/C/D.
2. **Chống lộ đáp án:** Nếu câu trắc nghiệm đáp án đúng là "Attention", thì trong phần gợi ý và lời dẫn của AI tuyệt đối không được xuất hiện từ khóa đó.
3. **Phải bám sát bài giảng:** AI phải dẫn nguồn chính xác từ đoạn trích của bài học (`[Txx-NNN]`), không được tự bịa ra thông tin bên ngoài.
4. **Bộ lọc chặn phá hoại:** Tự động phát hiện và chặn các câu gõ linh tinh vô nghĩa hoặc các câu cố tình lừa AI (prompt injection) ngay từ đầu để tiết kiệm chi phí gọi API.

Nếu câu trả lời của AI bị lỗi ở một trong các chốt này, hệ thống sẽ tự động bắt AI sinh lại (tối đa 2 lần). Nếu vẫn lỗi thì dùng câu trả lời dự phòng an toàn có sẵn, giúp màn hình người học không bao giờ bị đơ hay báo lỗi xấu.

### 2.3. Tạo bộ kiểm thử 20 ca Golden Set và script đo điểm (`eval/`)
* Tôi tự tay biên soạn **20 tình huống thực tế** (`golden_set.json`) mô phỏng đủ các kiểu học viên: học viên hiểu bài, học viên hiểu sai, học viên hỏi câu mơ hồ, học viên hỏi ngoài bài học, học viên cố tình hack prompt...
* Viết script chạy tự động để kiểm tra 20 ca này trên API thật của OpenAI, tự động tính tỷ lệ đạt và xuất ra file báo cáo `run_results.md`.
* Viết thêm bộ **28 bài test tự động (unit tests)** chạy nội bộ trong mã nguồn để đảm bảo mỗi lần nhóm sửa code thì hệ thống cũ vẫn chạy tốt 100%.

---

## 3. Cách tôi ứng dụng AI trong quá trình làm việc

Trong suốt cuộc thi, tôi ứng dụng AI theo các cách thực tế sau:

1. **Dùng AI như một người bạn cùng lập trình (Pair-programming):** 
   Tôi dùng AI để hỗ trợ viết nhanh các hàm kiểm tra chuỗi (regex bắt lộ đáp án), tạo cấu trúc khung cho các file và tối ưu hóa đoạn code nhận dữ liệu dạng luồng (stream NDJSON) để giao diện hiển thị mượt mà không bị giật lag.
2. **Chia việc cho 2 lượt AI riêng biệt thay vì dồn hết vào 1 lượt:**
   Nếu bắt AI vừa đọc câu hỏi của học sinh, vừa nghĩ cách dạy, vừa viết ra câu hỏi trắc nghiệm trong 1 câu prompt thì AI rất dễ bị quá tải và làm sai. Tôi chia ra:
   * Lượt 1 (AI Analyzer): Chỉ chuyên tâm đọc câu của học viên để xem bạn đang muốn gì và có hiểu sai chỗ nào không.
   * Lượt 2 (AI Generator): Nhận chỉ đạo từ thuật toán của tôi để sinh ra câu trả lời và câu đố phù hợp.
3. **Dùng AI để tự tạo dữ liệu kiểm thử:**
   Tôi dùng AI để sinh thử hàng chục câu hỏi hóc búa, các câu gõ tắt và các câu hỏi "bẫy" để kiểm tra xem hệ thống phòng thủ của mình có thực sự chặn được hết lỗi hay không.

---

## 4. Bài học thực tế từ chính những thất bại của nhóm

Quá trình làm dự án không hề suôn sẻ ngay từ đầu, và tôi đã rút ra được 2 bài học "xương máu" từ những lần thất bại:

### Bài học 1: Cú ngã 50% ở lần test đầu tiên — Đừng bao giờ tin tưởng tuyệt đối vào AI
* **Thất bại thực tế:** 
  Ở lần chạy kiểm thử 20 ca đầu tiên, hệ thống của tôi **chỉ đạt 10/20 ca (đúng 50%)**, rớt phân nửa. Khi mở log ra xem, tôi mới ngã ngửa vì AI phân tích quá ngây ngô:
  * Khi gặp một ca học viên phát biểu sai kiến thức: *"Bài giảng khuyên nên đặt temperature = 2.0 để dữ liệu chính xác tuyệt đối"*, AI thấy câu này sai so với tài liệu nên lập tức đánh dấu là "ngoài phạm vi bài học" (`out_of_scope`) và từ chối trả lời! Trong khi thực tế đây là trường hợp học sinh hiểu sai và giáo viên cần phải chỉnh lại cho bạn.
  * Khi học viên hỏi cộc lốc: *"Gợi ý đi"*, dù trên màn hình lúc đó chưa có câu hỏi nào, AI vẫn máy móc sinh ra một gợi ý vu vơ chẳng liên quan.
* **Cách khắc phục:** 
  Tôi không cố sửa prompt cho dài thêm nữa vì càng viết dài AI càng dễ loạn. Thay vào đó, tôi viết một hàm luật cứng bằng code thường (`normalizeAnalysis`) kẹp ngay sau AI: nếu câu hỏi có chứa từ khóa bài học thì bắt buộc phải giữ lại trong bài, và nếu chưa có câu hỏi đang chờ thì không được phép đưa gợi ý. Nhờ sửa cách tiếp cận này, tỷ lệ test ở lần chạy thứ 2 đã **tăng vọt từ 50% lên 95% (19/20 ca đạt)**.
* **Bài học rút ra:** 
  > Không thể phó mặc logic quan trọng cho AI tự tung tự tác. Một hệ thống AI tốt trong thực tế luôn phải kết hợp: AI làm phần đọc hiểu ngôn ngữ, còn code logic truyền thống phải làm chốt chặn quyết định cuối cùng.

### Bài học 2: Socratic quá đà thành ra đánh đố — Khiến người dùng bực mình
* **Thất bại thực tế:** 
  Lúc đầu, nhóm tôi rất tâm đắc với nguyên tắc sư phạm "Socratic" (không bao giờ cho học viên đáp án mà luôn đặt câu hỏi ngược lại). Nhưng khi nhờ một bạn sinh viên ngoài nhóm (bạn Linh) vào dùng thử, bạn ấy gõ câu hỏi: *"attention ở đây là gì vậy?"*. 
  Thay vì trả lời, AI lại quẳng ra ngay một câu hỏi trắc nghiệm 4 đáp án và bắt bạn chọn. Bạn ấy rất khó chịu và bảo: *"Mình còn chưa biết nó là cái gì thì làm sao bắt mình đoán được, AI này như đang đánh đố người dùng vậy!"*.
* **Cách khắc phục:** 
  Tôi đã sửa lại ngay: khi học viên chủ động hỏi khái niệm, AI phải **giải thích ngắn gọn, dễ hiểu trước (khoảng 2–3 câu)** để người học có nền tảng, rồi sau đó mới đưa ra thử thách để kiểm tra xem bạn đã hiểu thật chưa. Đồng thời, tôi đưa các câu hỏi thích ứng vào hiển thị trực tiếp trong ô bài tập trên slide, còn khung chat bên phải để học viên thoải mái hỏi đáp.
* **Bài học rút ra:** 
  > Lý thuyết sư phạm hay đến mấy mà áp dụng máy móc thì cũng làm hỏng trải nghiệm người dùng. AI trong học tập trước hết phải giúp người học giải tỏa thắc mắc và cảm thấy được hỗ trợ, sau đó mới đến việc thử thách và gợi mở tư duy.

---

## 5. Lời kết

Tham gia Hackathon lần này là một trải nghiệm thực chiến rất quý giá đối với tôi. Tôi học được cách biến các ý tưởng trên giấy thành code chạy thật, biết cách kiểm soát để AI không nói bừa, và quan trọng nhất là học được cách lắng nghe người dùng thật để liên tục sửa đổi cho sản phẩm thân thiện và hữu ích hơn.

*Hà Nội, ngày 18 tháng 09 năm 2026*  
**Người viết thu hoạch**  
*Trần Hồng Sơn*
