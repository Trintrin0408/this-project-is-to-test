'use client';

import { useState } from 'react';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export const usePagination = (initialLimit = 10) => {
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: initialLimit,
  });

  const setPage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const updatePagination = (data: Partial<PaginationState>) => {
    setPagination((prev) => ({ ...prev, ...data }));
  };

  return { pagination, setPage, updatePagination };
};
