'use client';

import { AlertTriangle, CalendarClock, ClipboardCheck, ShoppingBag } from 'lucide-react';
import DashboardStats, { KpiCardItem } from '@/components/reports/DashboardStats';
import OrderStatusDonut from '@/components/dashboard/OrderStatusDonut';
import UpcomingEventsCard from '@/components/dashboard/UpcomingEventsCard';
import PendingConfirmationsCard from '@/components/dashboard/PendingConfirmationsCard';
import RecentOrdersCard from '@/components/dashboard/RecentOrdersCard';
import Reveal from '@/components/ui/Reveal';
import { getOrderStatusBreakdown, getRecentOrders, getUpcomingEvents } from '@/mocks/adminDashboard';
import { getManagerDashboardKpis, getPendingConfirmations } from '@/mocks/managerDashboard';

// Operational Dashboard của Manager — khác Administrative Dashboard của Admin (thiên về doanh
// thu/audit): tập trung trạng thái order/task/thanh toán/kho và hàng đợi chờ xác nhận (mục 1
// CLAUDE.md). Trang thuần giao diện — đơn hàng tính từ src/mocks/db/orders.ts thật, xem đầu
// managerDashboard.ts.
export default function ManagerDashboardPage() {
  const kpis = getManagerDashboardKpis();
  const orderStatusBreakdown = getOrderStatusBreakdown();
  const recentOrders = getRecentOrders();
  const upcomingEvents = getUpcomingEvents();
  const pendingConfirmations = getPendingConfirmations();
  const totalOrders = orderStatusBreakdown.reduce((sum, slice) => sum + slice.count, 0);

  const items: KpiCardItem[] = [
    {
      label: 'Đơn đang xử lý',
      value: kpis.activeOrders,
      icon: ShoppingBag,
      iconColor: 'blue',
      changeLabel: kpis.activeOrdersChange,
      changeDirection: 'up',
    },
    {
      label: 'Chờ xác nhận',
      value: kpis.pendingConfirmations,
      icon: ClipboardCheck,
      iconColor: 'amber',
      changeLabel: kpis.pendingConfirmationsChange,
      changeDirection: 'up',
    },
    {
      label: 'Việc cần làm hôm nay',
      value: kpis.tasksToday,
      icon: CalendarClock,
      iconColor: 'green',
      changeLabel: kpis.tasksTodayChange,
      changeDirection: 'up',
    },
    {
      label: 'Cảnh báo tồn kho',
      value: kpis.inventoryAlerts,
      icon: AlertTriangle,
      iconColor: 'red',
      changeLabel: kpis.inventoryAlertsChange,
      changeDirection: 'down',
    },
  ];

  return (
    <div className="p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái đơn hàng, công việc hiện trường và các mục chờ xác nhận.</p>
        <p className="mt-1 text-xs italic text-slate-400">Đang hiển thị dữ liệu minh họa (giao diện thuần, chưa nối API báo cáo thật).</p>
      </div>

      <div className="mt-6">
        <DashboardStats items={items} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Reveal className="lg:col-span-2">
          <PendingConfirmationsCard items={pendingConfirmations} />
        </Reveal>
        <Reveal delay={0.05}>
          <OrderStatusDonut data={orderStatusBreakdown} total={totalOrders} viewDetailHref="/manager/orders" />
        </Reveal>
        <Reveal delay={0.1}>
          <UpcomingEventsCard events={upcomingEvents} viewAllHref="/manager/orders" />
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <RecentOrdersCard orders={recentOrders} />
      </Reveal>
    </div>
  );
}
