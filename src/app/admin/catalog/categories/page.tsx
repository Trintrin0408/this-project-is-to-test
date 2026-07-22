'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Eye, Pencil, Plus, RotateCw, ChevronRight, ChevronDown, CornerDownRight, ArrowLeft } from 'lucide-react';
import { catalogApiService } from '@/services/catalog.service';
import { Table, TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryFormModal, CategoryFormValues } from '@/components/catalog/CategoryFormModal';
import { ItemTypeFormModal, ItemTypeFormValues } from '@/components/catalog/ItemTypeFormModal';
import Reveal from '@/components/ui/Reveal';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import type { ItemCategory, ItemType } from '@/types/catalog';

type TreeRow =
  | { type: 'category'; data: ItemCategory }
  | { type: 'itemType'; data: ItemType };

export default function Page() {
  const router = useRouter();
  const { can } = usePermission();
  const canManage = can('master-data:manage');

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [types, setTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { pagination, setPage, updatePagination } = usePagination(10);

  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; category: ItemCategory | null } | null>(null);
  const [typeFormModal, setTypeFormModal] = useState<{ mode: 'create' | 'edit'; type: ItemType | null; defaultCategoryId?: string } | null>(null);
  
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [refreshToken, setRefreshToken] = useState(0);
  const refetchData = () => setRefreshToken((t) => t + 1);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      catalogApiService.getCategories({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
      }),
      catalogApiService.getTypes({ limit: 1000 })
    ])
      .then(([catRes, typeRes]) => {
        setCategories(catRes.data);
        setTypes(typeRes.data);
        updatePagination({
          totalItems: catRes.meta.totalCount,
          totalPages: Math.max(1, Math.ceil(catRes.meta.totalCount / catRes.meta.limit)),
        });
      })
      .catch((err) => {
        console.error('Failed to fetch data', err);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.limit, debouncedSearch, refreshToken]);

  const toggleExpand = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleCreateCategorySubmit = async (values: CategoryFormValues) => {
    setIsSubmittingForm(true);
    setFormError('');
    try {
      await catalogApiService.createCategory(values);
      setFormModal(null);
      refetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Tạo danh mục thất bại'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleEditCategorySubmit = async (values: CategoryFormValues, category: ItemCategory) => {
    setIsSubmittingForm(true);
    setFormError('');
    try {
      await catalogApiService.updateCategory(category.categoryId, values);
      setFormModal(null);
      refetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Cập nhật danh mục thất bại'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCreateTypeSubmit = async (values: ItemTypeFormValues) => {
    setIsSubmittingForm(true);
    setFormError('');
    try {
      await catalogApiService.createType(values);
      setTypeFormModal(null);
      setExpandedIds(prev => new Set(prev).add(values.categoryId)); // Tự động mở rộng danh mục vừa thêm
      refetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Tạo nhóm sản phẩm thất bại'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleEditTypeSubmit = async (values: ItemTypeFormValues, typeId: string) => {
    setIsSubmittingForm(true);
    setFormError('');
    try {
      await catalogApiService.updateType(typeId, values);
      setTypeFormModal(null);
      setExpandedIds(prev => new Set(prev).add(values.categoryId));
      refetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Cập nhật nhóm sản phẩm thất bại'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const rows: TreeRow[] = [];
  categories.forEach(cat => {
    rows.push({ type: 'category', data: cat });
    if (expandedIds.has(cat.categoryId)) {
      const children = types.filter(t => t.categoryId === cat.categoryId);
      children.forEach(child => rows.push({ type: 'itemType', data: child }));
    }
  });

  const columns: TableColumn<TreeRow>[] = [
    {
      key: 'name',
      label: 'Tên danh mục / Nhóm sản phẩm',
      render: (row) => {
        if (row.type === 'category') {
           const isExpanded = expandedIds.has(row.data.categoryId);
           const typeCount = types.filter(t => t.categoryId === row.data.categoryId).length;
           return (
             <div 
               className="flex items-center gap-2 cursor-pointer group" 
               onClick={() => toggleExpand(row.data.categoryId)}
             >
               <button type="button" className="text-slate-400 group-hover:text-slate-600 focus:outline-none transition-transform">
                 {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
               </button>
               <div>
                 <p className="font-semibold text-slate-900">
                   {row.data.categoryName}
                   <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                     {typeCount} nhóm
                   </span>
                 </p>
                 {row.data.description && <p className="text-xs text-slate-400 font-normal">{row.data.description}</p>}
               </div>
             </div>
           );
        } else {
           return (
             <div className="flex items-center gap-2 pl-6">
               <CornerDownRight className="h-4 w-4 text-slate-300" />
               <div>
                 <p className="font-medium text-slate-700">{row.data.typeName}</p>
                 {row.data.description && <p className="text-xs text-slate-400">{row.data.description}</p>}
               </div>
             </div>
           );
        }
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'w-[120px]',
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Xem chi tiết (Chỉ có ở category hiện tại) */}
          {row.type === 'category' && (
            <Link
              href={`/admin/catalog/categories/${row.data.categoryId}`}
              aria-label="Xem chi tiết"
              title="Xem chi tiết"
              className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}

          {canManage && (
            <>
              <button
                type="button"
                aria-label="Chỉnh sửa"
                title="Chỉnh sửa"
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.type === 'category') setFormModal({ mode: 'edit', category: row.data });
                  else setTypeFormModal({ mode: 'edit', type: row.data });
                }}
                className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
              >
                <Pencil className="h-4 w-4" />
              </button>

              {row.type === 'category' && (
                <button
                  type="button"
                  aria-label="Thêm nhóm con"
                  title="Thêm nhóm sản phẩm vào danh mục này"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTypeFormModal({ mode: 'create', type: null, defaultCategoryId: row.data.categoryId });
                  }}
                  className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Quay lại"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Quản lý danh mục & nhóm thiết bị</h1>
            <p className="mt-1 text-sm text-slate-500">Giao diện phân cấp giúp bạn dễ dàng quản lý Nhóm sản phẩm theo từng Danh mục cha.</p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setTypeFormModal({ mode: 'create', type: null })}>
              <Plus className="h-4 w-4" />
              Tạo nhóm SP
            </Button>
            <Button onClick={() => setFormModal({ mode: 'create', category: null })}>
              <Plus className="h-4 w-4" />
              Tạo danh mục
            </Button>
          </div>
        )}
      </div>

      <Reveal className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Tìm theo tên danh mục..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Làm mới"
            title="Làm mới"
            onClick={refetchData}
            className="rounded-md border border-gray-300 bg-white p-2 text-slate-500 hover:bg-slate-50"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <Table columns={columns} rows={rows} rowKey={(row) => row.type === 'category' ? `cat-${row.data.categoryId}` : `type-${row.data.typeId}`} isLoading={isLoading} />
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Reveal>

      <CategoryFormModal
        isOpen={!!formModal}
        mode={formModal?.mode ?? 'create'}
        category={formModal?.category}
        isSubmitting={isSubmittingForm}
        errorMessage={formError}
        onClose={() => {
          setFormModal(null);
          setFormError('');
        }}
        onSubmit={(values) => {
          if (formModal?.mode === 'edit' && formModal.category) {
            handleEditCategorySubmit(values, formModal.category);
          } else {
            handleCreateCategorySubmit(values);
          }
        }}
      />

      {!!typeFormModal && (
        <ItemTypeFormModal
          isOpen={!!typeFormModal}
          mode={typeFormModal.mode}
          type={typeFormModal.type}
          defaultCategoryId={typeFormModal.defaultCategoryId}
          categories={categories}
          isSubmitting={isSubmittingForm}
          errorMessage={formError}
          onClose={() => {
            setTypeFormModal(null);
            setFormError('');
          }}
          onSubmit={(values) => {
            if (typeFormModal.mode === 'edit' && typeFormModal.type) {
              handleEditTypeSubmit(values, typeFormModal.type.typeId);
            } else {
              handleCreateTypeSubmit(values);
            }
          }}
        />
      )}
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
