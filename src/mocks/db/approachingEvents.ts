import { getAdminOrders, getAdminOrderById } from './orders';
import { getAdminSchedulePlans, type ActivityType } from './schedulePlans';
import { REFERENCE_TODAY } from './utils';
import { daysUntil } from '@/utils/eventDate';

// Nguồn cảnh báo "sắp diễn ra" DUY NHẤT cho toàn bộ UI (chuông thông báo Header, banner trang Kế
// hoạch, badge trang chi tiết đơn) — gộp cả mốc "ngày tổ chức sự kiện" (Order.weddingDate) LẪN các
// mốc hiện trường của kế hoạch liên quan (Khảo sát/Lắp đặt/Thu hồi, SchedulePlan.activities). Đặt ở
// đây (không phải orders.ts hay schedulePlans.ts) vì cần đọc CẢ 2 domain — orders.ts không được phép
// import ngược từ schedulePlans.ts (schedulePlans.ts đã import orders.ts, đảo chiều sẽ tạo vòng lặp
// module, xem cảnh báo ở đầu orders.ts).

export type ApproachingEventLabel = 'Tổ chức sự kiện' | ActivityType;

export interface ApproachingEvent {
  orderId: string;
  customerName: string;
  venue: string;
  label: ApproachingEventLabel;
  date: string;
  daysLeft: number;
}

/** Đơn "đã kết thúc vòng đời" (Hủy/Hoàn thành) không cần cảnh báo dù ngày còn gần — mọi trạng thái
 * khác (Mới/Đã xác nhận/Đang thực hiện) đều tính, kể cả đơn chưa chốt vì càng cần gấp rút xử lý. */
function isOrderActive(status: string): boolean {
  return status !== 'CANCELLED' && status !== 'COMPLETED';
}

/** Toàn bộ mốc thời gian (ngày tổ chức + hoạt động hiện trường của kế hoạch liên quan) còn
 * ≤withinDays ngày, gần nhất trước. 1 đơn có thể xuất hiện nhiều dòng nếu có nhiều mốc gần nhau
 * (vd vừa sắp Lắp đặt vừa sắp tới ngày tổ chức). */
export function getApproachingEvents(withinDays = 7): ApproachingEvent[] {
  const events: ApproachingEvent[] = [];

  for (const order of getAdminOrders()) {
    if (!isOrderActive(order.status)) continue;
    const daysLeft = daysUntil(order.weddingDate, REFERENCE_TODAY);
    if (daysLeft >= 0 && daysLeft <= withinDays) {
      events.push({
        orderId: order.orderId,
        customerName: order.customerName,
        venue: order.venue,
        label: 'Tổ chức sự kiện',
        date: order.weddingDate,
        daysLeft,
      });
    }
  }

  for (const plan of getAdminSchedulePlans()) {
    const order = getAdminOrderById(plan.orderId);
    if (order && !isOrderActive(order.status)) continue;
    for (const activity of plan.activities) {
      const daysLeft = daysUntil(activity.date, REFERENCE_TODAY);
      if (daysLeft >= 0 && daysLeft <= withinDays) {
        events.push({
          orderId: plan.orderId,
          customerName: plan.customerName,
          venue: plan.location,
          label: activity.type,
          date: activity.date,
          daysLeft,
        });
      }
    }
  }

  return events.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Mốc thời gian sắp diễn ra của riêng 1 đơn — dùng cho badge "Còn N ngày" ở trang chi tiết đơn. */
export function getApproachingEventsForOrder(orderId: string, withinDays = 7): ApproachingEvent[] {
  return getApproachingEvents(withinDays).filter((event) => event.orderId === orderId);
}
