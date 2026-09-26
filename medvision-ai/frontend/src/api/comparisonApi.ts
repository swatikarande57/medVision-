import { apiClient } from './client';
import type { ComparisonRequest, ComparisonResponse } from '../types/api';

export const comparisonApi = {
  /** POST /api/comparisons */
  async createComparison(request: ComparisonRequest): Promise<ComparisonResponse> {
    const response = await apiClient.post<ComparisonResponse>('/comparisons', request);
    return response.data;
  },

  /** GET /api/comparisons/patient/{patientId} */
  async getComparisonsByPatient(patientId: number): Promise<ComparisonResponse[]> {
    const response = await apiClient.get<ComparisonResponse[]>(`/comparisons/patient/${patientId}`);
    return response.data;
  },

  /** GET /api/comparisons/{id} */
  async getComparisonById(id: number): Promise<ComparisonResponse> {
    const response = await apiClient.get<ComparisonResponse>(`/comparisons/${id}`);
    return response.data;
  }
};
