import api from './api';
import type { UploadEvidencePayload } from '@/types/evidence';

export const evidenceApiService = {
  /** POST /api/v1/evidence/upload — multipart/form-data */
  async uploadEvidence({ file, folder, description }: UploadEvidencePayload) {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    if (description) formData.append('description', description);
    const response = await api.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** GET /api/v1/evidence/:id */
  async getEvidenceById(id: string) {
    const response = await api.get(`/evidence/${id}`);
    return response.data;
  },
};
