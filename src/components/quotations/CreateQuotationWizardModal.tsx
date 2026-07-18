'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { AdminQuotationLineItem, addAdminQuotation, nextAdminQuotationCode } from '@/mocks/db/quotations';
import { AdminCustomer, addAdminCustomer, getAdminCustomers, nextAdminCustomerId } from '@/mocks/db/customers';
import { MOCK_ITEMS } from '@/mocks/db/catalog';
import type { Item } from '@/types/catalog';

// Popup "Tạo báo giá mới" — port từ trang thuần giao diện cũ src/app/admin/quotations/new/page.tsx
// (đã bỏ, xem giải thích ở đầu src/mocks/adminQuotationsMock.ts) sang dạng modal theo yêu cầu người
// dùng thay vì điều hướng sang trang riêng. Quy trình 3 bước (chọn khách hàng → hạng mục → tổng kết)
// giữ nguyên logic cũ, chỉ đổi phần lưu từ router.push() thành gọi callback onSaved().

const STEPS = [
  { step: 1, label: 'Chọn khách hàng' },
  { step: 2, label: 'Danh sách hạng mục' },
  { step: 3, label: 'Tổng kết & Lưu' },
] as const;

interface DraftLineItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

function emptyDraftItem(): DraftLineItem {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    category: '',
    unit: 'Cái',
    quantity: '1',
    unitPrice: '',
    discount: '0',
  };
}

function draftItemFromCatalog(catalogItem: Item): DraftLineItem {
  return {
    id: `row-${Date.now()}-${catalogItem.itemId}`,
    name: catalogItem.itemName,
    category: catalogItem.typeName ?? '',
    unit: catalogItem.unit,
    quantity: '1',
    unitPrice: String(catalogItem.rentalPrice),
    discount: '0',
  };
}

const CATALOG_ITEMS = MOCK_ITEMS.filter((item) => item.status === 'ACTIVE');

// Nhóm theo `typeName` (= tên danh mục thiết bị, xem db/catalog.ts) để hiện dạng thu gọn theo mục
// thay vì liệt kê phẳng toàn bộ 71 item cùng lúc.
const CATALOG_ITEMS_BY_CATEGORY: { category: string; items: Item[] }[] = Array.from(
  CATALOG_ITEMS.reduce((map, item) => {
    const category = item.typeName ?? 'Khác';
    const bucket = map.get(category) ?? [];
    bucket.push(item);
    map.set(category, bucket);
    return map;
  }, new Map<string, Item[]>()),
).map(([category, items]) => ({ category, items }));

const cellInputClassName =
  'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

