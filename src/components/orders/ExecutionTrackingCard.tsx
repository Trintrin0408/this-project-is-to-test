import AnalyticsCard from '@/components/dashboard/AnalyticsCard';
import { Badge } from '@/components/ui/Badge';
import { SCHEDULE_STATUS_META, taskNameIcon } from './surveyPersonnel.constants';
import type { SchedulePlan } from '@/types/schedulePlan';

interface ExecutionTrackingCardProps {
  plans: SchedulePlan[];
  isLoading: boolean;
}

function PlanList({ plans }: Readonly<{ plans: SchedulePlan[] }>) {
  if (plans.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có công việc thi công nào cho đơn hàng này.</p>;
  }
  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const Icon = taskNameIcon(plan.taskName ?? '');
        const status = SCHEDULE_STATUS_META[plan.status] ?? { label: plan.status, variant: 'neutral' as const };
        return (
          <div key={plan.planId} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">{plan.taskName ?? `Task #${plan.taskId}`}</p>
                {plan.assigneeName && <p className="text-xs text-slate-400">{plan.assigneeName}</p>}
              </div>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        );
      })}
    </div>
  );
}

export default function ExecutionTrackingCard({ plans, isLoading }: Readonly<ExecutionTrackingCardProps>) {
  return <AnalyticsCard title="Theo dõi thi công">{isLoading ? <p className="text-sm text-slate-400">Đang tải...</p> : <PlanList plans={plans} />}</AnalyticsCard>;
}
