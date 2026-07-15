import api from './api';
import type { CreatePolicyPayload, GetPoliciesQuery, UpdatePolicyPayload } from '@/types/policy';

export const policyApiService = {
  /** GET /api/v1/policies */
  async getPolicies(params?: GetPoliciesQuery) {
    const response = await api.get('/policies', { params });
    return response.data;
  },

  /** POST /api/v1/policies */
  async createPolicy(payload: CreatePolicyPayload) {
    const response = await api.post('/policies', payload);
    return response.data;
  },

  /** PUT /api/v1/policies/:id */
  async updatePolicy(id: string, payload: UpdatePolicyPayload) {
    const response = await api.put(`/policies/${id}`, payload);
    return response.data;
  },
};
