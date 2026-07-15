// Danh sách "Loại sự kiện" — model Order.eventType là cột tự do (String?, không phải enum thật ở
// DB), nên đây chỉ là danh sách gợi ý cho Select trên UI, không phải enum bắt buộc từ backend.
export const EVENT_TYPES = ['Tiệc cưới', 'Sự kiện công ty', 'Sinh nhật', 'Khai trương', 'Hội nghị'];
