# Kết quả chạy Golden Set

> File này do `codebase/scripts/run-eval.ts` sinh tự động từ `eval/runs/*.json` và `eval/analysis/*.md`. Không sửa tay số liệu.
> Quality bar đề xuất (nhóm chốt trong spec.md §7): Đạt khi ≥ 80% số ca qua tiêu chí nghiệm thu, và 100% ca lớp ③ (ngoài phạm vi) cùng mọi ca có kiểm tra lộ đáp án đều đạt.

Tiêu chí nghiệm thu mỗi ca: đúng `action` (và `difficulty`/`concept` nếu ca quy định) · đầu ra qua Validator (schema, đáp án, bám nguồn, không lộ đáp án) · không phải dùng fallback · trích đúng mã đoạn nếu ca yêu cầu · không chứa nội dung cấm. **Tỷ lệ đạt = số ca đạt / tổng số ca.**

## Tổng hợp các lượt chạy

| Lượt | Thời điểm | Model | Tổng | Đạt | Thất bại | Tỷ lệ đạt |
|---|---|---|---:|---:|---:|---:|
| Lượt 1 (`run-20260917T050230`) | 2026-09-17T05:02:30.522Z | gpt-4o-mini | 20 | 10 | 10 | 50.0% |
| Lượt 2 - sửa prompt sinh + chuẩn hoá phân tích (`run-20260917T051809`) | 2026-09-17T05:18:09.304Z | gpt-4o-mini | 20 | 19 | 1 | 95.0% |
| Lượt 3 - prompt tiếng Anh (`run-20260917T052125`) | 2026-09-17T05:21:25.007Z | gpt-4o-mini | 20 | 19 | 1 | 95.0% |
| Lượt 4 - chống lặp câu hỏi + streaming (`run-20260917T053033`) | 2026-09-17T05:30:33.127Z | gpt-4o-mini | 20 | 19 | 1 | 95.0% |

## Lượt 1

`run-20260917T050230` · 2026-09-17T05:02:30.522Z · model `gpt-4o-mini` · endpoint `https://api.openai.com/v1`

**Đạt 10/20 = 50.0%** · Thất bại 10

> Kết quả 20 ca của golden set v1.1, trích nguyên trạng từ lượt chạy 26 ca v1.0 cùng thời điểm (cùng input, cùng model; không chạy lại, không sửa kết quả). Bản gốc: eval/runs_archive/run-20260917T050230-26ca.json. turn_id giữ id cũ để tra log.

### 1.1 Theo lớp chỗ khó / nhóm ca

| Lớp | Số ca | Đạt | Thất bại | Tỷ lệ |
|---|---:|---:|---:|---:|
| 1_nguon_su_that | 2 | 1 | 1 | 50.0% |
| 2_mo_ho | 2 | 0 | 2 | 0.0% |
| 3_ngoai_pham_vi | 2 | 2 | 0 | 100.0% |
| 4_dac_thu_nghiep_vu | 2 | 2 | 0 | 100.0% |
| pho_bien | 9 | 3 | 6 | 33.3% |
| edge | 3 | 2 | 1 | 66.7% |

### 1.2 Độ ổn định của bước sinh (LLM generate)

| Chỉ số sinh câu hỏi | Giá trị |
|---|---:|
| Ca có gọi LLM sinh | 18 |
| Qua validator ngay lần 1 | 11/18 (61.1%) |
| Phải dùng fallback sau 3 lần | 2/18 (11.1%) |
| Ca bị chặn bằng luật, không gọi LLM | 2 |

### 1.3 Chi tiết từng ca

