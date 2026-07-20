# Yêu cầu bổ sung cho Backend

Danh sách các chỗ dữ liệu/endpoint backend hiện chưa đáp ứng đủ nhu cầu UI, phát hiện trong quá trình dựng
giao diện — nối tiếp theo thứ tự (a), (b), (c)... Mỗi mục ghi rõ màn hình liên quan, vấn đề, và đề xuất xử
lý (nếu có).

## (a) Lập lịch khảo sát hiện trường khi báo giá chưa có Order thật

- **Màn liên quan**: "Kế hoạch và phân công" (`/manager/schedule/plans`, mirror
  `/admin/coordination/planning`) — luồng lập kế hoạch khảo sát sớm mở từ trang chi tiết báo giá
  (`?quotationId=...`), xem chi tiết ở [`docs/kehoachvaphancong_api.md`](kehoachvaphancong_api.md) mục 8.1
  và mục 12.
- **Vấn đề**: `schedule_plans.order_id` là FK `NOT NULL` trỏ thẳng `orders.order_id`, không có cột nào
  tham chiếu tới `quotations.quotation_id`. Trong khi đó vòng đời nghiệp vụ là **Request → Survey →
  Quotation → mới có Order** (CLAUDE.md mục 1) — tại thời điểm cần lên lịch khảo sát hiện trường, báo giá
  còn đang ở trạng thái `DRAFT`/chưa duyệt và **chưa có `order_id` thật**, nên không thể tạo được dòng
  `schedule_plans` nào cho buổi khảo sát đó với schema hiện tại.
- **Đã chốt hướng (A) — đổi schema** (2026-07-20, xem lựa chọn ở
  `docs/kehoachvaphancong_api.md` mục 8.1): thêm cột `schedule_plans.quotation_id` (nullable, FK →
  `quotations.quotation_id`), đồng thời nới `schedule_plans.order_id` thành nullable, ràng buộc **đúng 1
  trong 2 cột (`order_id` hoặc `quotation_id`) có giá trị** ở tầng ứng dụng (CHECK constraint hoặc validate
  ở service layer, vì MySQL không hỗ trợ tốt CHECK phức tạp trên nhiều cột NULL/NOT NULL).
  - Không chọn hướng (B) — tạo `orders` sớm hơn (trước khi có Quotation duyệt) — vì sẽ đảo ngược thứ tự
    Request→Survey→Quotation→Order hiện mô tả ở CLAUDE.md mục 1, ảnh hưởng toàn bộ state machine
    `OrderStatus` (vốn đã có nhiều bất đồng bộ khác cần dọn trước, xem `docs/danhsachdondat_api.md`).
- **Cần Backend làm thêm sau khi đổi schema**:
  1. `POST /api/v1/schedule-plans` nhận `orderId` **hoặc** `quotationId` (hiện chỉ có `orderId` bắt buộc
     trong `CreateSchedulePlanPayload`).
  2. `GET /api/v1/schedule-plans` trả kèm `quotationId` (khi dòng đó chưa gắn Order thật) bên cạnh
     `orderId` hiện có.
  3. Khi báo giá được duyệt và sinh Order thật, cần 1 bước gán lại `order_id` cho các dòng
     `schedule_plans` đã tạo trước đó bằng `quotation_id` (không rõ có endpoint nào xử lý việc "chuyển"
     này chưa — cần Backend xác nhận).
- **Trạng thái**: FE **chưa code** luồng này (kể cả bằng mock) cho tới khi Backend xác nhận đã đổi schema
  xong, tránh phải sửa lại 2 lần khi model đổi.
