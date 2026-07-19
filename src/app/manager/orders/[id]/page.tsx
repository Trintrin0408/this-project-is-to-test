'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  Box,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock,
  Eye,
  FileSignature,
  FileText,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Printer,
  PlusCircle,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import BookingFormModal from '@/components/bookings/BookingFormModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  AdminOrderRow,
  BOOKING_STATUS_META,
  BookingStatus,
  COORDINATOR_POOL,
  DisputeLogEntry,
  LIVE_SHOW_CHECKLIST_ITEMS,
  ORDER_ITEM_SOURCE_META,
  PAYMENT_STATUS_META,
  SurveyAssignment,
  OrderPicklist,
  addAdminOrderDispute,
  closeAdminOrder,
  getAdminOrderDetail,
  getLinkableQuotationsForOrder,
  getOrCreateOrderPicklist,
  linkQuotationToOrder,
  resolveAdminOrderDispute,
  unlinkQuotationFromOrder,
  updateAdminOrder,
  updateAdminOrderItem,
  updateAdminOrderLiveChecklist,
} from '@/mocks/db/orders';
import { getApproachingEventsForOrder } from '@/mocks/db/approachingEvents';
import { getUrgencyBadgeVariant } from '@/utils/eventDate';
import { useAuth } from '@/hooks/useAuth';
import { getAdminQuotationById } from '@/mocks/db/quotations';
import { getAdminContracts } from '@/mocks/adminContractsMock';
import {
  SchedulePlan,
  TASK_STATUS_META,
  confirmAdminScheduleTaskWithEvidence,
  getAdminSchedulePlans,
  removeAdminScheduleActivity,
  removeAdminScheduleTask,
  startAdminScheduleTask,
} from '@/mocks/db/schedulePlans';
import { FIELD_OPS_STAFF } from '@/mocks/db/employees';

// Trang thuần giao diện — mirror 1:1 từ src/app/admin/orders_audit/[id]/page.tsx cho vai trò Manager,
// chỉ đổi tiền tố đường dẫn /admin/orders_audit -> /manager/orders và các liên kết chéo sang khu vực
// Manager tương đương (báo giá, lịch trình & phân công) khi có route tương ứng. Toàn bộ mock
// data/CRUD dùng chung với Admin qua @/mocks/adminOrdersMock (và các mock liên quan) — xem giải thích
// ở đầu file mock đó. Liên kết tới Hợp đồng vẫn trỏ về /admin/contracts vì Manager chưa có khu vực
// quản lý hợp đồng riêng.

type DetailTab = 'overview' | 'lifecycle' | 'items' | 'plans' | 'quotation' | 'dispute';

const TABS: { id: DetailTab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Tổng quan sự kiện', icon: Activity },
  { id: 'lifecycle', label: 'Tiến độ sự kiện', icon: RefreshCw },
  { id: 'items', label: 'Thiết bị & Kho hàng', icon: Box },
  { id: 'plans', label: 'Lịch trình & Kỹ thuật', icon: Calendar },
  { id: 'quotation', label: 'Báo giá & Hợp đồng', icon: FileText },
  { id: 'dispute', label: 'Tranh chấp', icon: AlertOctagon },
];

// Nhãn từng mốc lấy thẳng từ BOOKING_STATUS_META (db/orders.ts, gốc ORDER_STATUS_LABEL) — khớp đúng
// tên trạng thái hiển thị ở badge/dropdown "Trạng thái" phía trên, không tự đặt tên riêng khác đi.
const LIFECYCLE_STEPS: { id: BookingStatus; label: string; desc: string }[] = [
  { id: 'NEW', label: `1. ${BOOKING_STATUS_META.NEW.label}`, desc: 'Lập đơn & hợp đồng' },
  { id: 'CONFIRMED', label: `2. ${BOOKING_STATUS_META.CONFIRMED.label}`, desc: 'Xác nhận đặt cọc' },
  { id: 'IN_PROGRESS', label: `3. ${BOOKING_STATUS_META.IN_PROGRESS.label}`, desc: 'Vận hành & live show' },
  { id: 'COMPLETED', label: `4. ${BOOKING_STATUS_META.COMPLETED.label}`, desc: 'Quyết toán & nghiệm thu' },
];
const LIFECYCLE_ORDER: BookingStatus[] = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

// Bảng vật tư/thiết bị cấu thành từng nhóm hạng mục báo giá — dùng để "nổ" 1 hạng mục gốc (VD: "Tiệc
// bàn") ra danh sách vật tư kho cụ thể cần soát khi xuất phiếu chuẩn bị, kèm tồn kho mock để cảnh báo
// thiếu hàng (đỏ/vàng khi tồn kho < SL cần). Dữ liệu ảo minh họa, không phải tồn kho thật.
interface PicklistMaterial {
  name: string;
  qty: number;
  unit: string;
  stock: number;
  source: 'internal' | 'external';
  note: string;
}

interface PicklistTemplate {
  categoryTag: string;
  mainUnit: string;
  mainStock: number;
  mainNote: string;
  extras: Omit<PicklistMaterial, 'source'>[];
}

