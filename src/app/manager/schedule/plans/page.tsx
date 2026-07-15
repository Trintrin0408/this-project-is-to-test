'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Edit, Eye, FileText, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import PlanDetailDrawer from '@/components/planning/PlanDetailDrawer';
import PlanFormDrawer from '@/components/planning/PlanFormDrawer';
import Reveal from '@/components/ui/Reveal';
import { formatDate } from '@/utils/formatDate';
import {
  PlanStatus,
  SchedulePlan,
  deleteAdminSchedulePlan,
  getAdminSchedulePlans,
  getPlanStatusInfo,
  saveAdminSchedulePlan,
} from '@/mocks/db/schedulePlans';
import { getAdminQuotationById } from '@/mocks/db/quotations';

// Bản mirror 1:1 của src/app/admin/coordination/planning/page.tsx dưới path /manager/schedule/plans
// — xem giải thích nghiệp vụ ở đầu src/mocks/adminSchedulePlansMock.ts. Chỉ giữ 2 view (Lịch điều
// phối + Danh sách kế hoạch) theo yêu cầu người dùng — bỏ view Kanban của file mẫu
// docs/components/PlanningSection.tsx. Admin và Manager dùng chung 1 bộ mock/service — không fork
// dữ liệu riêng cho Manager.

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const TIMELINE_DAY_COUNT = 10;

function formatOrderId(id: string): string {
  return id.replace(/^DD0*/, 'DD');
}

