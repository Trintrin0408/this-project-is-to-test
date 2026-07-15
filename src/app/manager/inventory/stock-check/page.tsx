'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Eye, MoreHorizontal, Search, SlidersHorizontal, Wrench } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import EquipmentDetailModal from '@/components/catalog/EquipmentDetailModal';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AdminEquipment,
  EQUIPMENT_CATEGORY_OPTIONS,
  StockLogType,
  adjustAdminEquipmentStock,
  getAdminEquipment,
} from '@/mocks/db/catalog';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminEquipmentMock.ts. Bố cục port từ
// docs/components/ProductsAndEquipmentView.tsx (nhánh "Tồn kho doanh nghiệp"): số lượng khả dụng/đã
// khóa được mô phỏng lại theo ngày chọn trên bảng (giống UC 2.13 - Date-based Inventory Lock) bằng
// công thức seed cố định theo id sản phẩm + ngày; số lượng hỏng/tổng số lượng lấy trực tiếp từ store
// nên không đổi theo ngày. Trang "Hỏng, mất & bảo trì" liên kết bên cạnh vẫn dùng API thật như trước.
// Mirror của src/app/admin/inventory/stock-status/page.tsx cho vai trò Manager — dùng chung mock/service/UI.
// Ghi chú: chưa có route /manager/inventory/maintenance nên nút "Thiết bị đang bảo trì" tạm thời vẫn
// trỏ về /admin/inventory/maintenance (không có trang Manager tương đương trong điều hướng hiện tại).

interface SimulatedStock {
  availableStock: number;
  rentedStock: number;
  maintenanceStock: number;
  totalStock: number;
}

function getSimulatedStockForDate(equipment: AdminEquipment, dateStr: string): SimulatedStock {
  let displayAvailable = equipment.availableStock;
  let displayRented = equipment.rentedStock;
  const displayMaintenance = equipment.maintenanceStock;

  if (dateStr) {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate() || 1;
    const month = (dateObj.getMonth() + 1) || 1;
    const year = dateObj.getFullYear() || 2026;

    const allocatable = equipment.availableStock + equipment.rentedStock;
    if (allocatable > 0) {
      const seed = (equipment.id.charCodeAt(equipment.id.length - 1) || 0) + day + month * 7 + year;
      const rentedPercent = 5 + (seed % 81); // 5% đến 85%
      const simulatedRented = Math.round((allocatable * rentedPercent) / 100);
      displayRented = Math.max(0, Math.min(allocatable, simulatedRented));
      displayAvailable = allocatable - displayRented;
    } else {
      displayRented = 0;
      displayAvailable = 0;
    }
  }

  return {
    availableStock: displayAvailable,
    rentedStock: displayRented,
    maintenanceStock: displayMaintenance,
    totalStock: displayAvailable + displayRented + displayMaintenance,
  };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ManagerStockCheckPage() {
  const [equipment, setEquipment] = useState<AdminEquipment[]>(() => getAdminEquipment());
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [onlyMaintenance, setOnlyMaintenance] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState<AdminEquipment | null>(null);

  const refresh = () => setEquipment(getAdminEquipment());

  const filteredEquipment = useMemo(() => {
    const term = search.trim().toLowerCase();
    return equipment.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (onlyMaintenance && e.maintenanceStock <= 0) return false;
      if (term && !(e.id.toLowerCase().includes(term) || e.name.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [equipment, search, categoryFilter, onlyMaintenance]);

  const handleAdjustStock = (type: StockLogType, quantity: number, reason: string) => {
    if (!viewingEquipment) return;
    adjustAdminEquipmentStock(viewingEquipment.id, type, quantity, reason, 'Điều chỉnh thủ công');
    refresh();
    setViewingEquipment(getAdminEquipment().find((e) => e.id === viewingEquipment.id) ?? null);
  };

  const columns: TableColumn<AdminEquipment>[] = [
    { key: 'id', label: 'ID', render: (row) => <span className="font-semibold text-slate-400">{row.id}</span> },
    {
      key: 'name',
      label: 'Tên sản phẩm & thiết bị',
      render: (row) => (
        <button type="button" onClick={() => setViewingEquipment(row)} className="text-left font-semibold text-blue-600 hover:underline">
          {row.name}
        </button>
      ),
    },
    { key: 'category', label: 'Nhóm sản phẩm', render: (row) => <span className="text-slate-600">{row.category}</span> },
    {
      key: 'availableStock',
      label: 'Tổng khả dụng',
      className: 'text-center',
      render: (row) => <span className="font-bold text-emerald-600">{getSimulatedStockForDate(row, selectedDate).availableStock}</span>,
    },
    {
      key: 'rentedStock',
      label: 'Số lượng đã khóa',
      className: 'text-center',
      render: (row) => <span className="font-bold text-blue-600">{getSimulatedStockForDate(row, selectedDate).rentedStock}</span>,
    },
    {
      key: 'maintenanceStock',
      label: 'Số lượng hỏng',
      className: 'text-center',
      render: (row) => <span className="font-bold text-rose-600">{getSimulatedStockForDate(row, selectedDate).maintenanceStock}</span>,
    },
    {
      key: 'totalStock',
      label: 'Tổng số lượng',
      className: 'text-center bg-slate-50/60',
      render: (row) => <span className="font-bold text-slate-900">{getSimulatedStockForDate(row, selectedDate).totalStock}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            onClick={() => setViewingEquipment(row)}
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Tùy chọn"
            title="Tùy chọn"
            onClick={() => setViewingEquipment(row)}
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tồn kho doanh nghiệp</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý số lượng tồn kho sản phẩm và thiết bị trong doanh nghiệp</p>
        </div>
        <Link href="/admin/inventory/maintenance">
          <Button variant="secondary">
            <Wrench className="h-4 w-4" />
            Thiết bị đang bảo trì
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
      >
        <h2 className="text-base font-bold text-slate-900">Danh sách tồn kho doanh nghiệp</h2>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Tìm kiếm theo ID, tên sản phẩm..."
              icon={<Search className="h-4 w-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-full md:w-52">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'Nhóm sản phẩm' }, ...EQUIPMENT_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="w-full md:w-48">
            <Input type="date" icon={<Calendar className="h-4 w-4" />} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <Button type="button" variant={showAdvancedFilters ? 'primary' : 'secondary'} onClick={() => setShowAdvancedFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {showAdvancedFilters && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <input
              id="only-maintenance"
              type="checkbox"
              checked={onlyMaintenance}
              onChange={(e) => setOnlyMaintenance(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="only-maintenance" className="text-sm font-medium text-slate-600">
              Chỉ hiển thị sản phẩm đang có hàng hỏng / bảo trì
            </label>
          </div>
        )}

        <div className="mt-4">
          <Table columns={columns} rows={filteredEquipment} rowKey={(row) => row.id} />
        </div>
      </motion.div>

      <EquipmentDetailModal
        isOpen={Boolean(viewingEquipment)}
        onClose={() => setViewingEquipment(null)}
        equipment={viewingEquipment}
        onAdjustStock={handleAdjustStock}
      />
    </div>
  );
}