const PICKLIST_TEMPLATES: Record<string, PicklistTemplate> = {
  'Tiệc bàn': {
    categoryTag: 'Dịch vụ (Sự kiện, MC, Nhạc...)',
    mainUnit: 'Bàn',
    mainStock: 10,
    mainNote: 'Vật tư tiêu chuẩn theo gói lắp đặt chính',
    extras: [
      { name: 'Thùng đựng chống sốc chuyên dụng có bánh xe', qty: 1, unit: 'Hộp', stock: 15, note: 'Bảo quản va đập lúc vận chuyển' },
      { name: 'Dây nguồn chuyên dụng bọc cao su chịu tải', qty: 2, unit: 'Sợi', stock: 50, note: 'Độ dài 10m mỗi sợi' },
    ],
  },
  'Trang trí sảnh': {
    categoryTag: 'Trang trí (Hoa, Backdrop...)',
    mainUnit: 'Gói',
    mainStock: 8,
    mainNote: 'Thi công theo bản vẽ concept đã duyệt',
    extras: [
      { name: 'Đèn Moving Head Beam 450 siêu sáng', qty: 1, unit: 'Cái', stock: 16, note: 'Kiểm tra bóng halogen và motor quay trước khi xuất' },
      { name: 'Móc treo đèn chịu lực hợp kim nhôm', qty: 1, unit: 'Cái', stock: 32, note: 'Đi kèm ốc lục giác gia cố' },
      { name: 'Dây cáp bảo hiểm lõi thép bọc nhựa chống đứt', qty: 1, unit: 'Sợi', stock: 40, note: 'Dài 1m, phi 4' },
      { name: 'Cáp nguồn Powercon link nối tiếp dài 2m', qty: 1, unit: 'Sợi', stock: 24, note: 'Chân đồng chống cháy' },
    ],
  },
  'MC & âm thanh': {
    categoryTag: 'Dịch vụ (Sự kiện, MC, Nhạc...)',
    mainUnit: 'Gói',
    mainStock: 6,
    mainNote: 'MC và kỹ thuật âm thanh theo kịch bản chương trình',
    extras: [
      { name: 'Micro không dây UHF đôi', qty: 2, unit: 'Bộ', stock: 12, note: 'Thay pin mới trước giờ diễn' },
      { name: 'Loa monitor sân khấu', qty: 2, unit: 'Cái', stock: 10, note: 'Kiểm tra công suất trước khi lắp' },
      { name: 'Mixer âm thanh 12 kênh', qty: 1, unit: 'Cái', stock: 5, note: 'Cấu hình sẵn preset MC và nhạc' },
    ],
  },
  'Quay phim': {
    categoryTag: 'Dịch vụ (Sự kiện, MC, Nhạc...)',
    mainUnit: 'Gói',
    mainStock: 4,
    mainNote: 'Ê-kíp quay phim & chụp ảnh phóng sự theo lịch trình sự kiện',
    extras: [
      { name: 'Máy quay 4K kèm gimbal chống rung', qty: 1, unit: 'Bộ', stock: 6, note: 'Sạc đầy pin, mang pin dự phòng' },
      { name: 'Thẻ nhớ tốc độ cao 128GB', qty: 3, unit: 'Cái', stock: 20, note: 'Format trống trước khi quay' },
      { name: 'Đèn LED quay phim di động', qty: 2, unit: 'Cái', stock: 14, note: 'Kèm chân đế và pin sạc' },
    ],
  },
};

const DEFAULT_PICKLIST_TEMPLATE: PicklistTemplate = {
  categoryTag: 'Dịch vụ (Sự kiện, MC, Nhạc...)',
  mainUnit: 'Gói',
  mainStock: 5,
  mainNote: 'Kiểm tra kỹ thuật trước khi xuất kho',
  extras: [],
};

function stockBadgeClass(stock: number, needed: number): string {
  return stock < needed ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600';
}

// Thẻ "Lịch trình & Kỹ thuật" (tab `plans`) gộp cả PlanActivity (hoạt động chính: Khảo sát/Vận
// chuyển/Lắp đặt/Thu hồi) LẪN PlanWorkTask (công việc kỹ thuật cụ thể) thành 1 danh sách thẻ đồng
// nhất theo đúng thiết kế mẫu — mã LICH-xxx chỉ đánh số hiển thị trong phạm vi 1 đơn đặt, không phải
// mã định danh lưu trữ thật.
interface ScheduleCardItem {
  key: string;
  code: string;
  kind: 'activity' | 'task';
  refId: string;
  category: string;
  assigneeName: string;
  assigneeRole: string;
  assigneePhone: string;
  date: string;
  timeRangeLabel: string;
  location: string;
  notes: string;
  completed: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

function shiftTime(hhmm: string, deltaMinutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = (h * 60 + m + deltaMinutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function resolveStaffPhone(name: string): string {
  return FIELD_OPS_STAFF.find((e) => e.name === name)?.phone ?? '—';
}

function buildScheduleCardItems(plan: SchedulePlan, todayStr: string): ScheduleCardItem[] {
  const items: Omit<ScheduleCardItem, 'code'>[] = [];

  plan.activities.forEach((act, index) => {
    const staff = plan.staffList[index % plan.staffList.length];
    const isPast = act.date < todayStr;
    items.push({
      key: `activity-${act.id}`,
      kind: 'activity',
      refId: act.id,
      category: act.type,
      assigneeName: staff ? `${staff.name} (${staff.role})` : 'Chưa phân công',
      assigneeRole: 'Nhân viên kỹ thuật',
      assigneePhone: staff ? resolveStaffPhone(staff.name) : '—',
      date: act.date,
      timeRangeLabel: `${act.startTime} → ${act.endTime}`,
      location: act.location,
      notes: act.notes,
      completed: isPast,
      checkInTime: isPast ? shiftTime(act.startTime, -5) : undefined,
      checkOutTime: isPast ? shiftTime(act.endTime, -10) : undefined,
    });
  });

  plan.tasks.forEach((task) => {
    const [date, time] = task.startTime.split(' ');
    items.push({
      key: `task-${task.id}`,
      kind: 'task',
      refId: task.id,
      category: task.title,
      assigneeName: task.team.length > 0 ? `${task.assignee} (+${task.team.length} người)` : task.assignee,
      assigneeRole: 'Nhân viên kỹ thuật',
      assigneePhone: resolveStaffPhone(task.assignee),
      date: date ?? task.startTime,
      timeRangeLabel: time ?? '',
      location: task.location,
      notes: task.requirements,
      completed: task.status === 'COMPLETED',
      checkInTime: task.actualStartTime,
      checkOutTime: task.actualEndTime,
    });
  });

  items.sort((a, b) => (a.date + a.timeRangeLabel).localeCompare(b.date + b.timeRangeLabel));

  return items.map((item, index) => ({ ...item, code: `LICH-${String(index + 1).padStart(3, '0')}` }));
}

export default function ManagerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id;
  const [detail, setDetail] = useState(() => getAdminOrderDetail(id));
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [disputeNote, setDisputeNote] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyForm, setSurveyForm] = useState<SurveyAssignment>({ assigneeName: '', date: '', time: '', notes: '' });
  const [linkQuoteId, setLinkQuoteId] = useState('');
  const [picklist, setPicklist] = useState<OrderPicklist | null>(null);
  const [pendingEvidence, setPendingEvidence] = useState<{
    planId: string;
    taskId: string;
    taskTitle: string;
    assignee: string;
    fileName: string;
    previewUrl: string;
  } | null>(null);
  const [scheduleDetailItem, setScheduleDetailItem] = useState<ScheduleCardItem | null>(null);

  if (!detail) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Không tìm thấy đơn đặt.</p>
        <Link href="/manager/orders" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const { row } = detail;
  const refresh = () => setDetail(getAdminOrderDetail(id));

  const handleStatusChange = (status: BookingStatus) => {
    updateAdminOrder(row.orderId, { status });
    refresh();
  };

  const handleCancelOrder = () => {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    updateAdminOrder(row.orderId, { status: 'CANCELLED' });
    refresh();
  };

  const handleEditSubmit = (values: Omit<AdminOrderRow, 'orderId' | 'checklist' | 'status' | 'items' | 'liveChecklist' | 'disputeLogs'>) => {
    updateAdminOrder(row.orderId, values);
    refresh();
    setIsEditOpen(false);
  };

  const handleOpenSurveyModal = () => {
    setSurveyForm(row.surveyAssignment ?? { assigneeName: COORDINATOR_POOL[0], date: row.weddingDate, time: '09:00', notes: '' });
    setIsSurveyModalOpen(true);
  };

  const handleSurveySubmit = () => {
    if (!surveyForm.assigneeName || !surveyForm.date || !surveyForm.time) return;
    updateAdminOrder(row.orderId, { surveyAssignment: surveyForm });
    refresh();
    setIsSurveyModalOpen(false);
  };

  const handleApproveDeposit = () => {
    updateAdminOrder(row.orderId, { paymentStatus: 'DEPOSITED' });
    refresh();
  };

  const handleActivateLiveShow = () => {
    updateAdminOrder(row.orderId, { status: 'IN_PROGRESS' });
    refresh();
  };

  const handleSettleAndClose = (remainingAmount: number) => {
    if (!confirm(`Bạn có chắc chắn muốn xác nhận thu nốt số tiền còn lại (${formatCurrency(remainingAmount)}) và chuyển đơn thành Hoàn thành?`)) return;
    updateAdminOrder(row.orderId, { status: 'COMPLETED', paymentStatus: 'PAID' });
    refresh();
  };

  const handleItemPreparedQtyChange = (itemId: string, value: number, max: number) => {
    updateAdminOrderItem(row.orderId, itemId, { preparedQty: Math.max(0, Math.min(value, max)) });
    refresh();
  };

  const handleItemPreparedByChange = (itemId: string, value: string) => {
    updateAdminOrderItem(row.orderId, itemId, { preparedBy: value });
    refresh();
  };

  const handleChecklistChange = (key: string, checked: boolean) => {
    updateAdminOrderLiveChecklist(row.orderId, key, checked);
    refresh();
  };

  const handleLinkQuotation = () => {
    if (!linkQuoteId) return;
    linkQuotationToOrder(row.orderId, linkQuoteId);
    setLinkQuoteId('');
    refresh();
  };

  const handleOpenPicklist = () => {
    setPicklist(getOrCreateOrderPicklist(row.orderId));
  };

  const handleSelectTaskEvidence = (planId: string, taskId: string, taskTitle: string, assignee: string, file: File | undefined) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingEvidence({ planId, taskId, taskTitle, assignee, fileName: file.name, previewUrl });
  };

