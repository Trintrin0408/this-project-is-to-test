'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SCHEDULE_STATUS_META } from './surveyPersonnel.constants';
import { formatDate, formatTime } from '@/utils/formatDate';
import type { SchedulePlan } from '@/types/schedulePlan';

interface ExecutionPersonnelCardProps {
  plans: SchedulePlan[];
  canManage: boolean;
  canAssign: boolean;
  isLoading: boolean;
  onAssign: () => void;
}

// Mỗi nhân sự thi công = 1 SchedulePlan riêng (không còn nhóm nhiều người trong 1 bản ghi).
export default function ExecutionPersonnelCard({ plans, canManage, canAssign, isLoading, onAssign }: Readonly<ExecutionPersonnelCardProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Phân công nhân sự thi công</h3>
        {canManage && canAssign && (
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Phân công
          </button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa phân công nhân sự thi công.</p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.planId} className="space-y-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(plan.startTime)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(plan.startTime)}
                    {plan.endTime ? ` - ${formatTime(plan.endTime)}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={plan.assigneeName ?? String(plan.assignedTo)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{plan.assigneeName ?? `NV #${plan.assignedTo}`}</p>
                      <p className="text-xs text-slate-400">{plan.taskName}</p>
                    </div>
                  </div>
                  <Badge variant={SCHEDULE_STATUS_META[plan.status].variant}>{SCHEDULE_STATUS_META[plan.status].label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