| Ca | Lớp | Nguồn | Kết quả | Action | Độ khó | Concept | Lần sinh | Fallback | turn_id (tra trong llm_calls.log) |
|---|---|---|---|---|---|---|---:|---|---|
| G01 | 1_nguon_su_that | chatlog T02518 | ❌ Trượt | REFUSE_OUT_OF_SCOPE | E | temperature_sampling | 1 | không | `run-20260917T050230-G01` |
| G02 | 1_nguon_su_that | chatlog T10975 | ✅ Đạt | MISCONCEPTION_PROBE | E | hallucination | 2 | không | `run-20260917T050230-G02` |
| G03 | 2_mo_ho | chatlog T02916 | ❌ Trượt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T050230-G04` |
| G04 | 2_mo_ho | chatlog T02914 | ❌ Trượt | SOCRATIC_HINT | E | attention | 1 | không | `run-20260917T050230-G05` |
| G05 | 3_ngoai_pham_vi | chatlog T02919 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 1 | không | `run-20260917T050230-G07` |
| G06 | 3_ngoai_pham_vi | chatlog T02760 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 0 | không | `run-20260917T050230-G08` |
| G07 | 4_dac_thu_nghiep_vu | chatlog T10515 | ✅ Đạt | SOCRATIC_HINT | E | temperature_sampling | 1 | không | `run-20260917T050230-G11` |
| G08 | 4_dac_thu_nghiep_vu | tự xây | ✅ Đạt | MISCONCEPTION_PROBE | E | next_token_prediction | 2 | không | `run-20260917T050230-G13` |
| G09 | pho_bien | chatlog T10365 | ❌ Trượt | SOCRATIC_HINT | E | next_token_prediction | 1 | không | `run-20260917T050230-G14` |
| G10 | pho_bien | chatlog T10367 | ❌ Trượt | MISCONCEPTION_PROBE | E | attention | 1 | không | `run-20260917T050230-G15` |
| G11 | pho_bien | chatlog T09449 | ❌ Trượt | REFUSE_OUT_OF_SCOPE | E | tokenization | 1 | không | `run-20260917T050230-G16` |
| G12 | pho_bien | chatlog T04654 | ❌ Trượt | REFUSE_OUT_OF_SCOPE | E | tokenization | 1 | không | `run-20260917T050230-G17` |
| G13 | pho_bien | chatlog T10317 | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T050230-G18` |
| G14 | pho_bien | chatlog T13114 | ❌ Trượt | ASK_CLARIFY | E | tokenization | 2 | không | `run-20260917T050230-G19` |
| G15 | pho_bien | tự xây | ❌ Trượt | REINFORCE_EXPLAIN | M | tokenization | 3 | có | `run-20260917T050230-G21` |
| G16 | pho_bien | tự xây | ✅ Đạt | CONTINUE | E | hallucination | 2 | không | `run-20260917T050230-G22` |
| G17 | pho_bien | tự xây | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T050230-G23` |
| G18 | edge | chatlog T02927 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 3 | không | `run-20260917T050230-G24` |
| G19 | edge | tự xây | ❌ Trượt | PREDICT_FIRST | E | context_window | 3 | có | `run-20260917T050230-G25` |
| G20 | edge | chatlog T04019 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | attention | 0 | không | `run-20260917T050230-G26` |

### 1.4 Ca thất bại

| Nhóm nguyên nhân | Số ca | Ca |
|---|---:|---|
| Quyết định sư phạm sai | 8 | G01, G03, G04, G09, G10, G11, G12, G14 |
| Đầu ra LLM không hợp lệ | 2 | G15, G19 |

#### G01 — Tiền đề sai: bài giảng 'khuyên' temperature 2.0 cho dữ liệu chính xác

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=REFUSE_OUT_OF_SCOPE, mong đợi MISCONCEPTION_PROBE
- không trích T04-072\|T04-071 (có: ∅)
- Phân tích lượt: scope=`out_of_scope`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G01` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G03 — Câu mơ hồ, không có câu hỏi đang chờ

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=SOCRATIC_HINT, mong đợi ASK_CLARIFY
- Phân tích lượt: scope=`in_lesson`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G04` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G04 — Câu mơ hồ 'Giải thích cái này.' không rõ đối tượng

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=SOCRATIC_HINT, mong đợi ASK_CLARIFY
- Phân tích lượt: scope=`in_lesson`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G05` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G09 — Hỏi concept mới → dự đoán trước (productive failure), mức dễ

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=SOCRATIC_HINT, mong đợi PREDICT_FIRST
- Phân tích lượt: scope=`in_lesson`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G14` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G10 — Hỏi Transformer (gõ sai) → concept attention

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=MISCONCEPTION_PROBE, mong đợi PREDICT_FIRST
- Phân tích lượt: scope=`in_lesson`, intent=`explain_back`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G15` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G11 — Hỏi temperature/top_p khi gọi API

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=REFUSE_OUT_OF_SCOPE, mong đợi PREDICT_FIRST
- concept=tokenization, mong đợi temperature_sampling
- không trích T04-071\|T04-072 (có: ∅)
- Phân tích lượt: scope=`out_of_scope`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G16` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G12 — Hỏi RLHF

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=REFUSE_OUT_OF_SCOPE, mong đợi PREDICT_FIRST
- concept=tokenization, mong đợi rlhf
- Phân tích lượt: scope=`out_of_scope`, intent=`ask_concept`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G17` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G14 — Hỏi lại concept đã khá vững → yêu cầu tự giải thích

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=ASK_CLARIFY, mong đợi REINFORCE_EXPLAIN
- concept=tokenization, mong đợi context_window
- Phân tích lượt: scope=`ambiguous`, intent=`ask_hint`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G19` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G15 — Trả lời đúng, nhanh, mastery khá → protégé (tự giải thích)

- Nhóm nguyên nhân: **Đầu ra LLM không hợp lệ**
- phải dùng fallback (LLM không qua validator sau 3 lần)
- Phân tích lượt: scope=`in_lesson`, intent=`answer_attempt`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G21` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

#### G19 — Học viên bỏ qua liên tục, dùng nhiều hint, phản hồi chậm → hạ độ khó

