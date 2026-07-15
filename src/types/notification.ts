// ⚠️ Backend HIỆN LÀ STUB HOÀN TOÀN (D:\bnwems-backend-api operations liên quan): GET /notifications
// luôn trả rỗng, readNotification/readAllNotifications không thật sự cập nhật NotificationRecipient
// dù model đã có trong schema. Field bên dưới khai theo đúng schema Prisma (đúng cho tương lai khi
// backend implement thật) nhưng gọi API hiện tại sẽ không có tác dụng — xem docs/more-require.md.

export type NotificationType =
  | 'SYSTEM'
  | 'INVENTORY'
  | 'POLICY'
  | 'USER'
  | 'REPORT'
  | 'ORDER'
  | 'TASK'
  | 'SCHEDULE'
  | 'PAYMENT'
  | 'SURVEY'
  | 'WAGE'
  | 'SUPPLIER'
  | 'OTHER';

export interface Notification {
  notificationId: string;
  title: string;
  content?: string;
  notificationType: NotificationType;
  refType?: string;
  refId?: string;
  isRead?: boolean;
  createdAt: string;
}
