import api from './api';
import type { ConfirmWagePayload, GetWagesSummaryQuery } from '@/types/wage';

export const wageApiService = {
  /** GET /api/v1/wages */
  async getWagesSummary(params?: GetWagesSummaryQuery) {
    const response = await api.get('/wages', { params });
    return response.data;
  },

  /** POST /api/v1/wages/:id/confirm */
  async confirmWage(id: string, payload?: ConfirmWagePayload) {
    const response = await api.post(`/wages/${id}/confirm`, payload ?? { status: 'CONFIRMED' });
    return response.data;
  },
};
