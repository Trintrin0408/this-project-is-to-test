'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SCHEDULE_STATUS_META } from './surveyPersonnel.constants';
import { formatDate, formatTime } from '@/utils/formatDate';
import type { SchedulePlan } from '@/types/schedulePlan';

interface SurveyAssignmentCardProps {
  plan: SchedulePlan | null;
  canManage: boolean;
  isLoading: boolean;
  onReassign: () => void;
}

// 1 SchedulePlan = 1 người được giao khảo sát — khái niệm "nhóm nhiều người" (AssignmentGroup cũ)
// không còn tồn tại. "Đổi người" tạo 1 SchedulePlan mới (không có endpoint sửa assignedTo).
export default function SurveyAssignmentCard({ plan, canManage, isLoading, onReassign }: Readonly<SurveyAssignmentCardProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Phân công khảo sát</h3>
        {canManage && (
          <button
            type="button"
            onClick={onReassign}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {plan ? 'Đổi người' : 'Phân công'}
          </button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : !plan ? (
          <p className="text-sm text-slate-500">Chưa phân công khảo sát.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
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
                <p className="text-sm font-medium text-slate-800">{plan.assigneeName ?? `NV #${plan.assignedTo}`}</p>
              </div>
              <Badge variant={SCHEDULE_STATUS_META[plan.status].variant}>{SCHEDULE_STATUS_META[plan.status].label}</Badge>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