  const handleStartTask = (planId: string, taskId: string) => {
    startAdminScheduleTask(planId, taskId);
    refresh();
  };

  const handleDeleteScheduleActivity = (planId: string, activityId: string) => {
    if (!confirm('Bạn có chắc muốn xóa hoạt động này khỏi lịch trình?')) return;
    removeAdminScheduleActivity(planId, activityId);
    refresh();
  };

  const handleDeleteScheduleTask = (planId: string, taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa công việc kỹ thuật này khỏi lịch trình?')) return;
    removeAdminScheduleTask(planId, taskId);
    refresh();
  };

  const handleCancelTaskEvidence = () => {
    if (pendingEvidence) URL.revokeObjectURL(pendingEvidence.previewUrl);
    setPendingEvidence(null);
  };

  const handleConfirmTaskEvidence = () => {
    if (!pendingEvidence) return;
    confirmAdminScheduleTaskWithEvidence(pendingEvidence.planId, pendingEvidence.taskId, {
      fileName: pendingEvidence.fileName,
      previewUrl: pendingEvidence.previewUrl,
    });
    setPendingEvidence(null);
    refresh();
  };

  const handleUnlinkQuotation = () => {
    if (!confirm('Bạn có chắc muốn hủy liên kết báo giá khỏi đơn đặt này?')) return;
    unlinkQuotationFromOrder(row.orderId);
    refresh();
  };

  const handleCloseOrder = () => {
    if (!confirm('Xác nhận đóng đơn hàng? Sau khi đóng sẽ không thể đổi trạng thái hoặc hủy đơn nữa.')) return;
    closeAdminOrder(row.orderId, user?.fullName ?? 'Quản lý vận hành');
    refresh();
  };

  const handleAddDispute = () => {
    if (!disputeNote.trim()) return;
    addAdminOrderDispute(row.orderId, disputeNote.trim(), user?.fullName ?? 'Quản lý vận hành');
    setDisputeNote('');
    refresh();
  };

  const handleResolveDispute = (dispute: DisputeLogEntry) => {
    resolveAdminOrderDispute(row.orderId, dispute.id);
    refresh();
  };

  const linkedQuotation = row.quotationId ? getAdminQuotationById(row.quotationId) : undefined;
  const linkedContract = row.quotationId ? getAdminContracts().find((c) => c.quotationId === row.quotationId) : undefined;
  const linkableQuotations = getLinkableQuotationsForOrder();
  const linkedPlan = getAdminSchedulePlans().find((p) => p.orderId === row.orderId);

