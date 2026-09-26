import { apiClient } from './client';
import type { ApiResponse, DashboardSummaryResponse } from '../types/api';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await apiClient.get<ApiResponse<DashboardSummaryResponse>>('/dashboard/summary');
    return response.data.data;
  },
};
