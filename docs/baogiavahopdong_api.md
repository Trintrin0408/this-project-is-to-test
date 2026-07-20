# API cho tab "Báo giá & Hợp đồng" (trang chi tiết đơn đặt)

> Phạm vi tài liệu này: **chỉ** tab `quotation` ("Báo giá & Hợp đồng") của trang chi tiết 1 đơn đặt — khối
> "Hồ sơ báo giá & hợp đồng liên kết" (mã báo giá, phiên bản, badge "Đã duyệt", giá trị giao kèo, dòng
> "Hợp đồng liên kết", 3 nút "Xem báo giá"/"Xem hợp đồng" hoặc "Tạo hợp đồng"/"Hủy liên kết") và khối phụ
> "Liên kết báo giá đã duyệt" (dropdown + nút "Liên kết ngay", chỉ hiện khi đơn chưa có báo giá liên kết)
> — đúng như ảnh mẫu cung cấp. Trang dùng chung layout ở cả `/manager/orders/[id]` và
> `/admin/orders_audit/[id]` (mirror 1:1, chỉ khác tiền tố route — đã đối chiếu, JSX + toàn bộ
> state/handler của tab này giống hệt nhau giữa 2 file).
>
> **Không** bao gồm 5 tab còn lại của cùng trang (đã có tài liệu riêng: "Tổng quan sự kiện" ở
> [`docs/tongquansukien_api.md`](tongquansukien_api.md), "Tiến độ sự kiện" ở
> [`docs/tiendosukien_api.md`](tiendosukien_api.md), "Thiết bị & Kho hàng" ở
> [`docs/thietbikhohang_api.md`](thietbikhohang_api.md), "Lịch trình & Kỹ thuật" ở
> [`docs/lichtrinhkythuat_api.md`](lichtrinhkythuat_api.md)). Cũng **không** bao gồm trang chi tiết báo giá
> (`/manager/quotations/[id]`, đã có [`docs/xemchitietbaogia_api.md`](xemchitietbaogia_api.md)) hay màn
> danh sách "Hợp đồng" (`/admin/contracts`, đã có [`docs/danhsachhopdong_api.md`](danhsachhopdong_api.md))
> mà nút "Xem báo giá"/"Xem hợp đồng" điều hướng tới.
>
> **Phát hiện quan trọng nhất tài liệu này**: tab này đang dùng **nguyên mô hình "Hợp đồng" đã bị bác bỏ**
> — `docs/danhsachhopdong_api.md` mục 1 đã chốt **Hướng A** (bỏ hẳn entity "Hợp đồng" riêng, vì không có
> bảng `contracts` nào trong DB thật) và tại đúng phiên làm việc hôm nay, refactor theo Hướng A đó **đang
> được thực hiện dở dang** ở `src/app/admin/contracts/page.tsx`/`src/mocks/db/orders.ts` (đã xóa
> `src/components/contracts/ContractCreateModal.tsx`, thêm `src/components/orders/CreateOrderPickQuotationModal.tsx`
> — xem `git status`/`git diff` tại thời điểm viết tài liệu này). Tab "Báo giá & Hợp đồng" (đối tượng của
> tài liệu này) là **nơi duy nhất còn sót lại** vẫn gọi `getAdminContracts()` từ
> `src/mocks/adminContractsMock.ts` (module đã bị loại khỏi luồng chính ở `/admin/contracts` nhưng file vẫn
> còn tồn tại) — cần đồng bộ nốt theo cùng hướng đã chốt, xem mục 1 và 5.
>
> Nguồn tham chiếu:
> - FE: `src/app/manager/orders/[id]/page.tsx` (dòng 66-67 import `getAdminQuotationById`/
>   `getAdminContracts`, dòng 279 state `linkQuoteId`, dòng 365-370 `handleLinkQuotation`, dòng 414-418
>   `handleUnlinkQuotation`, dòng 438-440 `linkedQuotation`/`linkedContract`/`linkableQuotations`, dòng
>   1255-1371 JSX tab `quotation`), `src/app/admin/orders_audit/[id]/page.tsx` (bản mirror, cùng nội dung ở
>   dòng 294-301 và 1017-1093), `src/mocks/db/orders.ts` (`AdminOrderRow.quotationId` dòng 126,
>   `getLinkableQuotationsForOrder`/`linkQuotationToOrder`/`unlinkQuotationFromOrder` dòng 421-455),
>   `src/mocks/db/quotations.ts` (`AdminQuotationRow`, `getAdminQuotationById`), `src/mocks/adminContractsMock.ts`
>   (`AdminContract`, `getAdminContracts` — xem cảnh báo ở trên), `src/types/order.ts`, `src/types/quotation.ts`,
>   `src/services/order.service.ts`, `src/services/quotation.service.ts`.
> - DB thật: đối chiếu trực tiếp qua MySQL MCP ngày 2026-07-20 (cùng phiên với các tài liệu tab khác) —
>   `SHOW TABLES` (24 bảng, **không có bảng `contracts`** — xác nhận lại đúng phát hiện đã có ở
>   `docs/danhsachhopdong_api.md`), `SHOW CREATE TABLE orders`, `SHOW CREATE TABLE quotations`; dữ liệu mẫu
>   thật: 1 order (`order_code = "ORD-001"`, `quotation_id` trỏ đúng) ↔ 1 quotation (`quotation_code =
>   "QUO-001"`, `version = "v1"`, `status = "APPROVED"`, `total_amount = 1,600,000` — **khớp chính xác**
>   `orders.total_amount` của đơn đó, xem mục 3 về ý nghĩa 2 field này có thật sự luôn bằng nhau không).
> - `docs/api/` **không tồn tại trong repo hiện tại** — dùng comment đầu `src/types/order.ts`/`quotation.ts`
>   (đối chiếu trực tiếp `prisma/schema.prisma`/`*.route.ts`/`*.service.ts` của backend ngày 2026-07-06) làm
>   căn cứ chính, giống các tài liệu trước.

