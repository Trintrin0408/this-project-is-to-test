'use client';

import { motion } from 'framer-motion';
import { Activity as ActivityIcon, Calendar, Edit, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatDate';
import { SchedulePlan, TASK_STATUS_META, getPlanStatusInfo } from '@/mocks/db/schedulePlans';

interface PlanDetailDrawerProps {
  plan: SchedulePlan;
  onClose: () => void;
  onEdit: (plan: SchedulePlan) => void;
}

export default function PlanDetailDrawer({ plan, onClose, onEdit }: Readonly<PlanDetailDrawerProps>) {
  const statusInfo = getPlanStatusInfo(plan);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col justify-between border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chi tiết kế hoạch vận hành</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.badgeClass}`}>{statusInfo.label}</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900">{plan.id}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-200/50 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-3 rounded-xl border border-slate-150 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">{plan.orderId}</span>
              <span className="text-[11px] font-medium text-slate-500">Người lập: {plan.manager}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{plan.eventName}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatDate(plan.eventDate)}
              </p>
              <p className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-slate-400" />
                {plan.location}
              </p>
            </div>
            {plan.notes && <p className="rounded-lg bg-white p-2.5 text-xs italic text-slate-500">{plan.notes}</p>}
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">Các hoạt động chính</h4>
            <div className="space-y-2">
              {plan.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 rounded-xl border border-slate-150 bg-white p-3">
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-600">
                    <ActivityIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{act.type}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {act.startTime} - {act.endTime}
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-500">{act.notes}</p>
                    <p className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {act.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
              Danh sách công việc & phân công ({plan.tasks.length})
            </h4>
            {plan.tasks.length > 0 ? (
              <div className="space-y-3">
                {plan.tasks.map((task) => (
                  <div key={task.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="line-clamp-1 text-xs font-bold text-slate-800">{task.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TASK_STATUS_META[task.status].badgeClass}`}>
                        {TASK_STATUS_META[task.status].label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{task.requirements}</p>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      <span>
                        Phụ trách: <strong className="text-slate-800">{task.assignee}</strong>
                      </span>
                      <span>
                        Đồng hành: <strong className="text-slate-800">{task.team.join(', ') || 'Không có'}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center italic text-slate-400">
                Chưa có công việc nào được phân công trong kế hoạch này.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="border-l-2 border-blue-500 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
              Nhân sự tham gia ({plan.staffList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {plan.staffList.map((s) => (
                <span key={s.name} className="rounded-lg border border-slate-150 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  {s.name} <span className="font-normal text-slate-400">— {s.role}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-150 bg-slate-50 p-5">
          <Button variant="secondary" onClick={onClose}>
            Đóng lại
          </Button>
          <Button
            onClick={() => {
              onEdit(plan);
              onClose();
            }}
          >
            <Edit className="h-3.5 w-3.5" />
            Chỉnh sửa kế hoạch
          </Button>
        </div>
      </motion.div>
    </>
  );
}
