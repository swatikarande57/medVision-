import { apiClient } from './client';
import type { ApiResponse, PageResponse, PatientResponse, PatientRequest } from '../types/api';

export const patientApi = {
  async getPatients(page = 0, size = 20): Promise<PageResponse<PatientResponse>> {
    const res = await apiClient.get<ApiResponse<PageResponse<PatientResponse>>>('/patients', {
      params: { page, size, sort: 'createdAt,desc' },
    });
    return res.data.data;
  },

  async getPatientById(id: number): Promise<PatientResponse> {
    const res = await apiClient.get<ApiResponse<PatientResponse>>(`/patients/${id}`);
    return res.data.data;
  },

  async searchPatient(query: string): Promise<PatientResponse> {
    const res = await apiClient.get<ApiResponse<PatientResponse>>('/patients/search', {
      params: { query },
    });
    return res.data.data;
  },

  async createPatient(data: PatientRequest): Promise<PatientResponse> {
    const res = await apiClient.post<ApiResponse<PatientResponse>>('/patients', data);
    return res.data.data;
  },

  async updatePatient(id: number, data: PatientRequest): Promise<PatientResponse> {
    const res = await apiClient.put<ApiResponse<PatientResponse>>(`/patients/${id}`, data);
    return res.data.data;
  },

  async deletePatient(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  },
};