- Nhóm nguyên nhân: **Đầu ra LLM không hợp lệ**
- phải dùng fallback (LLM không qua validator sau 3 lần)
- Phân tích lượt: scope=`in_lesson`, intent=`none`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T050230-G25` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 1**.

### 1.5 Phân tích nguyên nhân chi tiết — Lượt 1

> Nguồn: `eval/analysis/run-20260917T050230.md`

Phân tích dựa trên `codebase/logs/llm_calls.log` (prompt đầu vào + phản hồi thô của từng lời gọi). Lỗi validator của từng lần sinh được dựng lại bằng cách chạy lại `validator.ts` trên đúng phản hồi thô đã log (lượt này chạy trước khi `attempt_errors` được lưu vào kết quả). Lượt chạy gốc (26 ca) có 58 lời gọi, độ trễ trung bình 2,4 s/lời gọi, tối đa 4,3 s; không có lỗi mạng hay lỗi API.

#### Tóm tắt

| Nguyên nhân gốc | Số ca | Ca | Tầng lỗi |
|---|---:|---|---|
| A. Analyzer gán `intent=ask_hint` khi **không có câu hỏi đang chờ** → policy chọn `SOCRATIC_HINT` | 3 | G03, G04, G09 | Prompt phân tích + policy |
| B. Analyzer gán `scope=out_of_scope` cho khái niệm **có trong bài** | 3 | G01, G11, G12 | Prompt phân tích + policy |
| C. Analyzer bỏ qua gợi ý từ khoá, không nhận ra concept | 1 | G14 | Prompt phân tích |
| D. Analyzer hiểu câu hỏi gõ sai là "giải thích sai" | 1 | G10 | Prompt phân tích |
| E. Generator không tuân schema theo từng action, 3 lần liền → fallback | 2 | G15, G19 | Prompt sinh |

8/10 ca trượt nằm ở **bước phân tích lượt học viên**, không phải ở bước sinh câu hỏi. Khi analyzer phân loại đúng, policy và generator nhìn chung hoạt động đúng: các lớp ③ và ④ đạt 4/4, trong đó có 1 ca chặn injection (G06). Cả 3 ca kiểm tra lộ đáp án (G07, G13, G17) đều đạt.

#### Chi tiết từng ca

**G01 — tiền đề sai "bài giảng khuyên temperature 2.0" (lớp ①)**
Analyzer trả `scope=out_of_scope, intent=ask_hint, concept_id=temperature_sampling, false_premise=true`. Như vậy nó đã nhận ra concept và tiền đề sai, nhưng vẫn gắn nhãn ngoài phạm vi. `decide()` kiểm tra `scope` trước `false_premise`, nên chọn `REFUSE_OUT_OF_SCOPE`: học viên bị từ chối thay vì được sửa ngộ nhận, và câu trả lời không trích nguồn T04-071/072.
→ *Sửa:* trong policy, khi `concept_id` hợp lệ hoặc `false_premise=true` thì không để `out_of_scope` thắng. Trong prompt, nêu rõ "câu hỏi về nội dung có trong danh mục, kể cả tiền đề sai, là `in_lesson` + `claim_check`".

**G03 "Nói rõ hơn đi." / G04 "Giải thích cái này." — câu mơ hồ (lớp ②)**
Analyzer trả `scope=in_lesson, intent=ask_hint, concept_id=null`, với lý do "yêu cầu giải thích mà không có câu hỏi đang chờ". Mô hình tự nhận ra thiếu đối tượng nhưng không chọn `ambiguous`. Luật trong prompt ("có câu hỏi đang chờ + khó hiểu → ask_hint") bị áp dụng cả khi không có câu hỏi đang chờ. Policy nhận `ask_hint` thì ra `SOCRATIC_HINT` và gợi ý về concept mặc định của phiên (token, attention). Đây là đoán ý, trái yêu cầu lớp ②.
→ *Sửa:* trong policy, `ask_hint` mà không có `pending_interaction` và `concept_id=null` thì chọn `ASK_CLARIFY`. Trong prompt, thêm ví dụ âm: "không có câu hỏi đang chờ" + "nói rõ hơn" → `ambiguous`.

**G09 "cơ chế dự đoán LLM sinh văn bản" — hỏi concept mới (phổ biến)**
Analyzer trả `intent=ask_hint` (đúng concept `next_token_prediction`), nên policy ra `SOCRATIC_HINT` thay vì `PREDICT_FIRST`. Cùng gốc với A.
→ *Sửa:* ở policy, `ask_hint` không có câu hỏi đang chờ nhưng có concept thì xử lý như `ask_concept`.

**G10 "kiến trúc Tranformer là gfi" — gõ sai (phổ biến)**
Analyzer trả `intent=explain_back, false_premise=true, explanation_score=0.2`, lý do "dùng từ 'gfi' không rõ ràng … hiểu sai". Lỗi gõ ("gfi" = "gì") bị coi là học viên giải thích sai, nên ra `MISCONCEPTION_PROBE`. Concept `attention` thì đúng.
→ *Sửa:* thêm vào prompt "câu dạng 'X là gì' (kể cả gõ sai, không dấu) = `ask_concept`". Chỉ tính `explain_back` khi đang có câu hỏi `FREE_EXPLAIN` chờ.

**G11 "Temperature và top_p dùng để làm gì khi gọi API?" / G12 "rlhf là gì" (phổ biến)**
Analyzer trả `scope=out_of_scope, concept_id=null` dù cả hai concept đều có trong danh mục (`temperature_sampling`, `rlhf`). Lý do được đưa ra là "không có câu hỏi đang chờ" / "không thuộc phạm vi". Mô hình nhầm "không có câu hỏi đang chờ" thành "ngoài phạm vi". Engine đã truyền `Gợi ý từ khoá` (`temperature_sampling`, `rlhf`) nhưng mô hình bỏ qua. Hậu quả: generator viết lời từ chối kiểu "nội dung bạn đề cập về temperature và top-p không nằm trong phạm vi bài học hôm nay" (G11) và "Mình không thể giải thích về RLHF trong bài học này" (G12), tức là **trả lời sai sự thật về phạm vi bài**. Đây là ca nghiêm trọng nhất, vì làm học viên hiểu sai nội dung khoá.
→ *Sửa:* ở policy, nếu keyword guess khớp một concept thì không cho `out_of_scope` (hạ về `in_lesson` + concept đó). Trong prompt, tách rõ hai khái niệm "phạm vi" và "câu hỏi đang chờ".

**G14 "context window là gì" — concept đã học một phần (phổ biến)**
Analyzer trả `scope=ambiguous, concept_id=null`, lý do "câu hỏi quá chung chung", dù cụm "context window" trùng nguyên văn tên concept và từ khoá gợi ý. Policy ra `ASK_CLARIFY` thay vì `REINFORCE_EXPLAIN`. Ngoài ra, lần sinh #1 bị validator loại vì thiếu `question`; lần #2 mới đạt.
→ *Sửa:* tương tự B, khi keyword guess khớp chính xác tên concept thì dùng concept đó.

**G15 — trả lời đúng, mastery 70, yêu cầu tự giải thích (phổ biến)**
Quyết định đúng (`REINFORCE_EXPLAIN`, không cần LLM phân tích vì lựa chọn được chấm bằng luật). Cả 3 lần sinh đều bị loại vì **"thiếu câu yêu cầu giải thích"**: mô hình đặt lời yêu cầu trong `message` và để `question=null`. Thông điệp retry ("thiếu câu yêu cầu giải thích") không nói rõ phải điền trường nào, nên mô hình lặp lại cùng lỗi, và hệ thống phải dùng fallback.
→ *Sửa:* ghi rõ trong prompt từng action cần các trường bắt buộc nào (REINFORCE_EXPLAIN: `question` ≠ null, `rubric` ≥ 2). Thông điệp lỗi của validator nên chỉ đúng trường cần sửa, ví dụ "trường `question` đang null". Có thể dùng `response_format: json_schema` để ép cấu trúc.

**G19 — học viên bỏ qua liên tục, cần câu dễ (edge)**
Quyết định đúng (`PREDICT_FIRST`, độ khó E). Cả 3 lần sinh đều có 4 lựa chọn hợp lý nhưng `correct_option_index=null`, hai lần còn có `rubric=[]`. Mô hình coi câu "dự đoán" là câu mở, không có đáp án. Kết quả là phải dùng fallback.
→ *Sửa:* ghi rõ trong prompt "PREDICT_FIRST/CONTINUE/MISCONCEPTION_PROBE bắt buộc `correct_option_index` là số 0–3 và `rubric` ≥ 1".

#### Lỗi tuân thủ schema ở các ca vẫn đạt

Các ca sau đạt nhưng lần sinh đầu bị validator loại, nhờ retry mới qua. Điều này cho thấy lớp validator và retry đang cứu kết quả:

| Ca | Lần 1 bị loại vì | Qua ở lần |
|---|---|---:|
| G02 | thiếu `question`, thiếu `rubric` | 2 |
| G08 | thiếu `rubric` | 2 |
| G16 | `correct_option_index` null, thiếu `rubric` | 2 |
| G18 | thiếu câu hỏi làm rõ (2 lần) | 3 |

Tính trên toàn bộ ca có gọi LLM sinh, chỉ 61% qua validator ngay lần đầu. Hai lỗi phổ biến nhất là **thiếu `rubric`** và **`correct_option_index` null**.

#### Nhận xét về bộ test

- Không ca nào trượt do lộ đáp án hay trích nguồn bịa; validator bắt được mọi lỗi cấu trúc.
- **Lỗ hổng của validator:** lời từ chối sai ở G11/G12 vẫn được tính là hợp lệ, vì với `REFUSE_OUT_OF_SCOPE` validator chỉ kiểm tra cấu trúc, không kiểm tra câu hỏi có thật sự nằm ngoài bài hay không. Cần thêm kiểm tra: từ chối mà keyword guess lại khớp một concept thì đánh dấu không hợp lệ.
- Tiêu chí "không dùng fallback" khiến G15 và G19 bị tính trượt, dù người học vẫn nhận được câu hỏi mẫu hợp lệ. Nhóm giữ tiêu chí này vì nó đo đúng năng lực của LLM.

#### Ưu tiên sửa cho Lượt 2

1. **Policy (không tốn thêm lời gọi LLM):** keyword guess khớp thì không cho `out_of_scope`/`ambiguous`; `ask_hint` không có câu hỏi đang chờ thì xử lý như `ask_concept` hoặc `ASK_CLARIFY`; `false_premise` được ưu tiên hơn `out_of_scope` khi có concept. Dự kiến sửa được G01, G03, G04, G09, G11, G12, G14.
2. **Prompt phân tích:** thêm ví dụ âm/dương cho "là gì", câu gõ sai, và câu mơ hồ không có câu hỏi đang chờ. Dự kiến sửa G10.
3. **Prompt sinh + validator:** liệt kê trường bắt buộc theo action; thông điệp lỗi chỉ đúng trường cần sửa. Dự kiến sửa G15, G19 và giảm số lần retry.

## Lượt 2 - sửa prompt sinh + chuẩn hoá phân tích

`run-20260917T051809` · 2026-09-17T05:18:09.304Z · model `gpt-4o-mini` · endpoint `https://api.openai.com/v1`