## 0. Base URL & Auth

- Base path: `/api/v1`, JWT Bearer theo `AuthContext` hiện có.
- Theo CLAUDE.md mục 1, đây là dữ liệu Manager tạo/quản lý (liên kết báo giá vào đơn là 1 bước trong vòng
  đời Order do Manager vận hành) — bản Admin (`/admin/orders_audit/[id]`) nên là **read-only** cho tab này
  (chỉ hiện nút "Xem báo giá", ẩn hẳn "Hủy liên kết"/khối "Liên kết báo giá đã duyệt"), giống khuyến nghị đã
  lặp lại ở các tài liệu tab khác của cùng trang.

## 1. "Hợp đồng" — bỏ hẳn; "Liên kết/Hủy liên kết" — chưa có API thật, tạm giữ trong lúc chờ Product/Backend chốt

### 1.1. "Hợp đồng liên kết" — đã bác bỏ ở `docs/danhsachhopdong_api.md`, không lặp lại phân tích

Dòng "Hợp đồng liên kết: `HD2507-001`" + nút "Xem hợp đồng"/"Tạo hợp đồng" (trỏ `/admin/contracts/:id`)
dùng `getAdminContracts().find((c) => c.quotationId === row.quotationId)` — **chính là** vấn đề đã phân
tích đầy đủ ở `docs/danhsachhopdong_api.md` mục 1: không có bảng `contracts` thật, dữ liệu "Hợp đồng" chỉ
là 1 mock store độc lập (`adminContractsMock.ts`) tự sinh lại thông tin đã có ở Quotation/Order, và **xung
đột trực tiếp** với luồng Order thật (`orders.quotation_id` đã là đúng cơ chế "báo giá đã duyệt → hồ sơ vận
hành chính thức"). Theo Hướng A đã chọn (khuyến nghị mạnh, đang được thực thi ở `/admin/contracts`): áp
dụng y hệt ở đây — **xóa hẳn** dòng "Hợp đồng liên kết" và 2 nút "Xem hợp đồng"/"Tạo hợp đồng" khỏi tab
này, vì khi `order.quotationId` đã khác `null`, bản thân **đơn đang xem chính là "hợp đồng"** — không có gì
khác để "xem" hay "tạo" thêm.

### 1.2. "Liên kết"/"Hủy liên kết" — ghi vào 1 field chỉ set được 1 lần lúc tạo đơn, **chưa chốt giữ hay bỏ**

Đối chiếu `src/types/order.ts` và `src/services/order.service.ts` (đã tài liệu hóa đầy đủ ở
`docs/danhsachhopdong_api.md` mục 3.2, nhắc lại ở đây vì trực tiếp ảnh hưởng tab này):

- `quotationId` **chỉ xuất hiện ở `CreateOrderPayload`** (`POST /api/v1/orders`, field optional) — set 1
  lần duy nhất lúc tạo đơn.
- `orderApiService` chỉ có đúng **5 method**: `getOrders`, `getOrder`, `createOrder`, `updateOrderStatus`
  (`PUT /orders/:id/status`), `updateOrderItems` (`PUT /orders/:id/items`). **Không có** `PUT`/`PATCH
  /orders/:id` (update chung) hay bất kỳ endpoint nào cho phép sửa `quotation_id` của 1 đơn **đã tồn tại**.
- Cột `orders.quotation_id` (`SHOW CREATE TABLE orders` xác nhận) là FK nullable, `ON DELETE SET NULL`
  — nghĩa là hệ thống chỉ tự **gỡ** liên kết khi quotation bị xóa (hành động của Backend/DB), chưa có sẵn cơ
  chế để **client** tự ý gỡ/đổi liên kết qua API.

**Kết luận (2026-07-20, đã trao đổi với Product): CHƯA chốt bỏ tính năng này** — `handleLinkQuotation`/
`linkQuotationToOrder` (gán `quotationId` cho 1 đơn đã tồn tại, `orders.ts` dòng 426-447) và
`handleUnlinkQuotation`/`unlinkQuotationFromOrder` (gán lại `undefined`, dòng 450-451) hiện **không có API
thật tương ứng** (mục kỹ thuật ở trên vẫn đúng), nhưng nhu cầu nghiệp vụ (Manager chọn nhầm báo giá lúc tạo
đơn, cần sửa lại mà không muốn hủy hẳn đơn) **có thể là nhu cầu thật** — Product chưa xác nhận dứt khoát có
bỏ hẳn hay không. Vì vậy tài liệu này **giữ nguyên** 2 nút "Hủy liên kết" và khối "Liên kết báo giá đã
duyệt" trong khuyến nghị UI (mục 3-4), chỉ đánh dấu là **đang chờ 1 endpoint mới từ Backend** thay vì xóa
hẳn khỏi giao diện — xem đề xuất shape endpoint ở mục 2 và câu hỏi mở ở mục 5.

## 2. Endpoint thật cần cho tab này — 2 endpoint đã có sẵn, 1 endpoint đề xuất mới (chưa chốt)

| # | Endpoint | Dùng cho | Ghi chú |
|---|---|---|---|
| 1 | `GET /api/v1/orders/:orderId` | Lấy `quotationId` của đơn (để biết đơn có báo giá liên kết hay không) | **Đã có sẵn** (`orderApiService.getOrder`) — tab "Tổng quan sự kiện" đã gọi endpoint này khi mở trang (`docs/tongquansukien_api.md` mục 2), tái dùng lại response đã fetch, **không gọi lại riêng** cho tab này. |
| 2 | `GET /api/v1/quotations/:quotationId` | Toàn bộ nội dung card khi `order.quotationId` khác `null` (mã, phiên bản, tổng tiền, trạng thái) | **Đã có sẵn** (`quotationApiService.getQuotation`), dùng `quotationId` lấy từ bước 1. |
| 3 | `PATCH /api/v1/orders/:orderId/quotation` `{ "quotationId": string \| null }` | Nút "Hủy liên kết" (gửi `null`) và khối "Liên kết báo giá đã duyệt" (gửi `quotationId` đã chọn) | **Đề xuất mới, CHƯA CHỐT** — hiện **chưa có** trong `order.service.ts`. Chỉ là gợi ý shape ban đầu (đặt tên/method minh họa theo đúng convention các endpoint khác của Order), cần Backend/Product xác nhận trước khi implement — xem mục 1.2 và câu hỏi mở ở mục 5.2. Ràng buộc tối thiểu nếu triển khai: chỉ nhận `quotationId` của báo giá `status = APPROVED` và chưa được đơn nào khác trỏ tới (cùng điều kiện lọc `getLinkableQuotationsForOrder` phía FE hiện đang tự làm). |

Endpoint #3 là suy đoán minh họa, không phải đặc tả đã chốt — Backend có thể chọn shape khác (vd gộp vào
`PUT /orders/:id` update chung thay vì 1 sub-resource riêng); phần này cần chốt lại cùng Product trước khi
code. Không cần endpoint `GET /api/v1/orders?quotationId=` (lọc báo giá "chưa liên kết" — dùng
`getLinkableQuotationsForOrder` hiện có phía FE, xem mục 4) hay bất kỳ endpoint "hợp đồng" nào khác.

