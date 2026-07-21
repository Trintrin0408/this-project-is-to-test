import api from './api';
import type { ConfirmSurveyReportPayload, CreateSurveyReportPayload, GetSurveyReportsQuery } from '@/types/survey';

export const surveyApiService = {
  /** GET /api/v1/survey-reports — danh sách toàn cục, join sẵn orderCode/customerName/eventName/reportedByName */
  async getSurveyReports(params?: GetSurveyReportsQuery) {
    const response = await api.get('/survey-reports', { params });
    return response.data;
  },

  /** GET /api/v1/orders/:orderId/survey-reports */
  async getOrderSurveyReports(orderId: string) {
    const response = await api.get(`/orders/${orderId}/survey-reports`);
    return response.data;
  },

  /** GET /api/v1/survey-reports/:id — kèm evidence + reportedByName/confirmedByName */
  async getSurveyReportById(id: string) {
    const response = await api.get(`/survey-reports/${id}`);
    return response.data;
  },

  /** POST /api/v1/survey-reports */
  async createSurveyReport(payload: CreateSurveyReportPayload) {
    const response = await api.post('/survey-reports', payload);
    return response.data;
  },

  /** PUT /api/v1/survey-reports/:id/confirm */
  async confirmSurveyReport(id: string, payload: ConfirmSurveyReportPayload) {
    const response = await api.put(`/survey-reports/${id}/confirm`, payload);
    return response.data;
  },
};
