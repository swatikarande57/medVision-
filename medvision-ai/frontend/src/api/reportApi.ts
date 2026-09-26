import { apiClient } from './client';
import type { ApiResponse, ReportResponse, ReportRequest } from '../types/api';

export const reportApi = {
  async getAllReports(): Promise<ReportResponse[]> {
    const res = await apiClient.get<ApiResponse<ReportResponse[]>>('/reports');
    return res.data.data;
  },

  async getReportById(id: number): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>(`/reports/${id}`);
    return res.data.data;
  },

  async getReportsByPatient(patientId: number): Promise<ReportResponse[]> {
    const res = await apiClient.get<ApiResponse<ReportResponse[]>>(`/reports/patient/${patientId}`);
    return res.data.data;
  },

  async getReportsByScan(scanId: number): Promise<ReportResponse[]> {
    const res = await apiClient.get<ApiResponse<ReportResponse[]>>(`/reports/scan/${scanId}`);
    return res.data.data;
  },

  async generateReport(data: ReportRequest): Promise<ReportResponse> {
    const res = await apiClient.post<ApiResponse<ReportResponse>>('/reports/generate', data);
    return res.data.data;
  },
};
