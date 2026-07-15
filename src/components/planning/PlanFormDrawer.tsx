'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  ACTIVITY_TYPE_OPTIONS,
  ActivityType,
  PLANNING_STAFF_POOL,
  PlanActivity,
  PlanWorkTask,
  SchedulePlan,
  TaskStatus,
  getUnplannedOrders,
  getUnplannedQuotations,
  nextAdminSchedulePlanId,
} from '@/mocks/db/schedulePlans';

interface QuotationOrderOption {
  orderId: string;
  quotationId: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  location: string;
  coordinatorName: string;
}

interface PlanFormDrawerProps {
  isOpen: boolean;
  editingPlan: SchedulePlan | null;
  /** Đơn đặt mặc định chọn sẵn khi tạo mới — dùng cho luồng liên kết sâu từ chi tiết đơn đặt (?orderId=). */
  defaultOrderId?: string;
  /** "Đơn đặt ảo" dựng từ báo giá — dùng cho luồng lập kế hoạch khảo sát hiện trường sớm từ chi tiết
   * báo giá đang ở trạng thái nháp (?quotationId=), khi báo giá đó chưa có đơn đặt thật. */
  quotationOrderOption?: QuotationOrderOption;
  onClose: () => void;
  onSave: (plan: SchedulePlan) => void;
}

function newActivity(date: string, location: string, type: ActivityType = 'Lắp đặt'): PlanActivity {
  return { id: `ACT-TEMP-${Date.now()}`, type, date, startTime: '08:00', endTime: '12:00', location, notes: '' };
}