## 3. Ánh xạ field hiển thị (đã bỏ phần "Hợp đồng liên kết" theo mục 1.1, tạm giữ phần "Liên kết/Hủy liên kết" theo mục 1.2)

| Trường UI | Nguồn mock hiện tại | Nguồn thật | Ghi chú |
|---|---|---|---|
| Mã báo giá (`BG001`) | `linkedQuotation.code` | `quotation.quotationCode` | Đổi định dạng hiển thị — dữ liệu mẫu thật là `"QUO-001"`, không phải prefix `BG` (cùng vấn đề định dạng mã đã nêu ở `docs/danhsachbaogia_api.md`). |
| Phiên bản (`v{version}`) | `linkedQuotation.version` (kiểu `number`, mock sinh `1 + index % 3`) | `quotation.version` (kiểu **chuỗi tự do**, `varchar(30)`, mẫu thật `"v1"`) | **Không tự thêm tiền tố `v` phía trước** như UI hiện tại (`Phiên bản v{version}` sẽ ra `"Phiên bản vv1"` nếu backend đã trả sẵn `"v1"`) — hiển thị thẳng `quotation.version`, chỉ thêm nhãn "Phiên bản " phía trước. |
| Badge "Đã duyệt" | Hardcode cứng `<Badge variant="success">Đã duyệt</Badge>`, không đọc field nào | `quotation.status` (`DRAFT`/`APPROVED`/`REJECTED`) | Đổi thành đọc động theo `status` thay vì hardcode — dù theo nghiệp vụ tạo Order (`docs/danhsachhopdong_api.md` mục 3.2) đơn chỉ nên được tạo từ báo giá `APPROVED`, đây là **ràng buộc nghiệp vụ ở tầng tạo đơn**, không phải ràng buộc cứng ở DB (không có `CHECK` constraint nào ép `quotations.status` phải giữ `APPROVED` mãi mãi sau khi đơn đã trỏ tới nó) — an toàn hơn nếu badge tự đọc `status` thật thay vì giả định luôn là "Đã duyệt". |
| "Giá trị giao kèo" | `linkedQuotation.totalAmount` | `quotation.totalAmount` — **đã chốt** | Xem giải thích ngay dưới bảng. |
| "Hợp đồng liên kết: `HD2507-001`" + nút "Xem hợp đồng"/"Tạo hợp đồng" | `getAdminContracts().find(...)` | **Xóa khỏi UI** | Theo mục 1.1 — không có entity "Hợp đồng" tách biệt. |
| Nút "Xem báo giá" | `Link href="/manager/quotations/{quotationId}"` | Giữ nguyên | Trang đích đã có tài liệu ở `docs/xemchitietbaogia_api.md`, không đổi gì ở đây. |
| Nút "Hủy liên kết" | `handleUnlinkQuotation` → `unlinkQuotationFromOrder` | **Giữ nguyên tạm thời, CHƯA CHỐT xóa hay giữ** | Theo mục 1.2 — chưa có API ghi tương ứng, nhưng Product chưa xác nhận bỏ hẳn tính năng. Gọi endpoint đề xuất #3 ở mục 2 khi Backend xác nhận; cho tới lúc đó vẫn dùng hành vi mock hiện có (đánh dấu rõ đây là dữ liệu/hành động tạm, chưa nối API thật). |
| Khối "Liên kết báo giá đã duyệt" (khi `!linkedQuotation`) | `linkableQuotations` + `handleLinkQuotation` | **Giữ nguyên tạm thời, CHƯA CHỐT xóa hay giữ** | Cùng lý do với "Hủy liên kết" — dùng lại endpoint đề xuất #3 ở mục 2 khi có; `linkableQuotations`/`getLinkableQuotationsForOrder` phía FE vẫn giữ nguyên logic lọc hiện có (báo giá `APPROVED` và chưa gắn đơn nào khác). |