**Đạt 19/20 = 95.0%** · Thất bại 1

### 2.1 Theo lớp chỗ khó / nhóm ca

| Lớp | Số ca | Đạt | Thất bại | Tỷ lệ |
|---|---:|---:|---:|---:|
| 1_nguon_su_that | 2 | 2 | 0 | 100.0% |
| 2_mo_ho | 2 | 2 | 0 | 100.0% |
| 3_ngoai_pham_vi | 2 | 2 | 0 | 100.0% |
| 4_dac_thu_nghiep_vu | 2 | 2 | 0 | 100.0% |
| pho_bien | 9 | 8 | 1 | 88.9% |
| edge | 3 | 3 | 0 | 100.0% |

### 2.2 Độ ổn định của bước sinh (LLM generate)

| Chỉ số sinh câu hỏi | Giá trị |
|---|---:|
| Ca có gọi LLM sinh | 18 |
| Qua validator ngay lần 1 | 18/18 (100.0%) |
| Phải dùng fallback sau 3 lần | 0/18 (0.0%) |
| Ca bị chặn bằng luật, không gọi LLM | 2 |

### 2.3 Chi tiết từng ca

| Ca | Lớp | Nguồn | Kết quả | Action | Độ khó | Concept | Lần sinh | Fallback | turn_id (tra trong llm_calls.log) |
|---|---|---|---|---|---|---|---:|---|---|
| G01 | 1_nguon_su_that | chatlog T02518 | ✅ Đạt | MISCONCEPTION_PROBE | E | temperature_sampling | 1 | không | `run-20260917T051809-G01` |
| G02 | 1_nguon_su_that | chatlog T10975 | ✅ Đạt | MISCONCEPTION_PROBE | E | hallucination | 1 | không | `run-20260917T051809-G02` |
| G03 | 2_mo_ho | chatlog T02916 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T051809-G03` |
| G04 | 2_mo_ho | chatlog T02914 | ✅ Đạt | ASK_CLARIFY | E | attention | 1 | không | `run-20260917T051809-G04` |
| G05 | 3_ngoai_pham_vi | chatlog T02919 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 1 | không | `run-20260917T051809-G05` |
| G06 | 3_ngoai_pham_vi | chatlog T02760 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 0 | không | `run-20260917T051809-G06` |
| G07 | 4_dac_thu_nghiep_vu | chatlog T10515 | ✅ Đạt | SOCRATIC_HINT | E | temperature_sampling | 1 | không | `run-20260917T051809-G07` |
| G08 | 4_dac_thu_nghiep_vu | tự xây | ✅ Đạt | MISCONCEPTION_PROBE | E | next_token_prediction | 1 | không | `run-20260917T051809-G08` |
| G09 | pho_bien | chatlog T10365 | ✅ Đạt | PREDICT_FIRST | E | next_token_prediction | 1 | không | `run-20260917T051809-G09` |
| G10 | pho_bien | chatlog T10367 | ❌ Trượt | REFUSE_OUT_OF_SCOPE | E | tokenization | 1 | không | `run-20260917T051809-G10` |
| G11 | pho_bien | chatlog T09449 | ✅ Đạt | PREDICT_FIRST | E | temperature_sampling | 1 | không | `run-20260917T051809-G11` |
| G12 | pho_bien | chatlog T04654 | ✅ Đạt | PREDICT_FIRST | E | rlhf | 1 | không | `run-20260917T051809-G12` |
| G13 | pho_bien | chatlog T10317 | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T051809-G13` |
| G14 | pho_bien | chatlog T13114 | ✅ Đạt | REINFORCE_EXPLAIN | M | context_window | 1 | không | `run-20260917T051809-G14` |
| G15 | pho_bien | tự xây | ✅ Đạt | REINFORCE_EXPLAIN | M | tokenization | 1 | không | `run-20260917T051809-G15` |
| G16 | pho_bien | tự xây | ✅ Đạt | CONTINUE | E | hallucination | 1 | không | `run-20260917T051809-G16` |
| G17 | pho_bien | tự xây | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T051809-G17` |
| G18 | edge | chatlog T02927 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T051809-G18` |
| G19 | edge | tự xây | ✅ Đạt | PREDICT_FIRST | E | context_window | 1 | không | `run-20260917T051809-G19` |
| G20 | edge | chatlog T04019 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | attention | 0 | không | `run-20260917T051809-G20` |

