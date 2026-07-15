'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import CreateQuotationModal from '@/components/orders/CreateQuotationModal';
import { quotationApiService } from '@/services/quotation.service';
import { catalogApiService } from '@/services/catalog.service';
import { formatCurrency } from '@/utils/formatCurrency';
import { getItemContent } from '@/utils/catalogItemContent';
import type { Quotation, QuotationDetail, QuotationItem } from '@/types/quotation';
import type { Item } from '@/types/catalog';

const STATUS_LABEL: Record<Quotation['status'], string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

interface FinalQuotationProps {
  /** Order.quotationId — FK optional trỏ tới 1 quotation có sẵn của customer, chọn lúc tạo order. */
  quotationId?: string;
  customerId: string;
  canManage: boolean;
  /** Gọi lại sau khi sửa báo giá thành công, để trang cha refetch tổng tiền báo giá ở tab Tổng quan. */
  onQuotationChanged?: () => void;
}

// Tab "Báo giá" — Quotation giờ thuộc Customer (không thuộc Order), Order chỉ tham chiếu 1
// quotationId cố định chọn lúc tạo đơn — KHÔNG có endpoint đổi quotationId của order đã tạo
// (không còn PUT /orders/:id chung), nên tab này chỉ hiển thị/sửa đúng quotation đã gắn, không có
// khái niệm "phiên bản mới" gắn thêm vào order hiện tại. Xem docs/more-require.md.
export default function FinalQuotation({ quotationId, customerId, canManage, onQuotationChanged }: Readonly<FinalQuotationProps>) {
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [itemById, setItemById] = useState<Map<string, Item>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!quotationId) {
      setQuotation(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    quotationApiService
      .getQuotation(quotationId)
      .then((res) => setQuotation(res.data ?? null))
      .finally(() => setIsLoading(false));
  }, [quotationId, refreshToken]);

  const handleQuotationSaved = () => {
    setRefreshToken((t) => t + 1);
    onQuotationChanged?.();
  };

  useEffect(() => {
    catalogApiService.getItems({ limit: 200 }).then((res) => {
      const items: Item[] = res.data ?? [];
      setItemById(new Map(items.map((item) => [item.itemId, item])));
    });
  }, []);

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">Đang tải...</div>;
  }

  if (!quotation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Đơn hàng này chưa liên kết báo giá nào.</p>
      </div>
    );
  }

  const columns: TableColumn<QuotationItem>[] = [
    {
      key: 'itemId',
      label: 'Hạng mục dịch vụ',
      render: (row) => {
        const catalogItem = itemById.get(row.itemId);
        const itemName = catalogItem?.itemName ?? row.itemName ?? `#${row.itemId}`;
        const content = row.content ? { text: row.content, isMock: false } : getItemContent(catalogItem, itemName);
        return (
          <div>
            <p className="font-medium text-slate-800">{itemName}</p>
            <p
              className={`mt-0.5 text-xs ${content.isMock ? 'italic text-slate-400' : 'text-slate-500'}`}
              title={content.isMock ? 'Backend chưa có API mô tả chi tiết loại thiết bị (equipment_type_details) — dữ liệu minh họa' : undefined}
            >
              {content.text}
            </p>
          </div>
        );
      },
    },
    { key: 'quantity', label: 'Số lượng' },
    { key: 'price', label: 'Đơn giá', render: (row) => formatCurrency(row.price) },
    {
      key: 'lineTotal',
      label: 'Thành tiền',
      className: 'text-right font-bold text-slate-900',
      render: (row) => formatCurrency(row.lineTotal ?? row.quantity * row.price - (row.discount ?? 0)),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900">Phiên bản {quotation.version}</span>
          <Badge variant={getStatusBadgeVariant(quotation.status)}>{STATUS_LABEL[quotation.status]}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {canManage && quotation.status === 'DRAFT' && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Sửa bản nháp
            </Button>
          )}
          <Link
            href={`/manager/quotations/${quotation.quotationId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
          >
            Xem đầy đủ / In báo giá
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Tiền hàng</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quotation.subtotal)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Chiết khấu</p>
            <p className="text-lg font-bold text-red-600">-{formatCurrency(quotation.discountTotal)}</p>
          </div>
          <div className="rounded-lg bg-blue-600 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase text-white/70">Thực trả (Tổng)</p>
            <p className="text-xl font-extrabold text-white">{formatCurrency(quotation.totalAmount)}</p>
          </div>
        </div>

        <Table columns={columns} rows={quotation.items} rowKey={(row) => row.quotationItemId ?? row.itemId} isLoading={false} />
      </div>

      <CreateQuotationModal
        isOpen={isEditModalOpen}
        customerId={customerId}
        editingQuotation={quotation}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleQuotationSaved}
      />
    </div>
  );
}
