'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { Package, User, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { orderApiService } from '@/services/order.service';
import { quotationApiService } from '@/services/quotation.service';
import CreateQuotationWizardModal from '@/components/quotations/CreateQuotationWizardModal';
import { EVENT_TYPES } from '@/constants/order-event-type';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Customer } from '@/types/customer';
import type { QuotationDetailApi, QuotationListItem } from '@/types/quotation';

// Nối API thật theo docs/taodondatlichtiecmoi_api.md mục 3 (Hướng A) — wire vào nút "Khởi tạo đơn đặt
// hàng" ở manager/orders/page.tsx và admin/orders_audit/page.tsx (2026-07-20). Component này đã đúng
// shape `CreateOrderPayload` từ trước (customerId/eventType/eventDate ISO/location/guestCount/items[]),
// chỉ còn thiếu ở lần nối trước là chưa được import ở đâu — không cần sửa logic tạo đơn.
//
// Cập nhật 2026-07-21 (theo yêu cầu người dùng): bỏ hẳn khối "Thêm hạng mục" tự do (chọn thẳng thiết bị
// trong kho, không qua báo giá) — SAI với luồng nghiệp vụ thật (Request → Survey → Quotation → Order,
// xem CLAUDE.md mục 1 "Vòng đời Order"), đơn hàng luôn phải bắt nguồn từ 1 báo giá đã duyệt. Đổi thành
// bắt buộc "Liên kết báo giá đã duyệt" (cùng pattern `linkableQuotations` ở
// `manager/orders/[id]/page.tsx`) hoặc "Tạo báo giá mới" (mở `CreateQuotationWizardModal` với khách
// hàng khóa cứng sẵn + tự động duyệt luôn, xem prop `presetCustomer`/`autoApprove` mới thêm ở đó) — sau
// khi có báo giá đã duyệt, `items` gửi lên `POST /orders` được suy ra từ `quotation.items` (gộp theo
// itemId, cùng công thức đã dùng ở `CreateOrderFromQuotationModal.tsx`), không còn nhập tay.

const EVENT_TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: t }));

