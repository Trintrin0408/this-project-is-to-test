'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, Pencil, Trash2, Plus, FolderTree } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CatalogItemFormModal, CatalogItemFormValues } from '@/components/catalog/CatalogItemFormModal';
import { CatalogItemDetailModal } from '@/components/catalog/CatalogItemDetailModal';
import Reveal from '@/components/ui/Reveal';
import { catalogApiService } from '@/services/catalog.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { formatDate } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Item, ItemStatus, ItemType, ItemCategory } from '@/types/catalog';

const STATUS_LABEL: Record<ItemStatus, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  MAINTENANCE: 'Bảo trì',
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

export default function Page() {
  const { can } = usePermission();
  const canManage = can('master-data:manage');

  const [items, setItems] = useState<Item[]>([]);
  const [types, setTypes] = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { pagination, setPage, updatePagination } = usePagination(10);

  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; item: Item | null } | null>(null);
  const [formError, setFormError] = useState('');

  const [detailItem, setDetailItem] = useState<Item | null>(null);

  const typeIdToCategoryId = useMemo(() => {
    const map = new Map<string, string>();
    types.forEach((t) => map.set(t.typeId, t.categoryId));
    return map;
  }, [types]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, typesRes, catRes] = await Promise.all([
        catalogApiService.getItems(),
        catalogApiService.getTypes(),
        catalogApiService.getCategories(),
      ]);
      setItems(itemsRes.data ?? []);
      setTypes(typesRes.data ?? []);
      setCategories(catRes.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, not a render loop
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter && item.typeId !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (term && !(item.itemName.toLowerCase().includes(term) || item.itemId.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [items, debouncedSearch, typeFilter, statusFilter]);

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
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleCreateSubmit = async (values: CatalogItemFormValues) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await catalogApiService.createItem(values);
      await fetchData();
      setFormModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Có lỗi xảy ra khi tạo thiết bị'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: CatalogItemFormValues, item: Item) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await catalogApiService.updateItem(item.itemId, values);
      await fetchData();
      setFormModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật thiết bị'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Xóa sản phẩm "${item.itemName}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await catalogApiService.updateItemStatus(item.itemId, { status: 'INACTIVE' });
      await fetchData();
    } catch (error) {
      alert(getErrorMessage(error, 'Có lỗi xảy ra khi xóa thiết bị'));
    }
  };

  const columns: TableColumn<Item>[] = [
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
      render: (row) => {
        if (row.status === 'INACTIVE') return null;
        return (
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
        );
      },
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: '', label: 'Nhóm sản phẩm' }, ...types.map((t) => ({ value: t.typeId, label: t.typeName }))]}
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
          {(search || typeFilter || statusFilter) && (
            <Button type="button" variant="ghost" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          )}
        </div>

        <div className="mt-4">
          <Table columns={columns} rows={pageItems} rowKey={(row) => row.itemId} isLoading={isLoading} />
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Reveal>

      <CatalogItemFormModal
        isOpen={!!formModal}
        mode={formModal?.mode ?? 'create'}
        item={formModal?.item}
        types={types}
        isSubmitting={isSubmitting}
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

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}
