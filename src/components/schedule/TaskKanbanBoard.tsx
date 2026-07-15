'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Ban } from 'lucide-react';
import { schedulePlanApiService } from '@/services/schedulePlan.service';
import { Badge } from '@/components/ui/Badge';
import { SCHEDULE_STATUS_LABEL } from '@/constants/work-task';
import { formatDate, formatTime } from '@/utils/formatDate';
import type { SchedulePlan, ScheduleStatus } from '@/types/schedulePlan';
import type { Order } from '@/types/order';
import type { Customer } from '@/types/customer';

const STATUS_COLUMNS: ScheduleStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

const NEXT_STATUS: Record<ScheduleStatus, ScheduleStatus | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

export interface TaskKanbanBoardProps {
  plans: SchedulePlan[];
  orderById: Map<string, Order>;
  customerById: Map<string, Customer>;
  onRefresh: () => void | Promise<void>;
}

// Kanban theo SchedulePlan.status thật — thay thế WorkTask.status cũ (không còn tồn tại theo
// instance). Không có endpoint xóa SchedulePlan, chỉ có đổi trạng thái (kể cả "hủy").
export default function TaskKanbanBoard({ plans, orderById, customerById, onRefresh }: Readonly<TaskKanbanBoardProps>) {
  const [movingId, setMovingId] = useState<string | null>(null);

  const columns: Record<ScheduleStatus, SchedulePlan[]> = {
    PENDING: [],
    CONFIRMED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  };
  for (const plan of plans) {
    (columns[plan.status] ?? columns.PENDING).push(plan);
  }

  const handleAdvance = async (plan: SchedulePlan) => {
    const next = NEXT_STATUS[plan.status];
    if (!next) return;
    setMovingId(plan.planId);
    try {
      await schedulePlanApiService.updateSchedulePlanStatus(plan.planId, { status: next });
      await onRefresh();
    } finally {
      setMovingId(null);
    }
  };

  const handleCancel = async (plan: SchedulePlan) => {
    if (!confirm(`Hủy kế hoạch "${plan.taskName ?? plan.planCode}"?`)) return;
    setMovingId(plan.planId);
    try {
      await schedulePlanApiService.updateSchedulePlanStatus(plan.planId, { status: 'CANCELLED' });
      await onRefresh();
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {STATUS_COLUMNS.map((status, colIdx) => (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: colIdx * 0.05 }}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{SCHEDULE_STATUS_LABEL[status]}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-xs">{columns[status].length}</span>
          </div>

          <div className="space-y-3">
            {columns[status].length === 0 && <p className="px-1 text-xs text-slate-400">Không có công việc nào.</p>}
            {columns[status].map((plan) => {
              const order = orderById.get(plan.orderId);
              const customer = order ? customerById.get(order.customerId) : undefined;
              const next = NEXT_STATUS[plan.status];
              const isBusy = movingId === plan.planId;
              return (
                <div key={plan.planId} className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-slate-800">{plan.taskName ?? `Task #${plan.taskId}`}</p>
                    <Badge variant="neutral">{formatDate(plan.startTime)}</Badge>
                  </div>
                  <Link href={`/manager/orders/${plan.orderId}`} className="mt-1.5 block truncate text-xs font-medium text-blue-600 hover:underline">
                    #{order?.orderCode ?? plan.orderId} — {customer?.customerName ?? `KH #${order?.customerId ?? '—'}`}
                  </Link>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {plan.assigneeName ?? `NV #${plan.assignedTo}`} · {formatTime(plan.startTime)}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5">
                    {next && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAdvance(plan)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Chuyển sang &quot;{SCHEDULE_STATUS_LABEL[next]}&quot;
                      </button>
                    )}
                    {plan.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancel(plan)}
                        aria-label="Hủy kế hoạch"
                        title="Hủy kế hoạch"
                        className="ml-auto rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
