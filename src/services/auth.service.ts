import api from './api';
import type { RegisterDeviceTokenPayload, UpdateProfilePayload } from '@/types/auth';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordPayload {
  username: string;
}

export const authApiService = {
  /** POST /api/v1/auth/login */
  async login(payload: LoginPayload) {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  /** PUT /api/v1/auth/change-password */
  async changePassword(payload: ChangePasswordPayload) {
    const response = await api.put('/auth/change-password', payload);
    return response.data;
  },

  /** POST /api/v1/auth/forgot-password */
  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await api.post('/auth/forgot-password', payload);
    return response.data;
  },

  /** GET /api/v1/auth/profile */
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /** PUT /api/v1/auth/profile */
  async updateProfile(payload: UpdateProfilePayload) {
    const response = await api.put('/auth/profile', payload);
    return response.data;
  },

  /** POST /api/v1/auth/device-token */
  async registerDeviceToken(payload: RegisterDeviceTokenPayload) {
    const response = await api.post('/auth/device-token', payload);
    return response.data;
  },
};
