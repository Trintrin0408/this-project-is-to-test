import React from 'react';
import { PaginationState } from '@/hooks/usePagination';

interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

// Trả về danh sách trang để hiển thị, dùng -1 làm dấu hiệu cho dấu "...".
function getPageItems(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...items].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const withEllipsis: number[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) withEllipsis.push(-1);
    withEllipsis.push(page);
  });
  return withEllipsis;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, totalItems } = pagination;

  if (totalPages <= 1) return null;

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-slate-500">
      <span>Tổng {totalItems} kết quả</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        {pageItems.map((page, i) =>
          page === -1 ? (
            <span key={`ellipsis-before-${pageItems[i + 1]}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                page === currentPage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default Pagination;