**"Giá trị giao kèo" — đã chốt cùng Product (2026-07-20): dùng `quotation.totalAmount`** (giá trị chốt tại
thời điểm duyệt báo giá), **không** dùng `order.totalAmount`. Lý do cần ghi rõ vì đây là 2 cột độc lập hoàn
toàn trong schema thật (không có generated/computed column nào đồng bộ 2 bên) — comment tại `types/order.ts`
dòng 80-81 ghi rõ "Không tự copy items từ Quotation... phải nhập lại thủ công dù đã chọn quotationId", và
CLAUDE.md mục 1 (quy tắc "Thêm/bớt/Thay thiết bị tại hiện trường") mô tả `orders.total_amount` có thể **thay
đổi sau khi đơn đã tạo** (qua Change Request), trong khi `quotations.total_amount` giữ nguyên giá trị đã
chốt lúc duyệt — đúng ý nghĩa "giao kèo ban đầu" mà nhãn UI đang thể hiện. Dữ liệu mẫu thật hiện 2 giá
trị này trùng khớp (`1,600,000` cả 2 bên) chỉ vì đơn `ORD-001` chưa qua Change Request nào — không ảnh hưởng
tới quyết định đã chốt ở trên, chỉ là trùng hợp của dữ liệu mẫu hiện tại.

## 4. Tổng hợp việc cần sửa ở FE khi nối API thật

