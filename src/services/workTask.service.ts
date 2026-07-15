import api from './api';
import type { GetWorkTasksQuery } from '@/types/workTask';

export const workTaskApiService = {
  /** GET /api/v1/work-tasks — danh mục tĩnh, không có create/update/delete phía FE */
  async getWorkTasks(params?: GetWorkTasksQuery) {
    const response = await api.get('/work-tasks', { params });
    return response.data;
  },
};
