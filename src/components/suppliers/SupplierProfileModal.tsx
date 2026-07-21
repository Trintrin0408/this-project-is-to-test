'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Building2, Coins, Loader2, Mail, MapPin, Package, Star, User, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { procurementApiService } from '@/services/procurement.service';
import { SUPPLIER_TRANSACTION_STATUS_META, SUPPLIER_TRANSACTION_TYPE_META } from '@/constants/supplier-transaction-status';
import type { Supplier } from '@/types/supplier';
import type { SupplierTransaction } from '@/types/procurement';

interface SupplierProfileModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

/** Hồ sơ chi tiết 1 đối tác (thông tin liên hệ, công nợ, lịch sử giao dịch thuê/mua) — dữ liệu thật
 * qua supplierApiService/procurementApiService. `debtBalance` lấy trực tiếp từ Supplier (backend đã
 * tính sẵn). Lịch sử giao dịch gọi riêng GET /supplier-transactions?supplierId=X khi modal mở (không
 * lồng sẵn trong Supplier — xem docs/supplier_api.md mục 4.1). Không có "Danh mục hạng mục & giá thiết
 * bị cung cấp" theo NCC như bản mock cũ — backend hiện chưa có bảng dữ liệu tương ứng (mục 4.1), nên
 * mục này tạm không hiển thị cho tới khi có API. */
export function SupplierProfileModal({ supplier, onClose }: Readonly<SupplierProfileModalProps>) {
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplier) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bật cờ loading khi bắt đầu gọi API thật
    setIsLoading(true);
    setLoadError(null);
    procurementApiService
      .getTransactions({ supplierId: supplier.supplierId, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setTransactions(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Không tải được lịch sử giao dịch. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supplier]);

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-slate-400" />
            Hồ sơ chi tiết Đối tác <span className="text-slate-300">•</span> <span className="text-blue-600">{supplier.supplierCode}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Lĩnh vực chuyên môn</p>
                <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                  {supplier.serviceType}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Người liên hệ</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  {supplier.contactPerson || '—'}
                </p>
              </div>
              {supplier.rating != null && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đánh giá</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Star className="h-4 w-4 text-amber-400" />
                    {supplier.rating.toFixed(1)} / 5
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email liên lạc</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {supplier.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Địa chỉ</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {supplier.address || '—'}
                </p>
              </div>
              {supplier.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ghi chú</p>
                  <p className="mt-1 text-sm text-slate-700">{supplier.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Coins className="h-4 w-4 text-teal-500" />
                Khối tài chính &amp; tổng hợp công nợ
              </p>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng dư nợ hiện tại</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(supplier.debtBalance)}</p>
              </div>
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Lịch sử giao dịch thuê/mua ngoài</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải lịch sử giao dịch...
                </div>
              ) : loadError ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {loadError}
                </div>
              ) : transactions.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">Chưa có giao dịch nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2">Mã Giao Dịch</th>
                        <th className="px-3 py-2">Nội Dung</th>
                        <th className="px-3 py-2">Loại</th>
                        <th className="px-3 py-2">Ngày Tạo</th>
                        <th className="px-3 py-2">Giá Trị</th>
                        <th className="px-3 py-2">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((t) => (
                        <tr key={t.transactionId}>
                          <td className="px-3 py-3 font-semibold text-blue-600">{t.transactionCode}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-800">{t.serviceTitle}</p>
                            {t.orderCode && <p className="text-xs text-slate-400">Đơn: {t.orderCode}</p>}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{SUPPLIER_TRANSACTION_TYPE_META[t.transactionType].label}</td>
                          <td className="px-3 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                          <td className="px-3 py-3 font-bold text-slate-900">{formatCurrency(t.estimatedCost)}</td>
                          <td className="px-3 py-3">
                            <Badge variant={SUPPLIER_TRANSACTION_STATUS_META[t.status].variant}>
                              {SUPPLIER_TRANSACTION_STATUS_META[t.status].label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Package className="h-4 w-4 text-slate-500" />
              Danh mục hạng mục &amp; giá thiết bị cung cấp
            </p>
            <p className="mt-2 text-sm text-slate-400">Chưa cập nhật hạng mục cung cấp.</p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <Button onClick={onClose}>Đóng hồ sơ</Button>
        </div>
      </div>
    </div>
  );
}

export default SupplierProfileModal;
