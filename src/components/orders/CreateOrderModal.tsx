'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { Package, User, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { orderApiService } from '@/services/order.service';
import { catalogApiService } from '@/services/catalog.service';
import { EVENT_TYPES } from '@/constants/order-event-type';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Customer } from '@/types/customer';
import type { Item } from '@/types/catalog';

// Nối API thật theo docs/taodondatlichtiecmoi_api.md mục 3 (Hướng A) — wire vào nút "Khởi tạo đơn đặt
// hàng" ở manager/orders/page.tsx và admin/orders_audit/page.tsx (2026-07-20). Component này đã đúng
// shape `CreateOrderPayload` từ trước (customerId/eventType/eventDate ISO/location/guestCount/items[]),
// chỉ còn thiếu ở lần nối trước là chưa được import ở đâu — không cần sửa logic tạo đơn.

const EVENT_TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: t }));

interface OrderItemDraft {
  key: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
}

let draftKeySeq = 0;
function nextDraftKey(): string {
  draftKeySeq += 1;
  return `item-${draftKeySeq}`;
}

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

  const [itemList, setItemList] = useState<Item[]>([]);
  const [items, setItems] = useState<OrderItemDraft[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    catalogApiService
      .getItems({ limit: 200, status: 'ACTIVE' })
      .then((res) => setItemList(res.data ?? []))
      .catch(() => setItemList([]));
  }, [isOpen]);

  const itemById = useMemo(() => new Map(itemList.map((i) => [i.itemId, i])), [itemList]);
  const itemOptions = useMemo(
    () => itemList.map((i) => ({ value: i.itemId, label: `${i.itemName} (${formatCurrency(i.rentalPrice)})` })),
    [itemList],
  );

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
    setItems([]);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.customerId);
    setCustomerQuery(customer.customerName);
    setIsCustomerDropdownOpen(false);
  };

  const handleAddItem = () => {
    const first = itemList[0];
    setItems((prev) => [
      ...prev,
      { key: nextDraftKey(), itemId: first?.itemId ?? '', quantity: 1, unitPrice: first?.rentalPrice ?? 0 },
    ]);
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleItemChange = (key: string, itemId: string) => {
    const item = itemById.get(itemId);
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, itemId, unitPrice: item?.rentalPrice ?? row.unitPrice } : row)));
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, quantity } : item)));
  };

  const handleUnitPriceChange = (key: string, unitPrice: number) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, unitPrice } : item)));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

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
    if (items.length === 0) next.items = 'Vui lòng thêm ít nhất một hạng mục thiết bị/dịch vụ';
    if (items.some((item) => !item.itemId)) next.items = 'Vui lòng chọn thiết bị/dịch vụ cho tất cả các hạng mục';

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
        eventType,
        eventDate: new Date(eventDate).toISOString(),
        location: location.trim(),
        ...(guestCount ? { guestCount: Number(guestCount) } : {}),
        items: items.map((item) => ({ itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice })),
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
            <h3 className="text-sm font-semibold text-slate-900">Hạng mục thiết bị/dịch vụ</h3>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} disabled={itemList.length === 0}>
              <Plus className="h-4 w-4" />
              Thêm hạng mục
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              Chưa có hạng mục nào. Đơn hàng cần ít nhất 1 hạng mục thiết bị/dịch vụ.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                      <div className="sm:col-span-5">
                        <Select
                          label={`Hạng mục #${idx + 1}`}
                          value={item.itemId}
                          placeholder="-- Chọn thiết bị/dịch vụ --"
                          onChange={(e) => handleItemChange(item.key, e.target.value)}
                          options={itemOptions}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          label="Số lượng"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.key, Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          label="Đơn giá (đ)"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(item.key, Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                      <div className="sm:col-span-2 text-sm">
                        <span className="mb-1 block text-xs font-medium text-slate-500">Thành tiền</span>
                        <span className="font-bold text-slate-900">{formatCurrency(lineTotal)}</span>
                      </div>
                      <div className="flex justify-end sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.key)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Xóa hạng mục"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end text-sm font-bold text-slate-900">Tổng tiền: {formatCurrency(totalAmount)}</div>
            </div>
          )}
          {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </div>
    </Modal>
  );
}
