'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, PackageCheck, Search, Truck } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import DashboardStats, { KpiCardItem } from '@/components/reports/DashboardStats';
import { formatDate } from '@/utils/formatDate';
import { OrderPicklistSummary, getAdminOrderPicklists, markAdminOrderPickedUp } from '@/mocks/db/orders';

// Trang thuần giao diện mới — chưa có màn hình admin/inventory/picklists tương ứng để mirror (route đó
// bên Admin vẫn là placeholder "đang phát triển"). Tổng hợp phiếu chuẩn bị xuất kho từ mọi đơn đặt đã
// xác nhận/đang thi công (src/mocks/adminOrdersMock.ts) — tái dùng đúng dữ liệu items/preparedQty đã có
// ở tab "Thiết bị & Kho hàng" của trang chi tiết đơn đặt (manager/orders/[id]) thay vì tạo nguồn dữ
// liệu riêng. Đáp ứng checklist "Kho & Supplier > Pick-list xuất kho".

type ExportFilter = '' | 'PENDING' | 'EXPORTED';

export default function ManagerPicklistsPage() {
  const [summaries, setSummaries] = useState<OrderPicklistSummary[]>(() => getAdminOrderPicklists());
  const [search, setSearch] = useState('');
  const [exportFilter, setExportFilter] = useState<ExportFilter>('');

  const refresh = () => setSummaries(getAdminOrderPicklists());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return summaries.filter((s) => {
      const isExported = Boolean(s.row.pickedUpAt);
      if (exportFilter === 'PENDING' && isExported) return false;
      if (exportFilter === 'EXPORTED' && !isExported) return false;
      if (!term) return true;
      return (
        s.picklist.code.toLowerCase().includes(term) ||
        s.row.orderId.toLowerCase().includes(term) ||
        s.row.customerName.toLowerCase().includes(term)
      );
    });
  }, [summaries, search, exportFilter]);

  const readyCount = summaries.filter((s) => s.totalItemsCount > 0 && s.preparedItemsCount >= s.totalItemsCount && !s.row.pickedUpAt).length;
  const exportedCount = summaries.filter((s) => Boolean(s.row.pickedUpAt)).length;

  const kpis: KpiCardItem[] = [
    { label: 'Tổng phiếu chuẩn bị', value: summaries.length, icon: ClipboardList, iconColor: 'blue' },
    { label: 'Sẵn sàng xuất kho', value: readyCount, icon: PackageCheck, iconColor: 'amber' },
    { label: 'Đã xuất kho', value: exportedCount, icon: CheckCircle2, iconColor: 'green' },
  ];

  const handleMarkExported = (orderId: string) => {
    markAdminOrderPickedUp(orderId);
    refresh();
  };

  const columns: TableColumn<OrderPicklistSummary>[] = [
    { key: 'code', label: 'Mã phiếu', render: (s) => <span className="font-mono text-xs font-bold text-slate-700">{s.picklist.code}</span> },
    {
      key: 'order',
      label: 'Đơn đặt cưới',
      render: (s) => (
        <div>
          <Link href={`/manager/orders/${s.row.orderId}`} className="font-semibold text-blue-600 hover:underline">
            {s.row.orderId}
          </Link>
          <p className="text-xs text-slate-400">{s.row.customerName}</p>
        </div>
      ),
    },
    { key: 'weddingDate', label: 'Ngày thi công', render: (s) => formatDate(s.row.weddingDate) },
    { key: 'coordinatorName', label: 'Điều phối viên', render: (s) => s.row.coordinatorName },
    {
      key: 'exportStatus',
      label: 'Trạng thái xuất kho',
      render: (s) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            s.row.pickedUpAt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {s.row.pickedUpAt ? `Đã xuất ${formatDate(s.row.pickedUpAt)}` : 'Chưa xuất kho'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (s) => {
        const isAllPrepared = s.totalItemsCount > 0 && s.preparedItemsCount >= s.totalItemsCount;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/manager/orders/${s.row.orderId}`} className="text-xs font-semibold text-blue-600 hover:underline">
              Xem chi tiết
            </Link>
            {!s.row.pickedUpAt && (
              <button
                type="button"
                disabled={!isAllPrepared}
                onClick={() => handleMarkExported(s.row.orderId)}
                title={isAllPrepared ? 'Đánh dấu đã xuất kho' : 'Cần chuẩn bị đủ 100% thiết bị trước khi xuất kho'}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Truck className="h-3.5 w-3.5" />
                Đã xuất kho
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          Pick-list xuất kho
        </h1>
        <p className="mt-1 text-sm text-slate-500">Phiếu chuẩn bị xuất kho theo từng đơn đặt đã xác nhận — theo dõi tiến độ chuẩn bị và đánh dấu đã xuất kho.</p>
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Tìm theo mã phiếu, mã đơn, khách hàng..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-52">
            <Select
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value as ExportFilter)}
              options={[
                { value: '', label: 'Tất cả trạng thái xuất kho' },
                { value: 'PENDING', label: 'Chưa xuất kho' },
                { value: 'EXPORTED', label: 'Đã xuất kho' },
              ]}
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.picklist.code} />
        </div>

        {summaries.length === 0 && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-10 text-center">
            <Button variant="secondary" disabled>
              Không có đơn nào cần chuẩn bị xuất kho
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
