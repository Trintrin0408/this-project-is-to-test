'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Search, Truck, Wrench } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import DashboardStats, { KpiCardItem } from '@/components/reports/DashboardStats';
import PlanDetailDrawer from '@/components/planning/PlanDetailDrawer';
import { formatDate } from '@/utils/formatDate';
import { SchedulePlan, getAdminSchedulePlans } from '@/mocks/db/schedulePlans';

// Trang thuần giao diện — chưa có màn hình admin/coordination/progress tương ứng để mirror (route đó
// bên Admin vẫn "đang phát triển"). Tái dùng đúng dữ liệu Kế hoạch & phân công (activities/tasks trong
// src/mocks/adminSchedulePlansMock.ts) nhưng nhìn theo góc độ "tiến độ vận chuyển & thi công" của từng
// đơn thay vì quản lý kế hoạch — đáp ứng checklist "Vận hành hiện trường > Theo dõi vận chuyển, thi công".

type StageStatus = 'DONE' | 'IN_PROGRESS' | 'UPCOMING';

const STAGE_META: Record<StageStatus, { label: string; badgeClass: string }> = {
  DONE: { label: 'Hoàn thành', badgeClass: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: 'Đang diễn ra', badgeClass: 'bg-blue-100 text-blue-700' },
  UPCOMING: { label: 'Sắp tới', badgeClass: 'bg-slate-100 text-slate-500' },
};

function stageStatusOf(activityDate: string | undefined, todayStr: string): StageStatus {
  if (!activityDate) return 'UPCOMING';
  if (activityDate < todayStr) return 'DONE';
  if (activityDate === todayStr) return 'IN_PROGRESS';
  return 'UPCOMING';
}

export default function ManagerFieldProgressPage() {
  const router = useRouter();
  const [plans] = useState<SchedulePlan[]>(() => getAdminSchedulePlans().filter((p) => p.status === 'CONFIRMED'));
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SchedulePlan | null>(null);

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((p) => p.orderId.toLowerCase().includes(term) || p.customerName.toLowerCase().includes(term) || p.eventName.toLowerCase().includes(term));
  }, [plans, search]);

  const transportDoneCount = plans.filter((p) => stageStatusOf(p.activities.find((a) => a.type === 'Lắp đặt')?.date, todayStr) === 'DONE').length;
  const constructionDoneCount = plans.filter((p) => p.tasks.length > 0 && p.tasks.every((t) => t.status === 'COMPLETED')).length;
  const collectionDoneCount = plans.filter((p) => stageStatusOf(p.activities.find((a) => a.type === 'Thu hồi')?.date, todayStr) === 'DONE').length;

  const kpis: KpiCardItem[] = [
    { label: 'Đơn đang thi công', value: plans.length, icon: Wrench, iconColor: 'blue' },
    { label: 'Đã vận chuyển lắp đặt', value: transportDoneCount, icon: Truck, iconColor: 'amber' },
    { label: 'Thi công hoàn tất', value: constructionDoneCount, icon: CheckCircle2, iconColor: 'green' },
    { label: 'Đã thu hồi', value: collectionDoneCount, icon: Clock, iconColor: 'pink' },
  ];

  const columns: TableColumn<SchedulePlan>[] = [
    {
      key: 'order',
      label: 'Đơn đặt cưới',
      render: (p) => (
        <div>
          <Link href={`/manager/orders/${p.orderId}`} className="font-semibold text-blue-600 hover:underline">
            {p.orderId}
          </Link>
          <p className="text-xs text-slate-400">{p.customerName}</p>
        </div>
      ),
    },
    { key: 'eventDate', label: 'Ngày sự kiện', render: (p) => formatDate(p.eventDate) },
    {
      key: 'location',
      label: 'Địa điểm',
      render: (p) => (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {p.location}
        </p>
      ),
    },
    {
      key: 'transport',
      label: 'Vận chuyển & lắp đặt',
      render: (p) => {
        const stage = stageStatusOf(p.activities.find((a) => a.type === 'Lắp đặt')?.date, todayStr);
        return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STAGE_META[stage].badgeClass}`}>{STAGE_META[stage].label}</span>;
      },
    },
    {
      key: 'construction',
      label: 'Thi công kỹ thuật',
      render: (p) => {
        const total = p.tasks.length;
        const done = p.tasks.filter((t) => t.status === 'COMPLETED').length;
        if (total === 0) return <span className="text-xs text-slate-300">Chưa có công việc</span>;
        const percent = (done / total) * 100;
        return (
          <div className="min-w-[120px]">
            <p className="text-[11px] font-semibold text-slate-600">
              {done}/{total} việc
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'collection',
      label: 'Thu hồi sau tiệc',
      render: (p) => {
        const stage = stageStatusOf(p.activities.find((a) => a.type === 'Thu hồi')?.date, todayStr);
        return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STAGE_META[stage].badgeClass}`}>{STAGE_META[stage].label}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (p) => (
        <button type="button" onClick={() => setSelectedPlan(p)} className="text-xs font-semibold text-blue-600 hover:underline">
          Xem chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
          <Truck className="h-6 w-6 text-blue-600" />
          Vận chuyển &amp; thi công
        </h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi tiến độ vận chuyển/lắp đặt, thi công kỹ thuật và thu hồi của từng đơn đang thực hiện.</p>
      </div>

      <div className="mt-6">
        <DashboardStats items={kpis} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="min-w-[240px] max-w-sm">
          <Input placeholder="Tìm theo mã đơn, khách hàng, tên lễ cưới..." icon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedPlan && (
          <PlanDetailDrawer
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
            onEdit={() => {
              setSelectedPlan(null);
              router.push('/manager/schedule/plans');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
