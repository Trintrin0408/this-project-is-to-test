import api from './api';

export const reportApiService = {
  /** GET /api/v1/dashboard/admin */
  async getAdminDashboard() {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  /** GET /api/v1/dashboard/manager */
  async getManagerDashboard() {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  /** GET /api/v1/reports/revenue — startDate/endDate bắt buộc */
  async getRevenueReport(params: { startDate: string; endDate: string }) {
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  },

  /** GET /api/v1/reports/inventory */
  async getInventoryReport(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  /** GET /api/v1/reports/verification?orderId= */
  async getOperationalVerification(orderId: string) {
    const response = await api.get('/reports/verification', { params: { orderId } });
    return response.data;
  },

  /** GET /api/v1/manager/approvals */
  async getManagerApprovals() {
    const response = await api.get('/manager/approvals');
    return response.data;
  },
};
