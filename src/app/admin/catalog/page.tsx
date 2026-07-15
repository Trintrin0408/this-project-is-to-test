'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, Pencil, Trash2, Plus, SlidersHorizontal, FolderTree } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CatalogItemFormModal, CatalogItemFormValues } from '@/components/catalog/CatalogItemFormModal';
import { CatalogItemDetailModal } from '@/components/catalog/CatalogItemDetailModal';
import Reveal from '@/components/ui/Reveal';
import { MOCK_CATEGORIES, MOCK_ITEMS, MOCK_TYPES } from '@/mocks/db/catalog';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { formatDate } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Item, ItemStatus } from '@/types/catalog';

const STATUS_LABEL: Record<ItemStatus, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  MAINTENANCE: 'Bảo trì',
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

let mockItemIdSeq = MOCK_ITEMS.length;
function nextMockItemId(): string {
  mockItemIdSeq += 1;
  return `SP${String(mockItemIdSeq).padStart(3, '0')}`;
}

// ⚠️ Backend hiện không gọi được (docs/more-require.md mục (jj)) — trang này tạm dùng dữ liệu ảo cố
// định ở src/mocks/catalogMocks.ts thay vì gọi catalogApiService. Tạo/sửa/xóa chỉ cập nhật state cục
// bộ (mất khi tải lại trang), không gọi API thật. Khôi phục lại catalogApiService khi backend hoạt
// động bình thường trở lại.
export default function Page() {
  const { can } = usePermission();
  const canManage = can('master-data:manage');

  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const types = MOCK_TYPES;
  const categories = MOCK_CATEGORIES;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('');

  const { pagination, setPage, updatePagination } = usePagination(10);

  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; item: Item | null } | null>(null);
  const [formError, setFormError] = useState('');

  const [detailItem, setDetailItem] = useState<Item | null>(null);

  const typeIdToCategoryId = useMemo(() => {
    const map = new Map<string, string>();
    types.forEach((t) => map.set(t.typeId, t.categoryId));
    return map;
  }, [types]);

  const filteredItems = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter && typeIdToCategoryId.get(item.typeId) !== categoryFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (priceFilter === 'under50k' && item.rentalPrice >= 50_000) return false;
      if (priceFilter === '50kTo300k' && (item.rentalPrice < 50_000 || item.rentalPrice > 300_000)) return false;
      if (priceFilter === 'above300k' && item.rentalPrice <= 300_000) return false;
      if (term && !(item.itemName.toLowerCase().includes(term) || item.itemId.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [items, debouncedSearch, categoryFilter, statusFilter, priceFilter, typeIdToCategoryId]);

  useEffect(() => {
    updatePagination({
      totalItems: filteredItems.length,
      totalPages: Math.max(1, Math.ceil(filteredItems.length / pagination.limit)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, pagination.limit]);

  const pageItems = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.limit;
    return filteredItems.slice(start, start + pagination.limit);
  }, [filteredItems, pagination.currentPage, pagination.limit]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPriceFilter('');
    setPage(1);
  };

  const handleCreateSubmit = (values: CatalogItemFormValues) => {
    const type = types.find((t) => t.typeId === values.typeId);
    const newItem: Item = {
      itemId: nextMockItemId(),
      itemCode: values.itemCode,
      itemName: values.itemName,
      typeId: values.typeId,
      typeName: type?.typeName,
      description: values.description,
      unit: values.unit,
      rentalPrice: values.rentalPrice,
      status: 'ACTIVE',
      inventory: { quantityTotal: 0, quantityAvailable: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    setFormModal(null);
    setFormError('');
  };

  const handleEditSubmit = (values: CatalogItemFormValues, item: Item) => {
    const type = types.find((t) => t.typeId === values.typeId);
    setItems((prev) =>
      prev.map((row) =>
        row.itemId === item.itemId
          ? {
              ...row,
              itemName: values.itemName,
              description: values.description,
              unit: values.unit,
              rentalPrice: values.rentalPrice,
              typeId: values.typeId,
              typeName: type?.typeName,
              updatedAt: new Date().toISOString(),
            }
          : row,
      ),
    );
    setFormModal(null);
    setFormError('');
  };

  const handleDelete = (item: Item) => {
    if (!window.confirm(`Xóa sản phẩm "${item.itemName}"? Hành động này không thể hoàn tác.`)) return;
    setItems((prev) => prev.filter((row) => row.itemId !== item.itemId));
  };

  const columns: TableColumn<Item>[] = [
    { key: 'itemId', label: 'ID', render: (row) => <span className="font-semibold text-slate-400">{row.itemId}</span> },
    {
      key: 'itemName',
      label: 'Sản phẩm',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailItem(row)}
          className="text-left font-semibold text-blue-600 hover:underline"
        >
          {row.itemName}
        </button>
      ),
    },
    { key: 'typeName', label: 'Nhóm sản phẩm', render: (row) => row.typeName ?? '—' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'rentalPrice', label: 'Giá thuê', render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.rentalPrice)}</span> },
    { key: 'updatedAt', label: 'Ngày cập nhật', render: (row) => <span className="text-slate-400">{formatDate(row.updatedAt ?? row.createdAt)}</span> },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            onClick={() => setDetailItem(row)}
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                aria-label="Chỉnh sửa"
                title="Chỉnh sửa"
                onClick={() => setFormModal({ mode: 'edit', item: row })}
                className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Xóa"
                title="Xóa"
                onClick={() => handleDelete(row)}
                className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Danh mục kho &amp; tài sản</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600">Sản phẩm &amp; thiết bị</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Sản phẩm &amp; thiết bị</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý danh sách sản phẩm và thiết bị cho thuê</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/catalog/categories" className="text-xs font-semibold text-slate-400 hover:text-blue-600">
            <span className="inline-flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Quản lý danh mục
            </span>
          </Link>
          {canManage && (
            <Button onClick={() => setFormModal({ mode: 'create', item: null })}>
              <Plus className="h-4 w-4" />
              Tạo sản phẩm
            </Button>
          )}
        </div>
      </div>

      <Reveal className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Tìm kiếm theo ID, tên sản phẩm..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-52">
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: '', label: 'Nhóm sản phẩm' }, ...categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))]}
            />
          </div>
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: '', label: 'Trạng thái' }, ...STATUS_OPTIONS]}
            />
          </div>
          <Button
            type="button"
            variant={showAdvancedFilters ? 'primary' : 'secondary'}
            onClick={() => setShowAdvancedFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </Button>
          {(search || categoryFilter || statusFilter || priceFilter) && (
            <Button type="button" variant="ghost" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-400">Giá thuê:</span>
            <div className="w-56">
              <Select
                value={priceFilter}
                onChange={(e) => {
                  setPriceFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Tất cả mức giá' },
                  { value: 'under50k', label: 'Dưới 50.000đ' },
                  { value: '50kTo300k', label: 'Từ 50.000đ - 300.000đ' },
                  { value: 'above300k', label: 'Trên 300.000đ' },
                ]}
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <Table columns={columns} rows={pageItems} rowKey={(row) => row.itemId} isLoading={false} />
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Reveal>

      <CatalogItemFormModal
        isOpen={!!formModal}
        mode={formModal?.mode ?? 'create'}
        item={formModal?.item}
        types={types}
        isSubmitting={false}
        errorMessage={formError}
        onClose={() => {
          setFormModal(null);
          setFormError('');
        }}
        onSubmit={(values) => {
          if (formModal?.mode === 'edit' && formModal.item) {
            handleEditSubmit(values, formModal.item);
          } else {
            handleCreateSubmit(values);
          }
        }}
      />

      <CatalogItemDetailModal isOpen={!!detailItem} item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