  const totalItemsCount = row.items.reduce((sum, item) => sum + item.quantity, 0);
  const preparedItemsCount = row.items.reduce((sum, item) => sum + item.preparedQty, 0);
  const remainingAmount = row.paymentStatus === 'PAID' ? 0 : Math.max(0, row.totalPrice - (row.paymentStatus === 'DEPOSITED' ? row.depositAmount : 0));
  const currentChecklist = row.liveChecklist;
  const nearestApproachingEvent = getApproachingEventsForOrder(row.orderId, 7)[0];
  const urgencyVariant = nearestApproachingEvent ? getUrgencyBadgeVariant(nearestApproachingEvent.daysLeft) : null;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/manager/orders')}
            title="Quay lại"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{row.orderId}</h1>
              <Badge variant={BOOKING_STATUS_META[row.status].variant}>{BOOKING_STATUS_META[row.status].label}</Badge>
              <Badge variant={PAYMENT_STATUS_META[row.paymentStatus].variant}>{PAYMENT_STATUS_META[row.paymentStatus].label}</Badge>
              {urgencyVariant && nearestApproachingEvent && (
                <Badge variant={urgencyVariant}>
                  {nearestApproachingEvent.label} · Còn {nearestApproachingEvent.daysLeft} ngày
                </Badge>
              )}
              {row.closedAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Lock className="h-3 w-3" />
                  Đã đóng đơn
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-950">{detail.eventName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {row.status !== 'CANCELLED' && !row.closedAt && (
            <>
              <div className="w-44">
                <Select
                  value={row.status}
                  onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}
                  options={(Object.keys(BOOKING_STATUS_META) as BookingStatus[])
                    .filter((s) => s !== 'CANCELLED')
                    .map((s) => ({ value: s, label: BOOKING_STATUS_META[s].label }))}
                />
              </div>
              <Button variant="danger" onClick={handleCancelOrder}>
                Hủy đơn hàng
              </Button>
            </>
          )}
          <Button onClick={() => setIsEditOpen(true)} disabled={Boolean(row.closedAt)}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa đơn đặt
          </Button>
        </div>
      </div>

      {row.closedAt && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
          <Lock className="h-4 w-4 shrink-0 text-slate-400" />
          <p>
            Đơn hàng đã được đóng bởi <strong className="text-slate-800">{row.closedBy}</strong> ngày {formatDate(row.closedAt)}. Không thể đổi trạng thái hoặc chỉnh sửa thêm.
          </p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-5 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
      >
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mốc tiến trình vận hành sự kiện</p>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const currentActiveIdx = row.status === 'CANCELLED' ? -1 : LIFECYCLE_ORDER.indexOf(row.status);
            const stepIdx = LIFECYCLE_ORDER.indexOf(step.id);
            const isPast = stepIdx < currentActiveIdx;
            const isCurrent = step.id === row.status;

            return (
              <div key={step.id} className="flex w-full flex-1 items-center gap-3">
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isPast ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-blue-600 text-white shadow shadow-blue-600/20' : 'border bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <div className="text-center sm:text-left">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : 'text-slate-800'}`}>{step.label}</p>
                    <p className="text-[10px] text-slate-400">{step.desc}</p>
                  </div>
                </div>
                {idx < LIFECYCLE_STEPS.length - 1 && <div className={`hidden h-0.5 flex-1 md:block ${isPast ? 'bg-emerald-600' : 'bg-slate-100'}`} />}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="flex h-fit flex-col gap-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs lg:col-span-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-4 w-4 text-slate-400" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6 lg:col-span-3">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25 }}
              className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-950">Hồ sơ thông tin sự kiện</h4>
                <p className="text-xs text-slate-400">Các tham số địa điểm, ngày thi công và khối lượng khách mời.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-slate-400">Ngày diễn ra sự kiện</span>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(row.weddingDate)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-slate-400">Ngày kết thúc</span>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(row.weddingEndDate)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-slate-400">Khách mời dự kiến</span>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Users className="h-4 w-4 text-slate-400" />
                    {row.guestCount} khách mời
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <span className="block font-semibold uppercase text-slate-400">Địa điểm tổ chức</span>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {detail.location}
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <span className="block font-semibold uppercase text-slate-400">Mô tả và dặn dò đặc biệt</span>
                  <p className="whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                    {row.notes || 'Không có ghi chú gì thêm.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-900 p-5 text-xs text-slate-100">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">Hồ sơ khách hàng liên đới</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <p>
                    <span className="text-slate-400">Họ tên:</span> <strong className="text-white">{row.customerName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Điện thoại:</span> <strong className="text-white">{row.customerPhone}</strong>
                  </p>
                  <p className="truncate">
                    <span className="text-slate-400">Địa chỉ:</span> <strong className="text-white">{detail.customerAddress}</strong>
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">Phân công khảo sát báo giá</h5>
                  <button type="button" onClick={handleOpenSurveyModal} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <RefreshCw className="h-3.5 w-3.5" />
                    {row.surveyAssignment ? 'Đổi phân công' : 'Phân công'}
                  </button>
                </div>
                {!row.surveyAssignment ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">Chưa phân công khảo sát để lập báo giá.</p>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.surveyAssignment.assigneeName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{row.surveyAssignment.assigneeName}</p>
                        <p className="truncate text-xs text-slate-400">
                          {formatDate(row.surveyAssignment.date)} · {row.surveyAssignment.time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info">Đã phân công</Badge>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'lifecycle' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-bold">Hồ sơ giám sát tiến độ sự kiện</h4>
                  <p className="text-xs text-slate-300">Theo dõi các mốc tiến độ chuẩn bị vật tư, tiền cọc và chạy chương trình thực tế.</p>
                </div>
                <div className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-center md:text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-300">Tiến độ chung</span>
                  <span className="font-mono text-lg font-extrabold">
                    {(() => {
                      let n = 1;
                      if ((row.paymentStatus === 'DEPOSITED' || row.paymentStatus === 'PAID') && row.surveyAssignment) n++;
                      if (row.status === 'IN_PROGRESS' || row.status === 'COMPLETED') n++;
                      if (row.status === 'COMPLETED') n++;
                      if (row.status === 'COMPLETED' && row.paymentStatus === 'PAID') n++;
                      return `${n} / 5 Mốc`;
                    })()}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="relative space-y-8 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
              >
                <div className="absolute bottom-10 left-[35px] top-10 w-0.5 bg-slate-100" />

                {/* Mốc 1 */}
                <div className="relative pl-10">
                  <div className="absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-xs font-bold text-emerald-600">✓</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-extrabold text-slate-900">Mốc 1: Khởi tạo đơn & khai lập hợp đồng</h5>
                      <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Hoàn thành</span>
                    </div>
                    <p className="text-slate-500">
                      Đơn đặt sự kiện <strong className="text-slate-800">{row.orderId}</strong> đã khởi tạo thành công trên hệ thống.
                    </p>
                    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-3 text-[11px] sm:grid-cols-2">
                      <p className="text-slate-600">
                        <strong>Giá trị đơn hàng:</strong> {formatCurrency(row.totalPrice)}
                      </p>
                      <p className="text-slate-600">
                        <strong>Hạng mục thiết bị:</strong> {row.items.length} nhóm thiết bị
                      </p>
                      <p className="text-slate-600">
                        <strong>Khách hàng chủ quản:</strong> {row.customerName}
                      </p>
                      <p className="text-slate-600">
                        <strong>Điều phối viên:</strong> {row.coordinatorName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mốc 2: Cọc & Khảo sát — phải xác nhận đủ 2 việc mới coi là hoàn thành mốc này */}
                {(() => {
                  const isDeposited = row.paymentStatus === 'DEPOSITED' || row.paymentStatus === 'PAID';
                  const isSurveyed = Boolean(row.surveyAssignment);
                  const isMilestone2Done = isDeposited && isSurveyed;
                  return (
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isMilestone2Done ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-amber-400 bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isMilestone2Done ? '✓' : '2'}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Mốc 2: Xác nhận cọc & khảo sát hiện trường</h5>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isMilestone2Done ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : 'border border-amber-100 bg-amber-50 text-amber-700'}`}>
                            {isMilestone2Done ? 'Hoàn thành' : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <p className="text-slate-500">Cần xác nhận đủ 2 việc — thu cọc 50% và hoàn tất khảo sát hiện trường — trước khi chuyển sang chuẩn bị kho.</p>

                        <div className="rounded-lg border bg-slate-50 p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            {isDeposited ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span className="h-3 w-3 rounded-full border-2 border-amber-400" />}
                            Thu tiền tạm ứng đặt cọc 50%
                          </div>
                          <p className="mt-1.5 text-slate-700">
                            Khoản tiền cọc dự kiến: <strong className="text-blue-600">{formatCurrency(row.depositAmount)}</strong>
                          </p>
                          {!isDeposited && (
                            <button
                              onClick={handleApproveDeposit}
                              className="mt-2.5 rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Xác nhận đã nhận cọc 50%
                            </button>
                          )}
                        </div>

                        <div className="rounded-lg border bg-slate-50 p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            {isSurveyed ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span className="h-3 w-3 rounded-full border-2 border-amber-400" />}
                            Khảo sát hiện trường
                          </div>
                          {isSurveyed && row.surveyAssignment ? (
                            <p className="mt-1.5 text-slate-700">
                              Người khảo sát: <strong className="text-slate-900">{row.surveyAssignment.assigneeName}</strong> — {formatDate(row.surveyAssignment.date)} · {row.surveyAssignment.time}
                            </p>
                          ) : (
                            <button
                              onClick={handleOpenSurveyModal}
                              className="mt-2.5 rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Xác nhận đã khảo sát
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mốc 3: Chuẩn bị kho */}
                {(() => {
                  const isCompleted = row.status === 'IN_PROGRESS' || row.status === 'COMPLETED';
                  return (
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : '3'}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Mốc 3: Lập kế hoạch & thi công hạ tầng kỹ thuật</h5>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isCompleted ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-slate-100 text-slate-500'}`}>
                            {isCompleted ? 'Hoàn thành' : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <p className="text-slate-500">Giám sát bốc xếp xuất kho thiết bị và bố trí kỹ thuật viên dựng bối cảnh tại sảnh.</p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between font-bold text-slate-700">
                            <span>Lịch trình phân công kỹ thuật:</span>
                            <button onClick={() => setActiveTab('plans')} className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800">
                              <PlusCircle className="h-3 w-3" />
                              Xem lịch trình kỹ thuật
                            </button>
                          </div>
                          {linkedPlan && linkedPlan.tasks.length > 0 ? (
                            <div className="space-y-1.5 rounded-lg border bg-slate-50 p-3">
                              {linkedPlan.tasks.map((task) => (
                                <div key={task.id} className="flex flex-col justify-between gap-1 rounded border border-slate-100 bg-white p-2 text-[10px] sm:flex-row sm:items-center">
                                  <div>
                                    <p className="font-bold text-slate-800">{task.title}</p>
                                    <p className="text-slate-500">Phụ trách: {task.assignee}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 font-bold ${TASK_STATUS_META[task.status].badgeClass}`}>{TASK_STATUS_META[task.status].label}</span>
                                    <span className="font-semibold text-slate-600">
                                      {task.actualStartTime ? `Bắt đầu: ${task.actualStartTime}` : 'Chưa bắt đầu'}
                                      {task.actualEndTime && ` · Hoàn thành: ${task.actualEndTime}`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              <p className="pt-1 text-[9px] italic text-slate-400">Giờ bắt đầu/hoàn thành thực tế do Leader Staff cập nhật tại hiện trường.</p>
                            </div>
                          ) : (
                            <p className="rounded-lg border bg-slate-50 p-3 text-center text-[10px] italic text-slate-400">Chưa có lịch thi công kỹ thuật cụ thể cho đơn hàng này.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mốc 4: Live show */}
                {(() => {
                  const isCompleted = row.status === 'COMPLETED';
                  const isCurrent = row.status === 'IN_PROGRESS';
                  return (
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : isCurrent ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : '4'}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Mốc 4: Vận hành chạy chương trình sự kiện (Live Show)</h5>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isCompleted ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : isCurrent ? 'border border-blue-100 bg-blue-50 text-blue-700' : 'border border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isCompleted ? 'Hoàn thành' : isCurrent ? 'Đang diễn ra' : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <p className="text-slate-500">Giám sát vận hành âm thanh ánh sáng trực tiếp tại sảnh tiệc, chuẩn bị nguồn điện dự phòng khẩn cấp.</p>

                        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-slate-50 p-4 text-[11px] sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ngày tổ chức chính thức</p>
                            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              {formatDate(row.weddingDate)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Chạy chương trình</p>
                            {row.status === 'NEW' || row.status === 'CONFIRMED' ? (
                              <button onClick={handleActivateLiveShow} className="rounded bg-blue-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700">
                                Kích hoạt chạy Live Show
                              </button>
                            ) : (
                              <p className="flex items-center gap-1 font-bold text-slate-800">
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                                {isCompleted ? 'Sự kiện đã kết thúc tốt đẹp' : 'Hệ thống đang chạy trực tiếp...'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 border-t border-slate-200 pt-2 sm:col-span-2">
                            <p className="font-bold text-slate-700">Checklist an toàn & kỹ thuật sân khấu:</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {LIVE_SHOW_CHECKLIST_ITEMS.map((item) => (
                                <label key={item.key} className="flex cursor-pointer items-center gap-2 rounded p-1.5 transition hover:bg-slate-100/60">
                                  <input
                                    type="checkbox"
                                    checked={currentChecklist[item.key] ?? false}
                                    onChange={(e) => handleChecklistChange(item.key, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={currentChecklist[item.key] ? 'text-slate-400 line-through' : 'font-medium text-slate-700'}>{item.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mốc 5: Quyết toán */}
                {(() => {
                  const isCompletedAndPaid = row.status === 'COMPLETED' && row.paymentStatus === 'PAID';
                  const isEligible = row.status === 'COMPLETED' || row.status === 'IN_PROGRESS';
                  return (
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isCompletedAndPaid ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : isEligible ? 'border-blue-600 bg-white text-blue-600' : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {isCompletedAndPaid ? '✓' : '5'}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Mốc 5: Quyết toán đối soát & nghiệm thu tháo dỡ</h5>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isCompletedAndPaid ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : isEligible ? 'border border-blue-100 bg-blue-50 text-blue-700' : 'border border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isCompletedAndPaid ? 'Tất toán hoàn thành' : isEligible ? 'Chờ tháo dỡ' : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <p className="text-slate-500">Tiến hành thu dọn tháo gỡ mặt bằng sảnh tiệc, đối soát số tiền còn lại sau sự kiện.</p>
                        <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
                          <div className="grid grid-cols-2 gap-4 text-[11px]">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400">Số dư còn cần quyết toán:</p>
                              <p className={`font-extrabold ${remainingAmount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{formatCurrency(remainingAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400">Trạng thái thanh toán:</p>
                              <p className="font-extrabold text-slate-800">{PAYMENT_STATUS_META[row.paymentStatus].label}</p>
                            </div>
                          </div>
                          {remainingAmount > 0 && isEligible ? (
                            <button onClick={() => handleSettleAndClose(remainingAmount)} className="rounded bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700">
                              Xác nhận thu nốt {formatCurrency(remainingAmount)} &amp; Quyết toán
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 border-t border-slate-200/60 pt-2 text-[11px] font-bold text-emerald-700">
                              <Check className="h-4 w-4 text-emerald-600" />
                              <span>Hồ sơ tài chính và vận hành của sự kiện đã được đối soát. Không còn dư nợ.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mốc 6: Đóng đơn hàng */}
                {(() => {
                  const isEligible = row.status === 'COMPLETED' && row.paymentStatus === 'PAID';
                  return (
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          row.closedAt ? 'border-slate-800 bg-slate-800 text-white' : isEligible ? 'border-blue-600 bg-white text-blue-600' : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {row.closedAt ? <Lock className="h-3 w-3" /> : '6'}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Mốc 6: Đóng đơn hàng</h5>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              row.closedAt ? 'border border-slate-300 bg-slate-100 text-slate-600' : isEligible ? 'border border-blue-100 bg-blue-50 text-blue-700' : 'border border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                          >
                            {row.closedAt ? 'Đã đóng' : isEligible ? 'Sẵn sàng đóng' : 'Chưa đủ điều kiện'}
                          </span>
                        </div>
                        <p className="text-slate-500">Chốt sổ đơn hàng sau khi đã hoàn thành sự kiện, quyết toán và hoàn kho/trả Supplier xong — không thể chỉnh sửa sau khi đóng.</p>
                        <div className="rounded-lg border bg-slate-50 p-3.5">
                          {row.closedAt ? (
                            <p className="flex items-center gap-1.5 font-bold text-slate-700">
                              <CheckCircle2 className="h-4 w-4 text-slate-600" />
                              Đã đóng bởi {row.closedBy} ngày {formatDate(row.closedAt)}
                            </p>
                          ) : (
                            <button
                              onClick={handleCloseOrder}
                              disabled={!isEligible}
                              className="rounded bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Đóng đơn hàng
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}

          {activeTab === 'items' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25 }}
              className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Quản lý phân bổ thiết bị & chuẩn bị kho</h4>
                  <p className="text-xs text-slate-400">Kiểm tra nguồn kho (Kho nhà / Thuê ngoài), số lượng chuẩn bị lắp đặt thực tế.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPicklist}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Xem phiếu chuẩn bị
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Hạng mục thiết bị / Dịch vụ</th>
                      <th className="w-24 px-3 py-2.5 text-center">Nguồn</th>
                      <th className="w-16 px-3 py-2.5 text-center">SL đặt</th>
                      <th className="w-28 px-3 py-2.5 text-center">Đã bàn giao</th>
                      <th className="w-36 px-3 py-2.5">Người phụ trách</th>
                      <th className="px-3 py-2.5 text-right">Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {row.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-slate-900">{item.category}</p>
                          <p className="text-[10px] text-slate-400">{item.description}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant={ORDER_ITEM_SOURCE_META[item.source].variant}>{ORDER_ITEM_SOURCE_META[item.source].label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={item.preparedQty}
                            onChange={(e) => handleItemPreparedQtyChange(item.id, Number(e.target.value), item.quantity)}
                            className="w-14 rounded border border-slate-200 bg-slate-50 py-1 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            placeholder="Điền tên..."
                            value={item.preparedBy}
                            onChange={(e) => handleItemPreparedByChange(item.id, e.target.value)}
                            className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-900">
                <span>Tổng cộng tài chính đơn hàng:</span>
                <span className="text-base text-blue-600">{formatCurrency(row.totalPrice)}</span>
              </div>
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25 }}
              className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Lịch thi công & đơn vị phụ trách kỹ thuật</h4>
                  <p className="text-xs text-slate-400">Hoạt động và công việc điều phối lấy từ Kế hoạch & phân công.</p>
                </div>
                <Link
                  href={linkedPlan ? '/manager/schedule/plans' : `/manager/schedule/plans?orderId=${row.orderId}`}
                  className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {linkedPlan ? 'Quản lý trong Kế hoạch & phân công' : 'Lập kế hoạch điều phối'}
                </Link>
              </div>

              {!linkedPlan ? (
                <p className="rounded-lg bg-slate-50 p-6 text-center text-xs italic text-slate-500">Chưa có kế hoạch điều phối nào được lập cho đơn hàng này.</p>
              ) : (() => {
                const scheduleItems = buildScheduleCardItems(linkedPlan, new Date().toISOString().slice(0, 10));
                return (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700">Lịch trình & phân công kỹ thuật ({scheduleItems.length})</p>
                    {scheduleItems.length === 0 ? (
                      <p className="rounded-lg bg-slate-50 p-6 text-center text-xs italic text-slate-500">Chưa có hoạt động hay công việc kỹ thuật nào được lập.</p>
                    ) : (
                      scheduleItems.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-xs shadow-2xs sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex-1 space-y-1">
                            <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">{item.code}</span>
                            <p className="text-sm font-bold text-slate-900">{item.category}</p>
                            <p className="font-semibold text-blue-700">{item.assigneeName}</p>
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {item.assigneeRole}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.assigneePhone}
                              </span>
                            </p>
                          </div>

                          <div className="flex-1 space-y-1 text-slate-600 sm:border-l sm:border-slate-100 sm:pl-4">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {formatDate(item.date)}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {item.timeRangeLabel}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{item.location}</span>
                            </p>
                            {item.notes && (
                              <p className="truncate text-slate-400">
                                Ghi chú: <span className="italic">{item.notes}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                            <span className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.completed ? 'HOÀN THÀNH' : 'CHỜ XỬ LÝ'}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {item.checkInTime ? `Check-in: ${item.checkInTime}` : 'Chưa check-in'}
                              {item.checkOutTime ? ` · Check-out: ${item.checkOutTime}` : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setScheduleDetailItem(item)}
                                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Xem chi tiết
                              </button>
                              {!item.completed && (
                                <>
                                  <Link
                                    href="/manager/schedule/plans"
                                    className="flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 transition hover:bg-blue-50"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Sửa
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      item.kind === 'activity'
                                        ? handleDeleteScheduleActivity(linkedPlan.id, item.refId)
                                        : handleDeleteScheduleTask(linkedPlan.id, item.refId)
                                    }
                                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa
                                  </button>
                                </>
                              )}
                              {item.kind === 'task' &&
                                !item.completed &&
                                (() => {
                                  const task = linkedPlan.tasks.find((t) => t.id === item.refId);
                                  if (!task) return null;
                                  return (
                                    <>
                                      {(task.status === 'TODO' || task.status === 'ASSIGNED') && (
                                        <button
                                          type="button"
                                          onClick={() => handleStartTask(linkedPlan.id, task.id)}
                                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 transition hover:bg-amber-100"
                                        >
                                          Bắt đầu làm việc
                                        </button>
                                      )}
                                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100">
                                        <Camera className="h-3.5 w-3.5" />
                                        {task.evidencePhotoUrl ? 'Thay ảnh' : 'Tải ảnh thi công'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            handleSelectTaskEvidence(linkedPlan.id, task.id, task.title, task.assignee, e.target.files?.[0]);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                    </>
                                  );
                                })()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'quotation' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.25 }}
                className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-950">Hồ sơ báo giá & hợp đồng liên kết</h4>
                  <p className="text-xs text-slate-400">Văn bản báo giá và hợp đồng được liên kết cho đơn đặt này.</p>
                </div>

                {!linkedQuotation ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">Chưa có hồ sơ báo giá nào được liên kết.</p>
                    <p className="mt-1 text-[11px] text-slate-400">Sử dụng công cụ bên dưới để liên kết báo giá đã duyệt của khách hàng này.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 text-xs sm:flex-row sm:items-center">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 shadow-2xs">{linkedQuotation.code}</span>
                        <span className="text-[10px] text-slate-400">Phiên bản v{linkedQuotation.version}</span>
                        <Badge variant="success">Đã duyệt</Badge>
                      </div>
                      <p className="font-medium text-slate-800">
                        Giá trị giao kèo: <strong className="text-sm text-slate-900">{formatCurrency(linkedQuotation.totalAmount)}</strong>
                      </p>
                      {linkedContract ? (
                        <p className="text-slate-500">
                          Hợp đồng liên kết:{' '}
                          <Link href={`/admin/contracts/${linkedContract.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                            {linkedContract.id}
                          </Link>
                        </p>
                      ) : (
                        <p className="italic text-slate-400">Chưa có hợp đồng nào khởi tạo từ báo giá này.</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-center">
                      <Link
                        href={`/manager/quotations/${linkedQuotation.quotationId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        Xem báo giá
                      </Link>
                      {linkedContract ? (
                        <Link
                          href={`/admin/contracts/${linkedContract.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          Xem hợp đồng
                        </Link>
                      ) : (
                        <Link
                          href="/admin/contracts"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          Tạo hợp đồng
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleUnlinkQuotation}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hủy liên kết
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {!linkedQuotation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                  className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h5 className="text-sm font-bold text-slate-900">Liên kết báo giá đã duyệt</h5>
                    <p className="text-xs text-slate-400">Chọn 1 báo giá đã duyệt của cùng khách hàng để liên kết vào đơn đặt này.</p>
                  </div>

                  {linkableQuotations.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-slate-50 p-4 text-center text-xs italic text-slate-500">
                      Không có báo giá đã duyệt nào của khách hàng này đang chờ liên kết.
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-3 sm:flex-row">
                      <div className="w-full flex-1">
                        <Select
                          label="Chọn báo giá chưa liên kết"
                          value={linkQuoteId}
                          onChange={(e) => setLinkQuoteId(e.target.value)}
                          placeholder="-- Chọn báo giá để liên kết --"
                          options={linkableQuotations.map((q) => ({ value: q.quotationId, label: `${q.code} - Trị giá: ${formatCurrency(q.totalAmount)} (v${q.version})` }))}
                        />
                      </div>
                      <Button disabled={!linkQuoteId} onClick={handleLinkQuotation}>
                        Liên kết ngay
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'dispute' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25 }}
              className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-950">Xử lý tranh chấp với khách hàng</h4>
                <p className="text-xs text-slate-400">
                  Giao tiếp thực tế với khách hàng diễn ra ngoài hệ thống (gọi điện, Zalo, Messenger) — mục này chỉ ghi log nội bộ để theo dõi.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <textarea
                    rows={3}
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    placeholder="Ghi lại nội dung tranh chấp, hướng xử lý đã trao đổi với khách hàng..."
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleAddDispute} disabled={!disputeNote.trim()}>
                  <AlertOctagon className="h-4 w-4" />
                  Ghi log
                </Button>
              </div>

              {row.disputeLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                  <AlertOctagon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">Chưa ghi nhận tranh chấp nào cho đơn hàng này.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {row.disputeLogs.map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border border-slate-150 bg-slate-50/60 p-3.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 whitespace-pre-line text-slate-700">{dispute.note}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            dispute.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {dispute.resolved ? 'Đã xử lý' : 'Đang xử lý'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/70 pt-2 text-[10px] text-slate-400">
                        <span>
                          {dispute.createdBy} · {formatDate(dispute.createdAt)}
                        </span>
                        {!dispute.resolved && (
                          <button type="button" onClick={() => handleResolveDispute(dispute)} className="font-bold text-blue-600 hover:underline">
                            Đánh dấu đã xử lý
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <BookingFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        coordinatorOptions={Array.from(new Set([row.coordinatorName, ...COORDINATOR_POOL]))}
        editingOrder={row}
        onSubmit={handleEditSubmit}
      />

      <Modal
        isOpen={Boolean(picklist)}
        onClose={() => setPicklist(null)}
        title="Phiếu chuẩn bị (Picklist)"
        subtitle={picklist ? `${picklist.code} · Tạo lúc ${formatDate(picklist.createdAt)}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPicklist(null)}>
              Đóng
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              In phiếu
            </Button>
          </>
        }
      >
        {picklist && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-50 p-4 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Khách hàng thụ hưởng</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{row.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-wide text-slate-400">Tổng số hạng mục gốc</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{row.items.length} hạng mục</p>
              </div>
            </div>

            <div className="space-y-4">
              {row.items.map((item, idx) => {
                const template = PICKLIST_TEMPLATES[item.category] ?? DEFAULT_PICKLIST_TEMPLATE;
                const materials: PicklistMaterial[] = [
                  { name: item.description, qty: item.quantity, unit: template.mainUnit, stock: template.mainStock, source: item.source, note: template.mainNote },
                  ...template.extras.map((extra) => ({ ...extra, source: 'internal' as const })),
                ];

                return (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{idx + 1}</span>
                        <h5 className="text-sm font-bold text-slate-900">{item.description}</h5>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">{template.categoryTag}</span>
                        <span className="text-[11px] text-slate-400">
                          Số lượng báo giá: <strong className="text-slate-600">{item.quantity} {template.mainUnit}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-100 bg-white font-semibold text-slate-400">
                          <tr>
                            <th className="px-3 py-2.5">STT</th>
                            <th className="px-3 py-2.5">Tên thiết bị / vật tư cấu thành</th>
                            <th className="px-3 py-2.5 text-center">SL cần</th>
                            <th className="px-3 py-2.5 text-center">ĐVT</th>
                            <th className="px-3 py-2.5 text-center">Tồn kho</th>
                            <th className="px-3 py-2.5 text-center">Nguồn</th>
                            <th className="px-3 py-2.5">Ghi chú kỹ thuật</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {materials.map((material, mIdx) => (
                            <tr key={`${item.id}-${mIdx}`}>
                              <td className="px-3 py-3 text-slate-400">{mIdx + 1}</td>
                              <td className="px-3 py-3 font-semibold text-slate-800">{material.name}</td>
                              <td className="px-3 py-3 text-center font-bold text-slate-900">{material.qty}</td>
                              <td className="px-3 py-3 text-center text-slate-500">{material.unit}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${stockBadgeClass(material.stock, material.qty)}`}>
                                  {material.stock} (Khả dụng)
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${material.source === 'internal' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {material.source === 'internal' ? 'Nội bộ' : 'Thuê ngoài'}
                                </span>
                              </td>
                              <td className="px-3 py-3 italic text-slate-500">{material.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-900">
              <span>Tổng số lượng hạng mục gốc cần chuẩn bị:</span>
              <span className="text-base text-blue-600">
                {totalItemsCount} thiết bị / {preparedItemsCount} đã chuẩn bị
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(pendingEvidence)}
        onClose={handleCancelTaskEvidence}
        title="Xác nhận hoàn thành công việc kỹ thuật"
        subtitle={pendingEvidence ? `${pendingEvidence.taskTitle} · Phụ trách: ${pendingEvidence.assignee}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelTaskEvidence}>
              Hủy
            </Button>
            <Button onClick={handleConfirmTaskEvidence}>
              <Check className="h-4 w-4" />
              Xác nhận hoàn thành
            </Button>
          </>
        }
      >
        {pendingEvidence && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingEvidence.previewUrl}
              alt="Ảnh thi công minh chứng"
              className="max-h-72 w-full rounded-lg border border-slate-200 object-contain"
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Camera className="h-3.5 w-3.5" />
              {pendingEvidence.fileName}
            </p>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Ảnh này sẽ được lưu làm minh chứng thi công và công việc sẽ chuyển sang trạng thái <strong>Hoàn thành</strong>. Kiểm tra kỹ ảnh trước khi xác nhận.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title="Tạo phân công khảo sát báo giá"
        subtitle={`Chọn nhân viên đi khảo sát hiện trường để làm căn cứ lập báo giá cho đơn ${row.orderId}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSurveyModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSurveySubmit}>Lưu phân công</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Nhân viên khảo sát"
            required
            value={surveyForm.assigneeName}
            onChange={(e) => setSurveyForm((prev) => ({ ...prev, assigneeName: e.target.value }))}
            options={COORDINATOR_POOL.map((name) => ({ value: name, label: name }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ngày khảo sát" type="date" required value={surveyForm.date} onChange={(e) => setSurveyForm((prev) => ({ ...prev, date: e.target.value }))} />
            <Input label="Giờ khảo sát" type="time" required value={surveyForm.time} onChange={(e) => setSurveyForm((prev) => ({ ...prev, time: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              rows={3}
              value={surveyForm.notes}
              onChange={(e) => setSurveyForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ví dụ: cần khảo sát mặt bằng sảnh, lối vận chuyển thiết bị..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!scheduleDetailItem}
        onClose={() => setScheduleDetailItem(null)}
        title={scheduleDetailItem?.category}
        subtitle={scheduleDetailItem?.code}
        footer={
          <Button variant="secondary" onClick={() => setScheduleDetailItem(null)}>
            Đóng
          </Button>
        }
      >
        {scheduleDetailItem && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500">Người/đội phụ trách</p>
              <p className="font-medium text-slate-900">{scheduleDetailItem.assigneeName}</p>
              <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {scheduleDetailItem.assigneeRole}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {scheduleDetailItem.assigneePhone}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Ngày</p>
                <p className="text-slate-900">{formatDate(scheduleDetailItem.date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Thời gian</p>
                <p className="text-slate-900">{scheduleDetailItem.timeRangeLabel}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Địa điểm</p>
              <p className="text-slate-900">{scheduleDetailItem.location}</p>
            </div>
            {scheduleDetailItem.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Ghi chú</p>
                <p className="italic text-slate-600">{scheduleDetailItem.notes}</p>
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <span
                className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${scheduleDetailItem.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {scheduleDetailItem.completed ? 'HOÀN THÀNH' : 'CHỜ XỬ LÝ'}
              </span>
              <span className="text-xs text-slate-500">
                {scheduleDetailItem.checkInTime ? `Check-in: ${scheduleDetailItem.checkInTime}` : 'Chưa check-in'}
                {scheduleDetailItem.checkOutTime ? ` · Check-out: ${scheduleDetailItem.checkOutTime}` : ''}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