interface CreateOrderModalProps {
  isOpen: boolean;
  customers: Customer[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOrderModal({ isOpen, customers, onClose, onCreated }: Readonly<CreateOrderModalProps>) {
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('');

  const [availableQuotations, setAvailableQuotations] = useState<QuotationListItem[]>([]);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [quotationDetail, setQuotationDetail] = useState<QuotationDetailApi | null>(null);
  const [isLoadingQuotationDetail, setIsLoadingQuotationDetail] = useState(false);
  const [isCreateQuotationOpen, setIsCreateQuotationOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerFieldRef = useRef<HTMLDivElement>(null);

  // Danh sách báo giá ĐÃ DUYỆT của khách hàng đã chọn, lọc bỏ báo giá nào đã liên kết Order khác — cùng
  // pattern `linkableQuotations` đã dùng ở `manager/orders/[id]/page.tsx` (endpoint list không trả sẵn
  // `linkedOrderId`, phải gọi thêm GET chi tiết từng báo giá để lọc).
  const loadAvailableQuotations = (forCustomerId: string) => {
    if (!forCustomerId) {
      setAvailableQuotations([]);
      return;
    }
    setIsLoadingQuotations(true);
    quotationApiService
      .getQuotations({ customerId: forCustomerId, status: 'approved' })
      .then((res) => {
        const candidates: QuotationListItem[] = res.data ?? [];
        return Promise.all(
          candidates.map((q) =>
            quotationApiService
              .getQuotation(q.quotationId)
              .then((r) => ({ item: q, linkedOrderId: (r.data?.linkedOrderId as string | null) ?? null }))
              .catch(() => ({ item: q, linkedOrderId: null as string | null })),
          ),
        );
      })
      .then((pairs) => setAvailableQuotations(pairs.filter((p) => !p.linkedOrderId).map((p) => p.item)))
      .catch(() => setAvailableQuotations([]))
      .finally(() => setIsLoadingQuotations(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedQuotationId('');
    setQuotationDetail(null);
    loadAvailableQuotations(customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customerId]);

  useEffect(() => {
    if (!selectedQuotationId) {
      setQuotationDetail(null);
      return;
    }
    setIsLoadingQuotationDetail(true);
    quotationApiService
      .getQuotation(selectedQuotationId)
      .then((res) => setQuotationDetail(res.data ?? null))
      .catch(() => setQuotationDetail(null))
      .finally(() => setIsLoadingQuotationDetail(false));
  }, [selectedQuotationId]);

  // Items gửi lên POST /orders được suy ra từ quotation.items — gộp theo itemId (1 báo giá có thể có
  // nhiều dòng cùng itemId), unitPrice = bình quân sau chiết khấu đã chốt. Cùng công thức đã dùng ở
  // `CreateOrderFromQuotationModal.tsx`.
  const derivedItems = useMemo(() => {
    if (!quotationDetail) return [];
    const grouped = new Map<string, { quantity: number; lineTotal: number }>();
    quotationDetail.items.forEach((qi) => {
      const acc = grouped.get(qi.itemId) ?? { quantity: 0, lineTotal: 0 };
      acc.quantity += qi.quantity;
      acc.lineTotal += qi.lineTotal;
      grouped.set(qi.itemId, acc);
    });
    return Array.from(grouped.entries()).map(([itemId, acc]) => ({
      itemId,
      quantity: acc.quantity,
      unitPrice: acc.quantity > 0 ? Math.round(acc.lineTotal / acc.quantity) : 0,
    }));
  }, [quotationDetail]);

  const filteredCustomers = useMemo(() => {
    const term = customerQuery.trim().toLowerCase();
    if (!term) return customers.slice(0, 8);
    return customers.filter((c) => c.customerName.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 8);
  }, [customers, customerQuery]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === customerId) ?? null,
    [customers, customerId],
  );

  useEffect(() => {
    if (!isCustomerDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (customerFieldRef.current && !customerFieldRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCustomerDropdownOpen]);

  const resetAndClose = () => {
    setCustomerQuery('');
    setCustomerId('');
    setIsCustomerDropdownOpen(false);
    setEventType('');
    setEventDate('');
    setLocation('');
    setGuestCount('');
    setSelectedQuotationId('');
    setQuotationDetail(null);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.customerId);
    setCustomerQuery(customer.customerName);
    setIsCustomerDropdownOpen(false);
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!customerId) next.customerId = 'Vui lòng chọn khách hàng';

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (!eventDate) {
      next.eventDate = 'Vui lòng chọn ngày tổ chức';
    } else if (eventDate <= todayStr) {
      next.eventDate = 'Ngày tổ chức phải sau ngày hôm nay';
    }

    if (!eventType) next.eventType = 'Vui lòng chọn loại sự kiện';
    if (!location.trim()) next.location = 'Vui lòng nhập địa điểm tổ chức';
    if (guestCount && Number(guestCount) < 1) next.guestCount = 'Số lượng khách phải lớn hơn 0';
    if (!selectedQuotationId) next.quotation = 'Vui lòng liên kết một báo giá đã duyệt hoặc tạo báo giá mới cho đơn hàng';
    else if (derivedItems.length === 0) next.quotation = 'Báo giá đã chọn chưa có hạng mục nào';

    return next;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await orderApiService.createOrder({
        customerId,
        quotationId: selectedQuotationId,
        eventType,
        eventDate: new Date(eventDate).toISOString(),
        location: location.trim(),
        ...(guestCount ? { guestCount: Number(guestCount) } : {}),
        items: derivedItems,
      });
      resetAndClose();
      onCreated();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setSubmitError(axiosError.response?.data?.message ?? 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Tạo đơn hàng mới"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Tạo đơn hàng
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Thông tin khách hàng</h3>
          </div>

          <div ref={customerFieldRef} className="relative">
            <Input
              label="Khách hàng"
              required
              error={errors.customerId}
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setCustomerId('');
                setIsCustomerDropdownOpen(true);
              }}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              placeholder="Gõ tên hoặc số điện thoại để tìm"
              autoComplete="off"
            />
            {isCustomerDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredCustomers.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy khách hàng</p>
                ) : (
                  <ul className="max-h-56 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <li key={c.customerId}>
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{c.customerName}</span>
                          <span className="text-xs text-gray-500">{c.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
              <span>
                <span className="text-slate-400">SĐT: </span>
                {selectedCustomer.phone}
              </span>
              <span>
                <span className="text-slate-400">Email: </span>
                {selectedCustomer.email || '—'}
              </span>
              <span>
                <span className="text-slate-400">Địa chỉ: </span>
                {selectedCustomer.address || '—'}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Thông tin đơn hàng</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Loại sự kiện"
              required
              error={errors.eventType}
              placeholder="Chọn loại sự kiện"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              options={EVENT_TYPE_OPTIONS}
            />
            <Input
              type="date"
              label="Ngày tổ chức"
              required
              value={eventDate}
              error={errors.eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              type="number"
              label="Số lượng khách"
              min={1}
              placeholder="VD: 200"
              value={guestCount}
              error={errors.guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Địa điểm tổ chức"
                required
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                value={location}
                error={errors.location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Báo giá cho đơn hàng</h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateQuotationOpen(true)} disabled={!selectedCustomer}>
              <Plus className="h-4 w-4" />
              Tạo báo giá mới
            </Button>
          </div>

          {!selectedCustomer ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              Chọn khách hàng trước để liên kết hoặc tạo báo giá.
            </div>
          ) : (
            <>
              <Select
                label="Liên kết báo giá đã duyệt"
                value={selectedQuotationId}
                onChange={(e) => setSelectedQuotationId(e.target.value)}
                placeholder={
                  isLoadingQuotations
                    ? 'Đang tải danh sách báo giá...'
                    : availableQuotations.length === 0
                      ? 'Khách hàng chưa có báo giá đã duyệt nào — bấm "Tạo báo giá mới"'
                      : '-- Chọn báo giá --'
                }
                disabled={isLoadingQuotations || availableQuotations.length === 0}
                options={availableQuotations.map((q) => ({ value: q.quotationId, label: `${q.code} · ${formatCurrency(q.totalAmount)}` }))}
              />

              {isLoadingQuotationDetail && <p className="mt-3 text-xs text-slate-400">Đang tải hạng mục báo giá...</p>}

              {quotationDetail && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Tên hạng mục</th>
                        <th className="px-3 py-2 text-center">SL</th>
                        <th className="px-3 py-2 text-right">Đơn giá</th>
                        <th className="px-3 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotationDetail.items.map((it) => (
                        <tr key={it.quotationItemId}>
                          <td className="px-3 py-2 font-medium text-slate-800">{it.itemName}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{it.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(it.price)}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(it.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end border-t border-slate-100 px-3 py-2 text-sm font-bold text-slate-900">
                    Tổng tiền: {formatCurrency(quotationDetail.totalAmount)}
                  </div>
                </div>
              )}
            </>
          )}
          {errors.quotation && <p className="mt-2 text-sm text-red-600">{errors.quotation}</p>}
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </div>

      <CreateQuotationWizardModal
        isOpen={isCreateQuotationOpen}
        presetCustomer={selectedCustomer ?? undefined}
        autoApprove
        onClose={() => setIsCreateQuotationOpen(false)}
        onSaved={(createdQuotationId) => {
          setIsCreateQuotationOpen(false);
          loadAvailableQuotations(customerId);
          if (createdQuotationId) setSelectedQuotationId(createdQuotationId);
        }}
      />
    </Modal>
  );
}