### 2.4 Ca thất bại

| Nhóm nguyên nhân | Số ca | Ca |
|---|---:|---|
| Quyết định sư phạm sai | 1 | G10 |

#### G10 — Hỏi Transformer (gõ sai) → concept attention

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=REFUSE_OUT_OF_SCOPE, mong đợi PREDICT_FIRST
- concept=tokenization, mong đợi attention
- Validator từng lần sinh: #1 OK
- Phân tích lượt: scope=`out_of_scope`, intent=`chitchat`, misconception=`∅`
- Prompt + phản hồi thô: tìm `turn=run-20260917T051809-G10` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 2 - sửa prompt sinh + chuẩn hoá phân tích**.

### 2.5 Phân tích nguyên nhân chi tiết — Lượt 2 - sửa prompt sinh + chuẩn hoá phân tích

> Nguồn: `eval/analysis/run-20260917T051809.md`

Lượt này áp dụng các hướng sửa rút ra từ Lượt 1. Chỉ dẫn trong prompt lúc này vẫn là tiếng Việt.

- **Prompt sinh:** liệt kê trường bắt buộc theo từng action, và nói rõ `correct_option_index`/`rubric` là đáp án bí mật nhưng vẫn phải điền. Kết quả: 18/18 lần sinh qua validator ngay lần đầu (Lượt 1: 11/18), không còn ca nào phải dùng fallback. G15 và G19 hết lỗi.
- **Thông báo lỗi validator** giờ chỉ đúng tên trường. Không có lần retry nào trong lượt này nên chưa đo được tác dụng.
- **`normalizeAnalysis()`** viết lại nhãn của analyzer ở **7/14** lượt phân tích (G01, G03, G04, G09, G11, G12, G14). Cả 7 ca này, vốn trượt ở Lượt 1, đều đạt. Nghĩa là analyzer (prompt tiếng Việt, luật cũ) vẫn phân loại sai như Lượt 1, và luật chuẩn hoá đã sửa lại được.

#### Ca thất bại: G10 "kiến trúc Tranformer là gfi"

