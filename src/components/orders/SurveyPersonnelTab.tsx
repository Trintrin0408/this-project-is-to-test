'use client';

import { useEffect, useState } from 'react';
import SurveyResultCard from './SurveyResultCard';
import ExecutionTrackingCard from './ExecutionTrackingCard';
import SurveyAssignmentCard from './SurveyAssignmentCard';
import ExecutionPersonnelCard from './ExecutionPersonnelCard';
import FieldChangeRequestCard from './FieldChangeRequestCard';
import AssignStaffModal from './AssignStaffModal';
import { schedulePlanApiService } from '@/services/schedulePlan.service';
import { surveyApiService } from '@/services/survey.service';
import { changeRequestApiService } from '@/services/changeRequest.service';
import type { SurveyReport } from '@/types/survey';
import type { SchedulePlan } from '@/types/schedulePlan';
import type { ChangeRequest } from '@/types/changeRequest';

interface SurveyPersonnelTabProps {
  orderId: string;
  canManage: boolean;
}

type AssignMode = 'survey' | 'execution';

function removeCrById(id: string) {
  return (prev: ChangeRequest[]) => prev.filter((cr) => cr.changeRequestId !== id);
}

function isSurveyPlan(plan: SchedulePlan): boolean {
  return plan.taskName?.toLowerCase().includes('khảo sát') ?? false;
}

// SchedulePlan hợp nhất Schedule+WorkTask-instance+Assignment cũ: 1 GET duy nhất theo orderId đã
// đủ dữ liệu (taskName + assigneeName join sẵn), không cần fetch riêng "assignments" nữa.
export default function SurveyPersonnelTab({ orderId, canManage }: Readonly<SurveyPersonnelTabProps>) {
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [surveyReport, setSurveyReport] = useState<SurveyReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [crSubmittingId, setCrSubmittingId] = useState<string | null>(null);

  const [modal, setModal] = useState<{ isOpen: boolean; mode: AssignMode; taskId: string | null }>({
    isOpen: false,
    mode: 'execution',
    taskId: null,
  });

  const refreshPlans = () => {
    setIsLoadingPlans(true);
    schedulePlanApiService
      .getSchedulePlans({ orderId })
      .then((res) => setPlans(res.data ?? []))
      .catch((err) => console.error('[schedule-plans]', err?.response?.data ?? err))
      .finally(() => setIsLoadingPlans(false));
  };

  useEffect(refreshPlans, [orderId]);

  useEffect(() => {
    changeRequestApiService
      .getChangeRequests({ orderId, status: 'pending' })
      .then((res) => setChangeRequests(res.data ?? []))
      .catch(() => setChangeRequests([]));
  }, [orderId]);

  const surveyPlan = plans.find(isSurveyPlan) ?? null;
  const executionPlans = plans.filter((p) => !isSurveyPlan(p));

  useEffect(() => {
    if (isLoadingPlans) return;
    let active = true;
    const load = surveyPlan
      ? surveyApiService
          .getOrderSurveyReports(orderId)
          .then((res) => (res.data ?? [])[0] ?? null)
          .catch(() => null)
      : Promise.resolve(null);
    load.then((report) => {
      if (!active) return;
      setSurveyReport(report);
      setIsLoadingReport(false);
    });
    return () => {
      active = false;
    };
  }, [orderId, surveyPlan, isLoadingPlans]);

  // Loại việc "Khảo sát" dùng để tạo SchedulePlan mới khi chưa có plan khảo sát nào (fallback taskId
  // rỗng nếu chưa xác định được — modal sẽ báo lỗi yêu cầu thử lại nếu vậy).
  const surveyTaskId = surveyPlan?.taskId ?? null;
  const executionTaskId = executionPlans[0]?.taskId ?? null;

  const handleApproveCr = (id: string) => updateCr(id, 'approved');
  const handleRejectCr = (id: string) => updateCr(id, 'rejected');

  const updateCr = (id: string, status: 'approved' | 'rejected') => {
    setCrSubmittingId(id);
    changeRequestApiService
      .approveChangeRequest(id, status)
      .then(() => setChangeRequests(removeCrById(id)))
      .catch((err) => console.error('[approveChangeRequest]', err?.response?.data ?? err))
      .finally(() => setCrSubmittingId(null));
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SurveyResultCard report={surveyReport} surveyorName={surveyPlan?.assigneeName} isLoading={isLoadingReport} />
          <ExecutionTrackingCard plans={executionPlans} isLoading={isLoadingPlans} />
        </div>

        <div className="space-y-6">
          <SurveyAssignmentCard
            plan={surveyPlan}
            canManage={canManage}
            isLoading={isLoadingPlans}
            onReassign={() => setModal({ isOpen: true, mode: 'survey', taskId: surveyTaskId })}
          />
          <ExecutionPersonnelCard
            plans={executionPlans}
            canManage={canManage}
            canAssign={executionTaskId !== null}
            isLoading={isLoadingPlans}
            onAssign={() => setModal({ isOpen: true, mode: 'execution', taskId: executionTaskId })}
          />
          <FieldChangeRequestCard
            changeRequests={changeRequests}
            canManage={canManage}
            submittingId={crSubmittingId}
            onApprove={handleApproveCr}
            onReject={handleRejectCr}
          />
        </div>
      </div>

      <AssignStaffModal
        isOpen={modal.isOpen}
        mode={modal.mode}
        orderId={orderId}
        taskId={modal.taskId}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
        onAssigned={refreshPlans}
      />
    </>
  );
}