1. Bỏ import `getAdminContracts` (`@/mocks/adminContractsMock`) khỏi cả 2 file trang chi tiết đơn — đồng bộ
   nốt theo Hướng A đang thực thi dở dang ở `/admin/contracts` (mục đầu tài liệu này). Sau khi tab này
   không còn dùng, rà soát lại xem `src/mocks/adminContractsMock.ts`/`src/app/admin/contracts/[id]` (trang
   chi tiết hợp đồng, nếu còn tồn tại) có còn nơi nào tham chiếu không — nếu không, xóa hẳn file mock đó.
2. Xóa `linkedContract`, dòng "Hợp đồng liên kết", nút "Xem hợp đồng"/"Tạo hợp đồng" (mục 1.1, 3) — phần
   này **đã chốt** bỏ hẳn (Hướng A).
3. **Giữ nguyên** `linkQuoteId`, `linkableQuotations`/`getLinkableQuotationsForOrder`, nút "Hủy liên kết",
   và khối "Liên kết báo giá đã duyệt" — **chưa chốt** xóa hay giữ (mục 1.2, 3, 5.2). Khi Backend xác nhận
   endpoint đề xuất #3 (mục 2), đổi `handleLinkQuotation`/`handleUnlinkQuotation` từ gọi thẳng
   `linkQuotationToOrder`/`unlinkQuotationFromOrder` (mock) sang gọi `PATCH /orders/:id/quotation` thật;
   nếu Product xác nhận bỏ hẳn tính năng, quay lại xóa theo đúng hướng đã nêu ở bản nháp trước của tài liệu
   này (xóa `linkQuoteId`/`handleLinkQuotation`/`handleUnlinkQuotation`/nút "Hủy liên kết"/khối "Liên kết
   báo giá đã duyệt", và ở `src/mocks/db/orders.ts` xóa `linkQuotationToOrder`/`unlinkQuotationFromOrder`
   dòng 426-451 nhưng **giữ lại** `getLinkableQuotationsForOrder` vì `CreateOrderPickQuotationModal.tsx`
   vẫn cần hàm này cho luồng tạo đơn mới từ `/admin/contracts`).
4. Card báo giá: khi `order.quotationId` khác `null` → gọi `GET /api/v1/quotations/:quotationId` hiển thị
   mã/phiên bản/"Giá trị giao kèo" (= `quotation.totalAmount`, đã chốt mục 3)/badge trạng thái động; khi
   `null` → hiện khối rỗng + khối "Liên kết báo giá đã duyệt" như mục 3 (thay vì xóa hẳn, theo mục 1.2).
5. Gọi API qua đúng lớp `services/*.service.ts` đã có (`orderApiService.getOrder`,
   `quotationApiService.getQuotation`) theo CLAUDE.md mục 4, không tạo lời gọi `axios`/`fetch` mới trong
   component. Khi endpoint #3 (mục 2) được Backend xác nhận, bổ sung method mới vào `orderApiService`
   (vd `updateOrderQuotation`) thay vì gọi `axios`/`fetch` trực tiếp trong component.

## 5. Đã chốt / còn cần Product & Backend xác nhận

### 5.1. Đã chốt (2026-07-20)

**"Giá trị giao kèo" đọc `quotation.totalAmount`** (giá trị chốt tại thời điểm duyệt báo giá), **không**
dùng `order.totalAmount` (giá trị sống, có thể đổi theo Change Request) — xem giải thích đầy đủ ở mục 3.
Backend/FE có thể code thẳng theo quyết định này, không cần chờ xác nhận thêm cho riêng field này.

### 5.2. Còn cần Backend xác nhận — CHƯA CHỐT

**Có giữ khả năng "hủy liên kết"/"liên kết" báo giá của 1 đơn đã tạo hay không?** (vd Manager chọn nhầm báo
giá lúc tạo đơn, cần sửa lại mà không muốn hủy hẳn đơn) — đây vẫn là câu hỏi nghiệp vụ **mở**, chưa có
quyết định cuối cùng từ Product. Tài liệu này **tạm giữ nguyên** 2 hành động này trong khuyến nghị UI (mục
1.2, 3, 4) thay vì xóa, và đề xuất sẵn 1 shape endpoint minh họa
(`PATCH /api/v1/orders/:orderId/quotation`, mục 2) để Backend tham khảo — nhưng **chưa phải đặc tả cuối
cùng**, cần Product/Backend chốt chính thức (bao gồm cả việc có nên đi hướng khác, vd ghi log lịch sử đổi
`quotation_id` để phục vụ audit, thay vì cho phép ghi đè trực tiếp) trước khi implement.
