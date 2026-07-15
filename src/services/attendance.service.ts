import api from './api';
import type { CheckInPayload, CheckOutPayload } from '@/types/attendance';

export const attendanceApiService = {
  /** POST /api/v1/attendance/check-in */
  async checkIn(payload: CheckInPayload) {
    const response = await api.post('/attendance/check-in', payload);
    return response.data;
  },

  /** PUT /api/v1/attendance/:id/check-out */
  async checkOut(attendanceId: string, payload: CheckOutPayload) {
    const response = await api.put(`/attendance/${attendanceId}/check-out`, payload);
    return response.data;
  },
};