Analyzer trả `scope=out_of_scope, intent=chitchat, concept_id=null`, lý do "Câu nói không liên quan đến nội dung bài học". Học viên gõ "Tranformer" (thiếu chữ s) nên không khớp từ khoá `transformer` của concept `attention`. Vì vậy luật "khớp concept → in_lesson" không áp dụng được, và hệ thống từ chối một câu hỏi thuộc bài.
→ Lượt 3 thêm luật về lỗi gõ vào prompt phân tích (xem phân tích Lượt 3).

## Lượt 3 - prompt tiếng Anh

`run-20260917T052125` · 2026-09-17T05:21:25.007Z · model `gpt-4o-mini` · endpoint `https://api.openai.com/v1`

**Đạt 19/20 = 95.0%** · Thất bại 1

### 3.1 Theo lớp chỗ khó / nhóm ca

| Lớp | Số ca | Đạt | Thất bại | Tỷ lệ |
|---|---:|---:|---:|---:|
| 1_nguon_su_that | 2 | 2 | 0 | 100.0% |
| 2_mo_ho | 2 | 2 | 0 | 100.0% |
| 3_ngoai_pham_vi | 2 | 2 | 0 | 100.0% |
| 4_dac_thu_nghiep_vu | 2 | 2 | 0 | 100.0% |
| pho_bien | 9 | 8 | 1 | 88.9% |
| edge | 3 | 3 | 0 | 100.0% |

### 3.2 Độ ổn định của bước sinh (LLM generate)

| Chỉ số sinh câu hỏi | Giá trị |
|---|---:|
| Ca có gọi LLM sinh | 18 |
| Qua validator ngay lần 1 | 18/18 (100.0%) |
| Phải dùng fallback sau 3 lần | 0/18 (0.0%) |
| Ca bị chặn bằng luật, không gọi LLM | 2 |

### 3.3 Chi tiết từng ca

| Ca | Lớp | Nguồn | Kết quả | Action | Độ khó | Concept | Lần sinh | Fallback | turn_id (tra trong llm_calls.log) |
|---|---|---|---|---|---|---|---:|---|---|
| G01 | 1_nguon_su_that | chatlog T02518 | ✅ Đạt | MISCONCEPTION_PROBE | E | temperature_sampling | 1 | không | `run-20260917T052125-G01` |
| G02 | 1_nguon_su_that | chatlog T10975 | ✅ Đạt | MISCONCEPTION_PROBE | E | hallucination | 1 | không | `run-20260917T052125-G02` |
| G03 | 2_mo_ho | chatlog T02916 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T052125-G03` |
| G04 | 2_mo_ho | chatlog T02914 | ✅ Đạt | ASK_CLARIFY | E | attention | 1 | không | `run-20260917T052125-G04` |
| G05 | 3_ngoai_pham_vi | chatlog T02919 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 1 | không | `run-20260917T052125-G05` |
| G06 | 3_ngoai_pham_vi | chatlog T02760 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 0 | không | `run-20260917T052125-G06` |
| G07 | 4_dac_thu_nghiep_vu | chatlog T10515 | ✅ Đạt | SOCRATIC_HINT | E | temperature_sampling | 1 | không | `run-20260917T052125-G07` |
| G08 | 4_dac_thu_nghiep_vu | tự xây | ✅ Đạt | MISCONCEPTION_PROBE | E | next_token_prediction | 1 | không | `run-20260917T052125-G08` |
| G09 | pho_bien | chatlog T10365 | ✅ Đạt | PREDICT_FIRST | E | next_token_prediction | 1 | không | `run-20260917T052125-G09` |
| G10 | pho_bien | chatlog T10367 | ❌ Trượt | MISCONCEPTION_PROBE | E | attention | 1 | không | `run-20260917T052125-G10` |
| G11 | pho_bien | chatlog T09449 | ✅ Đạt | PREDICT_FIRST | E | temperature_sampling | 1 | không | `run-20260917T052125-G11` |
| G12 | pho_bien | chatlog T04654 | ✅ Đạt | PREDICT_FIRST | E | rlhf | 1 | không | `run-20260917T052125-G12` |
| G13 | pho_bien | chatlog T10317 | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T052125-G13` |
| G14 | pho_bien | chatlog T13114 | ✅ Đạt | REINFORCE_EXPLAIN | M | context_window | 1 | không | `run-20260917T052125-G14` |
| G15 | pho_bien | tự xây | ✅ Đạt | REINFORCE_EXPLAIN | M | tokenization | 1 | không | `run-20260917T052125-G15` |
| G16 | pho_bien | tự xây | ✅ Đạt | CONTINUE | E | hallucination | 1 | không | `run-20260917T052125-G16` |
| G17 | pho_bien | tự xây | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T052125-G17` |
| G18 | edge | chatlog T02927 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T052125-G18` |
| G19 | edge | tự xây | ✅ Đạt | PREDICT_FIRST | E | context_window | 1 | không | `run-20260917T052125-G19` |
| G20 | edge | chatlog T04019 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | attention | 0 | không | `run-20260917T052125-G20` |

### 3.4 Ca thất bại

| Nhóm nguyên nhân | Số ca | Ca |
|---|---:|---|
| Quyết định sư phạm sai | 1 | G10 |