// Component được parent mount lại bằng `key` mỗi khi mở drawer (xem PlanningPage) — nhờ vậy state
// khởi tạo dưới đây (useState lazy initializer) luôn phản ánh đúng editingPlan hiện tại mà không
// cần useEffect đồng bộ lại state theo prop (tránh cascading render không cần thiết).
export default function PlanFormDrawer({ isOpen, editingPlan, defaultOrderId, quotationOrderOption, onClose, onSave }: Readonly<PlanFormDrawerProps>) {
  // Danh sách lựa chọn cho ô tìm kiếm: đơn đặt đã xác nhận chưa có kế hoạch + báo giá chưa duyệt chưa
  // có kế hoạch (khảo sát sớm) — gộp chung để tìm được "tất cả đơn đặt và báo giá" từ 1 ô search duy
  // nhất, không chỉ riêng đơn/báo giá được prefill sẵn từ URL.
  const unplannedQuotations = getUnplannedQuotations(editingPlan?.id).filter((q) => q.orderId !== quotationOrderOption?.orderId);
  const unplannedOrders = quotationOrderOption
    ? [quotationOrderOption, ...getUnplannedOrders(editingPlan?.id), ...unplannedQuotations]
    : [...getUnplannedOrders(editingPlan?.id), ...unplannedQuotations];
  const preselectedOrder = defaultOrderId ? unplannedOrders.find((o) => o.orderId === defaultOrderId) : undefined;

  const [orderId, setOrderId] = useState(
    () => editingPlan?.orderId ?? quotationOrderOption?.orderId ?? preselectedOrder?.orderId ?? unplannedOrders[0]?.orderId ?? '',
  );
  const [notes, setNotes] = useState(
    () => editingPlan?.notes ?? (quotationOrderOption ? `Khảo sát hiện trường phục vụ lập báo giá ${quotationOrderOption.orderId}.` : ''),
  );
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>(() => editingPlan?.status ?? 'DRAFT');
  const [activities, setActivities] = useState<PlanActivity[]>(() => {
    if (editingPlan) return [...editingPlan.activities];
    const first = quotationOrderOption ?? preselectedOrder ?? unplannedOrders[0];
    if (!first) return [];
    return [newActivity(first.eventDate, first.location, quotationOrderOption ? 'Khảo sát' : 'Lắp đặt')];
  });
  const [staff, setStaff] = useState<string[]>(() => editingPlan ? editingPlan.staffList.map((s) => s.name) : PLANNING_STAFF_POOL.slice(0, 2).map((s) => s.name));
  const [tasks, setTasks] = useState<PlanWorkTask[]>(() => (editingPlan ? [...editingPlan.tasks] : []));

  const [taskBuilderOpen, setTaskBuilderOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskTeam, setTaskTeam] = useState<string[]>([]);
  const [taskStart, setTaskStart] = useState('');
  const [taskLocation, setTaskLocation] = useState('');
  const [taskRequirements, setTaskRequirements] = useState('');

  const orderInfo =
    unplannedOrders.find((o) => o.orderId === orderId) ??
    (editingPlan && editingPlan.orderId === orderId
      ? { orderId: editingPlan.orderId, customerName: editingPlan.customerName, eventName: editingPlan.eventName, eventDate: editingPlan.eventDate, location: editingPlan.location, coordinatorName: editingPlan.manager }
      : undefined);

  const resetTaskBuilder = () => {
    setTaskBuilderOpen(false);
    setTaskTitle('');
    setTaskAssignee('');
    setTaskTeam([]);
    setTaskStart('');
    setTaskLocation('');
    setTaskRequirements('');
  };

  const handleAddTask = () => {
    if (!taskTitle.trim() || !taskAssignee) return;
    const newTask: PlanWorkTask = {
      id: `TSK-FORM-${Date.now()}`,
      title: taskTitle.trim(),
      assignee: taskAssignee,
      team: taskTeam,
      startTime: taskStart || `${orderInfo?.eventDate ?? ''} 08:00`,
      location: taskLocation || orderInfo?.location || '',
      requirements: taskRequirements,
      status: 'TODO' as TaskStatus,
    };
    setTasks((prev) => [...prev, newTask]);
    resetTaskBuilder();
  };

  const handleSubmit = () => {
    if (!orderId || !orderInfo) return;

    const savedPlan: SchedulePlan = {
      id: editingPlan ? editingPlan.id : nextAdminSchedulePlanId(),
      orderId,
      quotationId: orderId === quotationOrderOption?.orderId ? quotationOrderOption.quotationId : editingPlan?.quotationId,
      customerName: orderInfo.customerName,
      eventName: orderInfo.eventName,
      eventDate: orderInfo.eventDate,
      location: orderInfo.location,
      manager: orderInfo.coordinatorName,
      notes,
      status,
      activities,
      staffList: staff.map((name) => PLANNING_STAFF_POOL.find((s) => s.name === name) ?? { name, role: 'Nhân viên kỹ thuật' }),
      tasks,
    };

    onSave(savedPlan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative flex h-full w-full max-w-4xl flex-col justify-between border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">{editingPlan ? `Chỉnh sửa kế hoạch ${editingPlan.id}` : 'Lập kế hoạch điều phối mới'}</h3>
            <p className="mt-1 text-[11px] text-slate-500">Hoàn thiện thông tin hoạt động, phân bổ nhân sự và công việc.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row">
          <div className="max-w-2xl flex-grow space-y-6">
            <div className="space-y-4 rounded-2xl border border-slate-150 bg-slate-50 p-5">
              <h4 className="border-l-2 border-blue-600 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                Section 1: Thông tin đơn đặt hàng
              </h4>
              <SearchableSelect
                label="Lựa chọn đơn đặt hàng"
                value={orderId}
                onChange={setOrderId}
                disabled={!!editingPlan}
                searchPlaceholder="Tìm theo mã đơn/báo giá hoặc tên khách hàng..."
                emptyText="Không tìm thấy đơn đặt hàng hoặc báo giá phù hợp."
                options={
                  editingPlan
                    ? [{ value: editingPlan.orderId, label: `${editingPlan.orderId} - ${editingPlan.customerName}` }]
                    : unplannedOrders.map((o) => ({
                        value: o.orderId,
                        label: o.quotationId ? `${o.orderId} - ${o.customerName} (Khảo sát báo giá)` : `${o.orderId} - ${o.customerName}`,
                      }))
                }
              />
              {!editingPlan && unplannedOrders.length === 0 && (
                <p className="text-xs italic text-amber-600">Không còn đơn đặt hoặc báo giá nào chưa có kế hoạch điều phối.</p>
              )}
              {orderInfo && (
                <div className="grid grid-cols-2 gap-3.5 rounded-xl border border-slate-100 bg-white p-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Khách hàng</span>
                    <span className="mt-0.5 block font-bold text-slate-800">{orderInfo.customerName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Ngày sự kiện</span>
                    <span className="mt-0.5 block font-bold text-slate-800">{orderInfo.eventDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Địa điểm tổ chức</span>
                    <span className="mt-0.5 block font-semibold text-slate-700">{orderInfo.location}</span>
                  </div>
                </div>
              )}
              <Select
                label="Trạng thái kế hoạch"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
                options={[
                  { value: 'DRAFT', label: 'Chuẩn bị (bản nháp)' },
                  { value: 'CONFIRMED', label: 'Đã xác nhận' },
                ]}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="border-l-2 border-blue-600 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  Section 2: Hoạt động điều phối
                </h4>
                <button
                  type="button"
                  onClick={() => setActivities((prev) => [...prev, newActivity(orderInfo?.eventDate ?? '', orderInfo?.location ?? '')])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Thêm hoạt động
                </button>
              </div>

              <div className="space-y-3.5">
                {activities.map((act) => (
                  <div key={act.id} className="relative space-y-3 rounded-xl border border-slate-150 bg-slate-50/50 p-4">
                    <button
                      type="button"
                      onClick={() => setActivities((prev) => prev.filter((a) => a.id !== act.id))}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
                      title="Xóa hoạt động này"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Loại hoạt động</label>
                        <select
                          value={act.type}
                          onChange={(e) =>
                            setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, type: e.target.value as ActivityType } : a)))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {ACTIVITY_TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Ngày diễn ra</label>
                        <input
                          type="date"
                          value={act.date}
                          onChange={(e) => setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, date: e.target.value } : a)))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Giờ bắt đầu</label>
                        <input
                          type="text"
                          value={act.startTime}
                          onChange={(e) => setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, startTime: e.target.value } : a)))}
                          placeholder="vd. 23:00"
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Giờ kết thúc</label>
                        <input
                          type="text"
                          value={act.endTime}
                          onChange={(e) => setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, endTime: e.target.value } : a)))}
                          placeholder="vd. 02:00"
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Địa điểm cụ thể</label>
                        <input
                          type="text"
                          value={act.location}
                          onChange={(e) => setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, location: e.target.value } : a)))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Ghi chú yêu cầu</label>
                        <input
                          type="text"
                          value={act.notes}
                          onChange={(e) => setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, notes: e.target.value } : a)))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="rounded-lg bg-slate-50 py-2 text-center text-[11px] italic text-slate-400">Chưa có hoạt động nào.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
              <h4 className="border-l-2 border-blue-600 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                Section 3: Lựa chọn nhân sự phối hợp
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PLANNING_STAFF_POOL.map((s) => {
                  const isChecked = staff.includes(s.name);
                  return (
                    <div
                      key={s.name}
                      onClick={() => setStaff((prev) => (isChecked ? prev.filter((n) => n !== s.name) : [...prev, s.name]))}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-all ${
                        isChecked ? 'border-blue-600 bg-blue-50 font-semibold text-blue-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Avatar name={s.name} size="sm" />
                      <div className="overflow-hidden text-[10px]">
                        <p className="truncate leading-tight">{s.name}</p>
                        <p className="mt-0.5 truncate text-[9px] text-slate-400">{s.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="border-l-2 border-blue-600 pl-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  Section 4: Phân công việc chi tiết
                </h4>
                <button
                  type="button"
                  onClick={() => setTaskBuilderOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Thêm công việc
                </button>
              </div>
              <div className="space-y-2">
                {tasks.map((t, index) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{t.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Người phụ trách: {t.assignee} | {t.startTime}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTasks((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="rounded-lg bg-slate-50 py-2 text-center text-[11px] italic text-slate-400">
                    Chưa có công việc nào được phân công.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full flex-shrink-0 lg:w-72">
            <div className="sticky top-0 space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Tóm tắt kế hoạch</h4>
                <p className="mt-1 text-[10px] text-slate-400">Dữ liệu tổng hợp theo thời gian thực</p>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-500">Đơn đặt mục tiêu</span>
                  <span className="mt-0.5 block font-mono font-bold text-white">{orderId || 'Chưa chọn'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-500">Khách hàng</span>
                  <span className="mt-0.5 block font-semibold text-white">{orderInfo?.customerName || 'Chưa xác định'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-500">Ngày diễn ra</span>
                  <span className="mt-0.5 block font-semibold text-white">{orderInfo?.eventDate || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-center">
                  <div className="rounded-lg bg-slate-800/50 p-2">
                    <span className="block text-[10px] text-slate-400">Số hoạt động</span>
                    <span className="text-sm font-bold text-white">{activities.length}</span>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 p-2">
                    <span className="block text-[10px] text-slate-400">Số công việc</span>
                    <span className="text-sm font-bold text-white">{tasks.length}</span>
                  </div>
                  <div className="col-span-2 rounded-lg bg-slate-800/50 p-2">
                    <span className="block text-[10px] text-slate-400">Tổng số nhân sự</span>
                    <span className="text-sm font-bold text-white">{staff.length} người</span>
                  </div>
                </div>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú nội bộ cho kế hoạch..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <Button className="w-full justify-center" onClick={handleSubmit} disabled={!orderId}>
                {editingPlan ? 'Lưu thay đổi' : 'Lưu kế hoạch'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={taskBuilderOpen}
        onClose={resetTaskBuilder}
        title="Thêm công việc phân công"
        footer={
          <>
            <Button variant="secondary" onClick={resetTaskBuilder}>
              Hủy
            </Button>
            <Button onClick={handleAddTask}>Thêm vào kế hoạch</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Tên công việc" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="vd. Lắp dựng sân khấu & backdrop" />
          <Select
            label="Người phụ trách chính"
            required
            value={taskAssignee}
            onChange={(e) => setTaskAssignee(e.target.value)}
            placeholder="Chọn nhân sự"
            options={staff.map((name) => ({ value: name, label: name }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nhân sự đồng hành</label>
            <div className="flex flex-wrap gap-2">
              {staff
                .filter((name) => name !== taskAssignee)
                .map((name) => {
                  const checked = taskTeam.includes(name);
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => setTaskTeam((prev) => (checked ? prev.filter((n) => n !== name) : [...prev, name]))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
            </div>
          </div>
          <Input
            label="Thời gian bắt đầu"
            value={taskStart}
            onChange={(e) => setTaskStart(e.target.value)}
            placeholder={`vd. ${orderInfo?.eventDate ?? '2026-07-18'} 08:00`}
          />
          <Input label="Địa điểm" value={taskLocation} onChange={(e) => setTaskLocation(e.target.value)} placeholder={orderInfo?.location} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Yêu cầu công việc</label>
            <textarea
              rows={3}
              value={taskRequirements}
              onChange={(e) => setTaskRequirements(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