function ItemNameSearchInput({
  value,
  onChange,
  onPick,
}: Readonly<{ value: string; onChange: (v: string) => void; onPick: (item: Item) => void }>) {
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return [];
    return CATALOG_ITEMS.filter((it) => it.itemName.toLowerCase().includes(term)).slice(0, 6);
  }, [value]);

  return (
    <div className="relative min-w-[180px]">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Tìm trong kho hoặc nhập tên..."
        className={`${cellInputClassName} pl-7`}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {suggestions.map((it) => (
            <li key={it.itemId}>
              <button
                type="button"
                onMouseDown={() => onPick(it)}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-blue-50"
              >
                <span className="truncate">{it.itemName}</span>
                <span className="flex-shrink-0 text-xs text-slate-400">{formatCurrency(it.rentalPrice)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CreateQuotationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CreateQuotationWizardModal({ isOpen, onClose, onSaved }: Readonly<CreateQuotationWizardModalProps>) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => getAdminCustomers());
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId) ?? null;
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const resetState = () => {
    setStep(1);
    setSelectedCustomerId('');
    setItems([]);
    setCatalogSearch('');
    setOpenCategories(new Set());
  };

  const toggleCategory = (category: string) =>
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const catalogGroups = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase();
    if (!term) return CATALOG_ITEMS_BY_CATEGORY;
    return CATALOG_ITEMS_BY_CATEGORY.map((group) => ({
      category: group.category,
      items: group.items.filter((it) => it.itemName.toLowerCase().includes(term)),
    })).filter((group) => group.items.length > 0);
  }, [catalogSearch]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddCustomer = (values: Omit<AdminCustomer, 'customerId' | 'totalBookings' | 'totalSpent'>) => {
    const newCustomer: AdminCustomer = { customerId: nextAdminCustomerId(), totalBookings: 0, totalSpent: 0, ...values };
    addAdminCustomer(newCustomer);
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomerId(newCustomer.customerId);
    setIsAddCustomerOpen(false);
  };

  const addCatalogItem = (catalogItem: Item) => setItems((prev) => [...prev, draftItemFromCatalog(catalogItem)]);
  const addManualItem = () => setItems((prev) => [...prev, emptyDraftItem()]);
  const updateItem = (id: string, patch: Partial<DraftLineItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const pickCatalogForRow = (id: string, catalogItem: Item) =>
    updateItem(id, {
      name: catalogItem.itemName,
      category: catalogItem.typeName ?? '',
      unit: catalogItem.unit,
      unitPrice: String(catalogItem.rentalPrice),
    });

  const subtotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const totalDiscount = items.reduce((sum, it) => sum + (Number(it.discount) || 0) * (Number(it.quantity) || 0), 0);
  const grandTotal = subtotal - totalDiscount;

  const handleSave = () => {
    if (!selectedCustomer) return;
    const cleanItems: AdminQuotationLineItem[] = items
      .filter((it) => it.name.trim())
      .map((it) => ({
        id: it.id,
        name: it.name.trim(),
        category: it.category.trim() || 'Khác',
        unit: it.unit.trim() || 'Cái',
        unitPrice: Number(it.unitPrice) || 0,
        quantity: Number(it.quantity) || 1,
        discount: Number(it.discount) || 0,
      }));
    const finalSubtotal = cleanItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const finalDiscount = cleanItems.reduce((sum, it) => sum + (it.discount ?? 0) * it.quantity, 0);
    const today = new Date();

    addAdminQuotation({
      quotationId: `bg-${Date.now()}`,
      code: nextAdminQuotationCode(),
      version: 1,
      servicePackage: `Báo giá dịch vụ sự kiện - ${selectedCustomer.customerName}`,
      customerId: selectedCustomer.customerId,
      customerName: selectedCustomer.customerName,
      customerPhone: selectedCustomer.phone,
      guestCount: 0,
      tablePrice: 0,
      items: cleanItems,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      totalAmount: finalSubtotal - finalDiscount,
      status: 'draft',
      assignee: 'Lê Minh Dũng',
      createdAt: today.toISOString().slice(0, 10),
      updatedAt: today.toISOString().slice(0, 10),
      validUntil: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });

    resetState();
    onSaved();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo báo giá mới" subtitle="Quy trình soạn thảo báo giá kinh doanh theo từng bước rõ ràng." size="2xl">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex w-max items-center gap-2">
          {STEPS.map((s, index) => (
            <div key={s.step} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step === s.step ? 'bg-blue-600 text-white' : step > s.step ? 'bg-blue-100 text-blue-600' : 'border border-slate-200 text-slate-400'
                  }`}
                >
                  {s.step}
                </span>
                <span className={`whitespace-nowrap text-sm font-medium ${step >= s.step ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {index < STEPS.length - 1 && <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-slate-900">Bước 1: Chọn khách hàng lập báo giá</h2>
            <p className="mt-1 text-sm text-slate-500">Báo giá bắt buộc phải gắn liền với một khách hàng có trên hệ thống.</p>

            <div className="mt-5">
              <SearchableSelect
                label="Lựa chọn khách hàng có sẵn"
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                placeholder="-- Chọn khách hàng --"
                searchPlaceholder="Tìm theo tên, mã khách hàng hoặc số điện thoại..."
                emptyText="Không tìm thấy khách hàng phù hợp."
                options={customers.map((c) => ({ value: c.customerId, label: `${c.customerName} (${c.customerId} - ${c.phone})` }))}
              />

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hoặc</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Button variant="secondary" className="w-full" onClick={() => setIsAddCustomerOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm nhanh khách hàng mới
              </Button>

              {selectedCustomer && (
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Khách hàng được chọn:</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <p className="text-slate-600">
                      Tên: <span className="font-semibold text-slate-900">{selectedCustomer.customerName}</span>
                    </p>
                    <p className="text-slate-600">
                      SĐT: <span className="font-semibold text-slate-900">{selectedCustomer.phone}</span>
                    </p>
                    <p className="text-slate-600">
                      Hòm thư: <span className="font-semibold text-slate-900">{selectedCustomer.email || '—'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <Button disabled={!selectedCustomer} onClick={() => setStep(2)}>
                Tiếp tục
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-base font-bold text-slate-900">Bước 2: Chi tiết các hạng mục thiết bị/dịch vụ</h2>
            <p className="mt-1 text-sm text-slate-500">Thêm trang thiết bị loa, đài, đèn sân khấu, màn LED hoặc nhân sự MC, ca sĩ.</p>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold text-slate-500">Chọn nhanh từ danh mục kho thiết bị có sẵn:</p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Tìm thiết bị theo tên..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {catalogGroups.map((group) => {
                  const isOpen = catalogSearch.trim() !== '' || openCategories.has(group.category);
                  return (
                    <div key={group.category} className="rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => toggleCategory(group.category)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <span>
                          {group.category} <span className="font-normal text-slate-400">({group.items.length})</span>
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
                          {group.items.map((catalogItem) => (
                            <button
                              key={catalogItem.itemId}
                              type="button"
                              onClick={() => addCatalogItem(catalogItem)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {catalogItem.itemName} ({formatCurrency(catalogItem.rentalPrice)})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {catalogGroups.length === 0 && (
                  <p className="rounded-lg bg-white py-3 text-center text-xs italic text-slate-400">Không tìm thấy thiết bị phù hợp.</p>
                )}
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tên hạng mục *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Phân loại</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">ĐVT</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">SL</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Đơn giá (đ)</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Giảm giá/item</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Thành tiền</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                        Chưa có hạng mục nào — chọn nhanh từ kho hoặc thêm dòng nhập tay.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const lineTotal = ((Number(item.unitPrice) || 0) - (Number(item.discount) || 0)) * (Number(item.quantity) || 0);
                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2 align-top">
                            <ItemNameSearchInput
                              value={item.name}
                              onChange={(v) => updateItem(item.id, { name: v })}
                              onPick={(catalogItem) => pickCatalogForRow(item.id, catalogItem)}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              value={item.category}
                              onChange={(e) => updateItem(item.id, { category: e.target.value })}
                              className={`${cellInputClassName} w-32`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} className={`${cellInputClassName} w-16`} />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                              className={`${cellInputClassName} w-16 text-right`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                              className={`${cellInputClassName} w-28 text-right`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, { discount: e.target.value })}
                              className={`${cellInputClassName} w-24 text-right text-red-600`}
                            />
                          </td>
                          <td className="px-3 py-2 text-right align-top font-semibold text-slate-900">{formatCurrency(lineTotal)}</td>
                          <td className="px-3 py-2 text-right align-top">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label="Xóa hạng mục"
                              className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Button variant="secondary" className="mt-3" onClick={addManualItem}>
              <Plus className="h-4 w-4" />
              Thêm dòng nhập tay
            </Button>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Giảm giá:</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-base">
                  <span className="font-semibold text-slate-800">Thực tế:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t border-slate-100 pt-5">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <Button disabled={items.length === 0} onClick={() => setStep(3)}>
                Tiếp tục
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedCustomer && (
          <div>
            <h2 className="text-base font-bold text-slate-900">Bước 3: Tổng quan & Lưu hoàn tất báo giá</h2>
            <p className="mt-1 text-sm text-slate-500">Kiểm tra thông số kỹ thuật, khách hàng liên đới và lưu trữ văn bản chính thức.</p>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-400">Họ tên khách:</p>
                  <p className="font-semibold text-slate-800">{selectedCustomer.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Số điện thoại:</p>
                  <p className="font-semibold text-slate-800">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Địa chỉ liên lạc:</p>
                  <p className="font-semibold text-slate-800">{selectedCustomer.address || '—'}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thống kê tài chính</p>
                <div className="mt-2 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Tổng dịch vụ:</p>
                    <p className="mt-0.5 font-bold text-slate-900">{formatCurrency(subtotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Khấu trừ giảm giá:</p>
                    <p className="mt-0.5 font-bold text-red-500">-{formatCurrency(totalDiscount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Tổng cộng thanh toán:</p>
                    <p className="mt-0.5 font-bold text-blue-600">{formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t border-slate-100 pt-5">
              <Button variant="secondary" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <Button onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} onSubmit={handleAddCustomer} />
    </Modal>
  );
}
