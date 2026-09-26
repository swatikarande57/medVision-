import { apiClient } from './client';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../types/api';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  async getMe(): Promise<UserResponse> {
    const res = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
    return res.data.data;
  },
};