#### G10 — Hỏi Transformer (gõ sai) → concept attention

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=MISCONCEPTION_PROBE, mong đợi PREDICT_FIRST
- Validator từng lần sinh: #1 OK
- Phân tích lượt: scope=`in_lesson`, intent=`claim_check`, misconception=`openai_invented_transformer`
- Prompt + phản hồi thô: tìm `turn=run-20260917T052125-G10` trong `codebase/logs/llm_calls.log`
- Nhận định: xem **Phân tích nguyên nhân chi tiết — Lượt 3 - prompt tiếng Anh**.

### 3.5 Phân tích nguyên nhân chi tiết — Lượt 3 - prompt tiếng Anh

> Nguồn: `eval/analysis/run-20260917T052125.md`

#### Diễn biến qua các lượt

| Lượt | Thay đổi so với lượt trước | Đạt | Qua validator ngay lần 1 | Fallback |
|---|---|---:|---:|---:|
| 1 | — (bản đầu) | 10/20 | 11/18 | 2 |
| 2 | Prompt sinh liệt kê trường bắt buộc theo action và nói rõ `correct_option_index`/`rubric` là đáp án bí mật; lỗi validator chỉ đúng tên trường; `normalizeAnalysis()` sửa nhãn của analyzer bằng luật (xem phân tích Lượt 1, nguyên nhân A–D) | 19/20 | 18/18 | 0 |
| 3 | Chỉ dẫn trong prompt (system prompt, rules, schema, lỗi validator gửi lại) chuyển sang tiếng Anh; nội dung bài học và mọi chữ hiển thị cho học viên vẫn là tiếng Việt | 19/20 | 18/18 | 0 |

Chi phí token (cùng 20 ca, cùng 32 lời gọi, lấy từ `usage` trong `codebase/logs/llm_calls.jsonl`):

| Lượt | Prompt tokens | Completion tokens | Độ trễ TB/lời gọi |
|---|---:|---:|---:|
| 2 (chỉ dẫn tiếng Việt) | 43 999 | 4 753 | 1 862 ms |
| 3 (chỉ dẫn tiếng Anh) | 42 612 | 4 809 | 1 813 ms |

Chuyển chỉ dẫn sang tiếng Anh chỉ giảm **3,2%** prompt tokens. Phần lớn prompt là nội dung tiếng Việt bắt buộc phải giữ: danh mục 7 concept kèm ý chính và ngộ nhận (analyzer), và trích đoạn transcript (generator). Muốn giảm thêm thì phải rút gọn nội dung này, ví dụ chỉ đưa danh mục rút gọn (id + tiêu đề) vào analyzer.

#### Ca thất bại duy nhất: G10 "kiến trúc Tranformer là gfi"

- Lượt 2: analyzer trả `out_of_scope / chitchat` ("không liên quan đến nội dung bài học"). Từ khoá "transformer" không khớp vì học viên gõ "Tranformer", nên luật chuẩn hoá không can thiệp được → `REFUSE_OUT_OF_SCOPE`.
- Lượt 3: nhờ luật mới trong prompt ("typos or missing diacritics"), analyzer nhận đúng concept `attention`. Nhưng nó trả `claim_check` với `misconception_id=openai_invented_transformer`, lý do "learner incorrectly attributes the invention of the Transformer architecture to OpenAI", trong khi học viên **không hề nhắc tới OpenAI**. Đây là **ảo giác của mô hình phân tích**: nó chọn một ngộ nhận có sẵn trong danh mục chỉ vì câu hỏi nhắc tới Transformer. Kết quả là `MISCONCEPTION_PROBE` thay vì `PREDICT_FIRST`.
- Nguyên nhân gốc: analyzer được xem cả danh sách ngộ nhận nên có xu hướng "khớp" bằng mọi giá. Luật không kiểm tra được điều này, vì cần hiểu nội dung câu.
- Hướng sửa (chưa làm):
  1. Chỉ chấp nhận `false_premise`/`misconception_id` khi câu của học viên có dạng khẳng định. Câu hỏi "… là gì" thì bỏ qua các trường này.
  2. Khớp từ khoá mờ (edit distance ≤ 1) để "Tranformer" vẫn ra `attention`.
  3. Yêu cầu analyzer trích nguyên văn đoạn trong câu học viên chứa tiền đề sai. Nếu không trích được thì coi như không có tiền đề sai.

#### Rủi ro còn lại

- Validator vẫn chưa kiểm tra tính đúng của lời từ chối (xem phân tích Lượt 1). Từ Lượt 2, luật chuẩn hoá đã chặn trường hợp từ chối khi từ khoá khớp concept, nhưng validator chưa có kiểm tra riêng cho việc này.
- Luật chuẩn hoá phải viết lại nhãn của analyzer ở **7/14** lượt phân tích trong Lượt 2 (G01, G03, G04, G09, G11, G12, G14), nhưng **0/14** trong Lượt 3. Như vậy ở Lượt 3, chính prompt phân tích viết lại (luật rõ hơn: "no pending question ≠ out_of_scope", "ask_hint ONLY when a question is pending", xử lý lỗi gõ) đã giúp mô hình tự phân loại đúng. Luật chuẩn hoá giờ chỉ còn vai trò lưới an toàn. Số liệu được tính lại bằng cách áp `normalizeAnalysis()` lên phản hồi thô trong log.
- Bộ 20 ca đã được dùng để tìm lỗi và sửa hệ thống, nên tỷ lệ 95% có thể lạc quan hơn so với câu hỏi mới. Nên bổ sung ca kiểm thử mới chưa từng dùng để sửa trước khi chốt kết quả.

## Lượt 4 - chống lặp câu hỏi + streaming

`run-20260917T053033` · 2026-09-17T05:30:33.127Z · model `gpt-4o-mini` · endpoint `https://api.openai.com/v1`

