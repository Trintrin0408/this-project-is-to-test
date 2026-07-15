import api from './api';

// ⚠️ Backend hiện là stub hoàn toàn — GET luôn trả rỗng, PUT không có tác dụng thật. Xem
// types/notification.ts + docs/more-require.md.
export const notificationApiService = {
  /** GET /api/v1/notifications */
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  /** PUT /api/v1/notifications/read-all */
  async readAllNotifications() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  /** PUT /api/v1/notifications/:id/read */
  async readNotification(id: string) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
};
