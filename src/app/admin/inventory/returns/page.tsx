'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Reveal from '@/components/ui/Reveal';
import {
  CreateReturnSlipItemInput,
  createReturnSlip,
  getEligibleOrdersForReturn,
  getReturnSlips,
  RETURN_SLIP_STATUS_META,
  ReturnSlip,
  ReturnSlipStatus,
} from '@/mocks/adminInventoryReturnsMock';
import { formatDate } from '@/utils/formatDate';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminInventoryReturnsMock.ts. Danh sách phiếu
// hoàn kho, dẫn tới trang chi tiết từng phiếu (/admin/inventory/returns/[id]) — nơi thực hiện xác nhận
// hoàn kho theo ảnh mẫu. Nút "Tạo phiếu" mở modal khai báo đơn + danh sách thiết bị cần hoàn, sau khi
// tạo sẽ chuyển thẳng sang trang chi tiết của phiếu vừa tạo.

type StatusFilter = '' | ReturnSlipStatus;

export default function Page() {
  const router = useRouter();
  const [slips, setSlips] = useState<ReturnSlip[]>(() => getReturnSlips());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return slips.filter((slip) => {
      if (statusFilter && slip.status !== statusFilter) return false;
      if (!term) return true;
      return (
        slip.id.toLowerCase().includes(term) ||
        slip.orderCode.toLowerCase().includes(term) ||
        slip.customerName.toLowerCase().includes(term)
      );
    });
  }, [slips, search, statusFilter]);

  const handleCreated = (slip: ReturnSlip) => {
    setSlips(getReturnSlips());
    setIsCreateOpen(false);
    router.push(`/admin/inventory/returns/${slip.id}`);
  };

  const columns: TableColumn<ReturnSlip>[] = [
    {
      key: 'id',
      label: 'Mã phiếu',
      render: (slip) => (
        <Link href={`/admin/inventory/returns/${slip.id}`} className="font-semibold text-blue-600 hover:underline">
          #{slip.id}
        </Link>
      ),
    },
    {
      key: 'order',
      label: 'Đơn đặt cưới',
      render: (slip) => (
        <div>
          <Link href={`/admin/orders_audit/${slip.orderCode}`} className="font-semibold text-blue-600 hover:underline">
            {slip.orderCode}
          </Link>
          <p className="text-xs text-slate-400">{slip.orderName}</p>
        </div>
      ),
    },
    { key: 'itemCount', label: 'Số mặt hàng', render: (slip) => `${slip.items.length} loại thiết bị` },
    { key: 'createdAt', label: 'Ngày tạo', render: (slip) => formatDate(slip.createdAt) },
    { key: 'createdBy', label: 'Tạo bởi', render: (slip) => slip.createdBy },
    {
      key: 'actualReturnDate',
      label: 'Ngày hoàn kho thực tế',
      render: (slip) => (slip.actualReturnDate ? formatDate(slip.actualReturnDate) : '—'),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (slip) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${RETURN_SLIP_STATUS_META[slip.status].badgeClass}`}>
          {RETURN_SLIP_STATUS_META[slip.status].label}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (slip) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/inventory/returns/${slip.id}`}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thu hồi &amp; hoàn kho</h1>
          <p className="mt-1 text-sm text-slate-500">Danh sách phiếu hoàn kho thiết bị sau khi thi công xong sự kiện.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo phiếu
        </Button>
      </div>

      <Reveal className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Tìm theo mã phiếu, mã đơn, khách hàng..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'PENDING', label: 'Chưa hoàn' },
                { value: 'DONE', label: 'Đã hoàn' },
              ]}
            />
          </div>
        </div>

        <div className="mt-4">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
        </div>
      </Reveal>

      <CreateReturnSlipModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
    </div>
  );
}

const EMPTY_ITEM: CreateReturnSlipItemInput = {
  itemName: '',
  unit: 'Cái',
  totalToReturn: 0,
  warehouseTotalStock: 0,
  warehouseDamagedStock: 0,
  warehouseLockedStock: 0,
};

interface CreateReturnSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (slip: ReturnSlip) => void;
}

function CreateReturnSlipModal({ isOpen, onClose, onCreated }: Readonly<CreateReturnSlipModalProps>) {
  const eligibleOrders = useMemo(() => getEligibleOrdersForReturn(), []);
  const [orderId, setOrderId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [items, setItems] = useState<CreateReturnSlipItemInput[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState('');

  const resetAndClose = () => {
    setOrderId('');
    setCreatedBy('');
    setItems([{ ...EMPTY_ITEM }]);
    setError('');
    onClose();
  };

  const updateItem = (index: number, patch: Partial<CreateReturnSlipItemInput>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!orderId || !createdBy.trim()) {
      setError('Vui lòng chọn đơn đặt cưới và nhập người tạo phiếu');
      return;
    }
    const validItems = items.filter((item) => item.itemName.trim() && item.totalToReturn > 0);
    if (validItems.length === 0) {
      setError('Vui lòng thêm ít nhất 1 thiết bị cần hoàn kho với số lượng lớn hơn 0');
      return;
    }
    const slip = createReturnSlip({ orderId, createdBy: createdBy.trim(), items: validItems });
    onCreated(slip);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Tạo phiếu hoàn kho"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>Tạo phiếu</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Đơn đặt cưới (đã thi công/hoàn thành)"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            options={eligibleOrders.map((o) => ({ value: o.orderId, label: `${o.orderId} — ${o.customerName}` }))}
            placeholder="-- Chọn đơn --"
          />
          <Input label="Người tạo phiếu" required value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="Họ và tên" />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Thiết bị cần hoàn kho</p>
            <button type="button" onClick={addItemRow} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
              <Plus className="h-3.5 w-3.5" />
              Thêm thiết bị
            </button>
          </div>

          <div className="mt-2 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    label="Tên thiết bị"
                    value={item.itemName}
                    onChange={(e) => updateItem(index, { itemName: e.target.value })}
                    placeholder="VD: Bàn ghế Chavari Gold"
                  />
                  <Input label="Đơn vị" value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })} placeholder="Cái" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input
                    label="SL cần hoàn"
                    type="number"
                    min={0}
                    value={item.totalToReturn}
                    onChange={(e) => updateItem(index, { totalToReturn: Number(e.target.value) })}
                  />
                  <Input
                    label="Tổng SL trong kho"
                    type="number"
                    min={0}
                    value={item.warehouseTotalStock}
                    onChange={(e) => updateItem(index, { warehouseTotalStock: Number(e.target.value) })}
                  />
                  <Input
                    label="SL hỏng trong kho"
                    type="number"
                    min={0}
                    value={item.warehouseDamagedStock}
                    onChange={(e) => updateItem(index, { warehouseDamagedStock: Number(e.target.value) })}
                  />
                  <Input
                    label="SL khóa trong kho"
                    type="number"
                    min={0}
                    value={item.warehouseLockedStock}
                    onChange={(e) => updateItem(index, { warehouseLockedStock: Number(e.target.value) })}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa thiết bị này
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">{error}</p>}
      </div>
    </Modal>
  );
}