**Đạt 19/20 = 95.0%** · Thất bại 1

### 4.1 Theo lớp chỗ khó / nhóm ca

| Lớp | Số ca | Đạt | Thất bại | Tỷ lệ |
|---|---:|---:|---:|---:|
| 1_nguon_su_that | 2 | 2 | 0 | 100.0% |
| 2_mo_ho | 2 | 2 | 0 | 100.0% |
| 3_ngoai_pham_vi | 2 | 2 | 0 | 100.0% |
| 4_dac_thu_nghiep_vu | 2 | 2 | 0 | 100.0% |
| pho_bien | 9 | 8 | 1 | 88.9% |
| edge | 3 | 3 | 0 | 100.0% |

### 4.2 Độ ổn định của bước sinh (LLM generate)

| Chỉ số sinh câu hỏi | Giá trị |
|---|---:|
| Ca có gọi LLM sinh | 18 |
| Qua validator ngay lần 1 | 18/18 (100.0%) |
| Phải dùng fallback sau 3 lần | 0/18 (0.0%) |
| Ca bị chặn bằng luật, không gọi LLM | 2 |

### 4.3 Chi tiết từng ca

| Ca | Lớp | Nguồn | Kết quả | Action | Độ khó | Concept | Lần sinh | Fallback | turn_id (tra trong llm_calls.log) |
|---|---|---|---|---|---|---|---:|---|---|
| G01 | 1_nguon_su_that | chatlog T02518 | ✅ Đạt | MISCONCEPTION_PROBE | E | temperature_sampling | 1 | không | `run-20260917T053033-G01` |
| G02 | 1_nguon_su_that | chatlog T10975 | ✅ Đạt | MISCONCEPTION_PROBE | E | hallucination | 1 | không | `run-20260917T053033-G02` |
| G03 | 2_mo_ho | chatlog T02916 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T053033-G03` |
| G04 | 2_mo_ho | chatlog T02914 | ✅ Đạt | ASK_CLARIFY | E | attention | 1 | không | `run-20260917T053033-G04` |
| G05 | 3_ngoai_pham_vi | chatlog T02919 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 1 | không | `run-20260917T053033-G05` |
| G06 | 3_ngoai_pham_vi | chatlog T02760 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | next_token_prediction | 0 | không | `run-20260917T053033-G06` |
| G07 | 4_dac_thu_nghiep_vu | chatlog T10515 | ✅ Đạt | SOCRATIC_HINT | E | temperature_sampling | 1 | không | `run-20260917T053033-G07` |
| G08 | 4_dac_thu_nghiep_vu | tự xây | ✅ Đạt | MISCONCEPTION_PROBE | E | next_token_prediction | 1 | không | `run-20260917T053033-G08` |
| G09 | pho_bien | chatlog T10365 | ✅ Đạt | PREDICT_FIRST | E | next_token_prediction | 1 | không | `run-20260917T053033-G09` |
| G10 | pho_bien | chatlog T10367 | ❌ Trượt | MISCONCEPTION_PROBE | E | attention | 1 | không | `run-20260917T053033-G10` |
| G11 | pho_bien | chatlog T09449 | ✅ Đạt | PREDICT_FIRST | E | temperature_sampling | 1 | không | `run-20260917T053033-G11` |
| G12 | pho_bien | chatlog T04654 | ✅ Đạt | PREDICT_FIRST | E | rlhf | 1 | không | `run-20260917T053033-G12` |
| G13 | pho_bien | chatlog T10317 | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T053033-G13` |
| G14 | pho_bien | chatlog T13114 | ✅ Đạt | REINFORCE_EXPLAIN | M | context_window | 1 | không | `run-20260917T053033-G14` |
| G15 | pho_bien | tự xây | ✅ Đạt | REINFORCE_EXPLAIN | M | tokenization | 1 | không | `run-20260917T053033-G15` |
| G16 | pho_bien | tự xây | ✅ Đạt | CONTINUE | E | hallucination | 1 | không | `run-20260917T053033-G16` |
| G17 | pho_bien | tự xây | ✅ Đạt | SOCRATIC_HINT | E | tokenization | 1 | không | `run-20260917T053033-G17` |
| G18 | edge | chatlog T02927 | ✅ Đạt | ASK_CLARIFY | E | tokenization | 1 | không | `run-20260917T053033-G18` |
| G19 | edge | tự xây | ✅ Đạt | PREDICT_FIRST | E | context_window | 1 | không | `run-20260917T053033-G19` |
| G20 | edge | chatlog T04019 | ✅ Đạt | REFUSE_OUT_OF_SCOPE | E | attention | 0 | không | `run-20260917T053033-G20` |

### 4.4 Ca thất bại

| Nhóm nguyên nhân | Số ca | Ca |
|---|---:|---|
| Quyết định sư phạm sai | 1 | G10 |

#### G10 — Hỏi Transformer (gõ sai) → concept attention

- Nhóm nguyên nhân: **Quyết định sư phạm sai**
- action=MISCONCEPTION_PROBE, mong đợi PREDICT_FIRST
- Validator từng lần sinh: #1 OK
- Phân tích lượt: scope=`in_lesson`, intent=`claim_check`, misconception=`openai_invented_transformer`
- Prompt + phản hồi thô: tìm `turn=run-20260917T053033-G10` trong `codebase/logs/llm_calls.log`
- Nhận định của nhóm: _(viết vào `eval/analysis/run-20260917T053033.md` rồi chạy `npm run eval -- --report-only`)_