function formatTimelineOrderId(id: string): string {
  return id.replace(/^DD/, 'ĐĐ-');
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

function weekdayLabelOf(dateStr: string): string {
  const day = new Date(dateStr).getDay();
  return WEEKDAY_LABELS[(day + 6) % 7];
}

/** Khoảng ngày [bắt đầu, kết thúc] của 1 kế hoạch, lấy từ danh sách hoạt động (lắp đặt → trang trí...). */
function planDateRange(plan: SchedulePlan): [string, string] {
  const dates = plan.activities.map((a) => a.date);
  if (dates.length === 0) return [plan.eventDate, plan.eventDate];
  const sorted = [...dates].sort((a, b) => a.localeCompare(b));
  return [sorted[0], sorted.at(-1) as string];
}

function dateDiffInDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function ManagerPlanningPageContent() {
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get('orderId') ?? undefined;
  const prefillQuotationId = searchParams.get('quotationId') ?? undefined;
  const prefillQuotation = prefillQuotationId ? getAdminQuotationById(prefillQuotationId) : undefined;
  // Báo giá chưa có đơn đặt thật (chỉ tồn tại trước khi duyệt) — dựng 1 lựa chọn "đơn đặt ảo" từ
  // thông tin báo giá để tái dùng chung form tạo kế hoạch, phục vụ lịch khảo sát hiện trường sớm.
  const quotationOrderOption = prefillQuotation
    ? {
        orderId: prefillQuotation.code,
        quotationId: prefillQuotation.quotationId,
        customerName: prefillQuotation.customerName,
        eventName: `Khảo sát hiện trường - Báo giá ${prefillQuotation.code}`,
        eventDate: new Date().toISOString().slice(0, 10),
        location: '',
        coordinatorName: prefillQuotation.assignee,
      }
    : undefined;

  const [plans, setPlans] = useState<SchedulePlan[]>(() => getAdminSchedulePlans());
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline' | 'list'>('calendar');

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const today = new Date('2026-07-10');
  const todayStr = toDateStr(today);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [timelineAnchor, setTimelineAnchor] = useState(() => {
    if (plans.length === 0) return todayStr;
    const starts = plans.map((p) => planDateRange(p)[0]).sort((a, b) => a.localeCompare(b));
    return starts[0];
  });
  const timelineDays = useMemo(() => Array.from({ length: TIMELINE_DAY_COUNT }, (_, i) => addDaysStr(timelineAnchor, i)), [timelineAnchor]);
  const timelineRows = useMemo(() => {
    const rangeStart = timelineDays[0];
    const rangeEnd = timelineDays.at(-1) as string;
    return plans
      .map((p) => ({ plan: p, range: planDateRange(p) }))
      .filter(({ range }) => range[0] <= rangeEnd && range[1] >= rangeStart)
      .sort((a, b) => a.range[0].localeCompare(b.range[0]));
  }, [plans, timelineDays]);

  const [selectedPlanDetail, setSelectedPlanDetail] = useState<SchedulePlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(() => Boolean(prefillOrderId || prefillQuotationId));
  const [editingPlan, setEditingPlan] = useState<SchedulePlan | null>(null);
  const [formSessionId, setFormSessionId] = useState(0);
  const [deletingPlan, setDeletingPlan] = useState<SchedulePlan | null>(null);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!term) return true;
      return (
        p.id.toLowerCase().includes(term) ||
        p.orderId.toLowerCase().includes(term) ||
        p.customerName.toLowerCase().includes(term) ||
        p.eventName.toLowerCase().includes(term)
      );
    });
  }, [plans, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredPlans.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredPlans.length, limit };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const leadingOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const calendarCells: (number | null)[] = [...Array(leadingOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToToday = () => {
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth());
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  const dayPlans = (dateStr: string) => plans.filter((p) => p.eventDate === dateStr || p.activities.some((a) => a.date === dateStr));

  const selectedDayPlans = dayPlans(selectedDate);

  const openCreateForm = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
    setFormSessionId((id) => id + 1);
  };

  const openEditForm = (plan: SchedulePlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
    setFormSessionId((id) => id + 1);
  };

  const handleSavePlan = (plan: SchedulePlan) => {
    saveAdminSchedulePlan(plan);
    setPlans(getAdminSchedulePlans());
    setIsFormOpen(false);
    setEditingPlan(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPlan) return;
    deleteAdminSchedulePlan(deletingPlan.id);
    setPlans(getAdminSchedulePlans());
    setDeletingPlan(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 border-b border-slate-150 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Kế hoạch và phân công</h1>
            <p className="mt-0.5 text-xs text-slate-500">Theo dõi kế hoạch thi công, lắp đặt và thu hồi theo ngày</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex self-start rounded-xl border border-slate-200/50 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Lịch điều phối
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Lịch timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Danh sách kế hoạch
            </button>
          </div>

          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Tạo kế hoạch mới
          </Button>
        </div>
      </div>

      {activeTab === 'list' && (
        <Reveal className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm mã kế hoạch, khách hàng, tên lễ cưới..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'ALL')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CONFIRMED">Đã xác nhận</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setStatusFilter('ALL');
              }}
              className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
            >
              Đặt lại
            </button>
          </div>
        </Reveal>
      )}

      {activeTab === 'calendar' && (
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <Reveal className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-800">
                Lịch tháng {calendarMonth + 1}/{calendarYear}
              </h3>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={handlePrevMonth} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50" title="Tháng trước">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleGoToToday} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  Hôm nay
                </button>
                <button type="button" onClick={handleNextMonth} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50" title="Tháng sau">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {WEEKDAY_LABELS.map((day) => (
                <div key={day} className="rounded-lg bg-slate-50/50 py-2.5 font-bold text-slate-400">
                  {day}
                </div>
              ))}
              {calendarCells.map((dayNum, cellIdx) => {
                if (dayNum === null) return <div key={`empty-${cellIdx}`} className="aspect-square rounded-xl border border-slate-100/30 bg-slate-50/10" />;

                const dayString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const plansOnDay = dayPlans(dayString);
                const isSelected = selectedDate === dayString;

                return (
                  <div
                    key={dayString}
                    onClick={() => setSelectedDate(dayString)}
                    className={`relative flex aspect-square cursor-pointer flex-col justify-between rounded-xl border p-1.5 text-left transition-all hover:border-blue-400 hover:shadow-xs ${
                      isSelected ? 'border-2 border-blue-600 bg-blue-50/20 ring-1 ring-blue-300' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isSelected ? 'rounded-md bg-blue-100/80 px-1.5 py-0.5 text-blue-700' : 'text-slate-700'}`}>{dayNum}</span>
                      {plansOnDay.length > 0 && !isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {plansOnDay.slice(0, 2).map((p) => {
                        const info = getPlanStatusInfo(p);
                        return (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dayString);
                              setSelectedPlanDetail(p);
                            }}
                            title={`${p.eventName} @ ${p.location}`}
                            className={`truncate rounded-md px-1 py-0.5 text-[9px] font-bold leading-tight ${info.badgeClass}`}
                          >
                            {formatOrderId(p.orderId)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-4 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Đang thực hiện
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Đã chốt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Chuẩn bị
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Hoàn thành
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="flex min-h-[500px] flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Lịch ngày {formatDate(selectedDate)}</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{selectedDayPlans.length} sự kiện</span>
            </div>

            <div className="max-h-[580px] flex-1 space-y-3.5 overflow-y-auto pr-1">
              {selectedDayPlans.length === 0 ? (
                <div className="my-auto flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-8 py-16 text-center">
                  <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-700">Chưa có lịch trình</h4>
                  <p className="max-w-[220px] text-[11px] leading-relaxed text-slate-400">Chưa có kế hoạch thi công, lắp đặt hoặc trang trí nào vào ngày này.</p>
                </div>
              ) : (
                selectedDayPlans.map((p) => {
                  const info = getPlanStatusInfo(p);
                  const dayActivities = p.activities.filter((a) => a.date === selectedDate);
                  const start = dayActivities[0]?.startTime ?? '08:00';
                  const end = dayActivities[dayActivities.length - 1]?.endTime ?? '17:00';
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanDetail(p)}
                      className="group relative flex cursor-pointer flex-col items-start gap-4 rounded-2xl border border-slate-150 p-4 shadow-2xs transition-all hover:border-blue-400 hover:shadow-xs md:flex-row"
                    >
                      <div className="flex min-w-[70px] flex-col items-start justify-center border-b border-slate-100 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-4">
                        <span className="text-xs font-bold text-blue-600">{start}</span>
                        <span className="my-0.5 text-[9px] font-bold text-slate-400">đến</span>
                        <span className="text-xs font-bold text-blue-600">{end}</span>
                      </div>
                      <div className="w-full flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-extrabold text-blue-700">{p.orderId}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${info.dotColorClass}`} />
                            {info.label}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">{p.eventName}</h4>
                        <div className="space-y-1.5 text-[10px] text-slate-500">
                          <p className="flex items-center gap-1.5" title={p.location}>
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{p.location}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate font-medium text-slate-600">
                              Chỉ huy: <strong className="font-semibold text-slate-800">{p.manager}</strong> ({p.staffList.length} nhân sự)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="pt-2 text-center text-[10px] italic text-slate-400">Nhấp vào thẻ sự kiện trong lịch hoặc danh sách để xem chi tiết & phân công công việc.</p>
          </Reveal>
        </div>
      )}

      {activeTab === 'timeline' && (
        <Reveal className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-slate-800">
                Lịch timeline tháng {new Date(timelineAnchor).getMonth() + 1}/{new Date(timelineAnchor).getFullYear()}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">Bản đồ tiến độ thi công và khớp thời gian thực tế của tất cả các đơn hàng trùng khớp nhau</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTimelineAnchor((prev) => addDaysStr(prev, -7))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                title="Kỳ trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTimelineAnchor(todayStr)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setTimelineAnchor((prev) => addDaysStr(prev, 7))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                title="Kỳ sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[220px_1fr]">
                <div className="border-b border-slate-100 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Đơn hàng</div>
                <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${TIMELINE_DAY_COUNT}, minmax(0, 1fr))` }}>
                  {timelineDays.map((d) => (
                    <div key={d} className={`py-2 text-center ${d === todayStr ? 'text-blue-600' : 'text-slate-400'}`}>
                      <p className="text-sm font-bold">{new Date(d).getDate()}</p>
                      <p className="text-[10px] font-semibold">{weekdayLabelOf(d)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {timelineRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <Clock className="h-6 w-6 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">Không có kế hoạch nào trong khoảng thời gian này.</p>
                </div>
              ) : (
                timelineRows.map(({ plan, range }) => {
                  const info = getPlanStatusInfo(plan);
                  const startCol = Math.max(1, dateDiffInDays(timelineDays[0], range[0]) + 1);
                  const endCol = Math.min(TIMELINE_DAY_COUNT, dateDiffInDays(timelineDays[0], range[1]) + 1);
                  return (
                    <div key={plan.id} className="grid grid-cols-[220px_1fr] border-b border-slate-100/80">
                      <div className="flex items-center gap-2 py-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${info.dotColorClass}`} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">{formatTimelineOrderId(plan.orderId)}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(range[0])} - {formatDate(range[1])}
                          </p>
                        </div>
                      </div>
                      <div className="relative grid py-3" style={{ gridTemplateColumns: `repeat(${TIMELINE_DAY_COUNT}, minmax(0, 1fr))` }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanDetail(plan)}
                          title={`${plan.eventName} — nhấp để xem chi tiết`}
                          className={`truncate rounded-full px-2.5 py-1.5 text-center text-[11px] font-bold transition-opacity hover:opacity-80 ${info.badgeClass}`}
                          style={{ gridColumn: `${startCol} / ${endCol + 1}` }}
                        >
                          {formatTimelineOrderId(plan.orderId)}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-[11px] italic leading-relaxed text-slate-500">
              Mẹo: Nhấp vào thanh ngang màu sắc của đơn hàng (ví dụ <strong className="font-bold not-italic text-slate-700">{formatTimelineOrderId(timelineRows[0]?.plan.orderId ?? 'DD0001')}</strong>) trên bảng
              timeline để hiển thị Drawer chi tiết các công việc, nhân sự phân công và trang thiết bị thực tế.
            </p>
          </div>
        </Reveal>
      )}

      {activeTab === 'list' && (
        <Reveal className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Mã kế hoạch</th>
                  <th className="px-4 py-3.5">Mã đơn đặt</th>
                  <th className="px-4 py-3.5">Khách hàng / Tiệc cưới</th>
                  <th className="px-4 py-3.5">Ngày thi công</th>
                  <th className="px-4 py-3.5">Địa điểm</th>
                  <th className="px-4 py-3.5">Số công việc</th>
                  <th className="px-4 py-3.5">Nhân sự</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pageRows.length > 0 ? (
                  pageRows.map((p) => {
                    const info = getPlanStatusInfo(p);
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.id}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-1 font-mono font-medium text-slate-800">{p.orderId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{p.customerName}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{p.eventName}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">{formatDate(p.eventDate)}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={p.location}>
                          {p.location}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{p.tasks.length} việc</td>
                        <td className="px-4 py-3 text-slate-600">{p.staffList.length} người</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${info.badgeClass}`}>{info.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPlanDetail(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Xem
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(p)}
                              title="Chỉnh sửa kế hoạch"
                              className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPlan(p)}
                              title="Xóa kế hoạch"
                              className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Clock className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-500">Không tìm thấy kế hoạch điều phối nào</p>
                      <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc thêm mới kế hoạch.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination pagination={paginationState} onPageChange={setPage} />
        </Reveal>
      )}

      <AnimatePresence>
        {selectedPlanDetail && (
          <PlanDetailDrawer
            plan={selectedPlanDetail}
            onClose={() => setSelectedPlanDetail(null)}
            onEdit={(plan) => {
              openEditForm(plan);
            }}
          />
        )}
      </AnimatePresence>

      <PlanFormDrawer
        key={formSessionId}
        isOpen={isFormOpen}
        editingPlan={editingPlan}
        defaultOrderId={formSessionId === 0 ? prefillOrderId : undefined}
        quotationOrderOption={formSessionId === 0 ? quotationOrderOption : undefined}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
      />

      <Modal
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        title="Xóa kế hoạch điều phối"
        subtitle={deletingPlan ? `Bạn có chắc muốn xóa kế hoạch "${deletingPlan.id}"? Hành động này không thể hoàn tác.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingPlan(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa kế hoạch
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}

export default function ManagerPlanningPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Đang tải...</div>}>
      <ManagerPlanningPageContent />
    </Suspense>
  );
}
