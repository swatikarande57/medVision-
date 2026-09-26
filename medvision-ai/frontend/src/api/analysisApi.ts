import { apiClient } from './client';
import type { ApiResponse, AnalysisResponse, JobResponse } from '../types/api';

export const analysisApi = {
  async getAnalysisById(id: number): Promise<AnalysisResponse> {
    const res = await apiClient.get<ApiResponse<AnalysisResponse>>(`/analysis/${id}`);
    return res.data.data;
  },

  async getAnalysisByScan(scanId: number): Promise<AnalysisResponse> {
    const res = await apiClient.get<ApiResponse<AnalysisResponse>>(`/analysis/scan/${scanId}`);
    return res.data.data;
  },

  async getAnalysesByPatient(patientId: number): Promise<AnalysisResponse[]> {
    const res = await apiClient.get<ApiResponse<AnalysisResponse[]>>(`/analysis/patient/${patientId}`);
    return res.data.data;
  },

  async createAnalysisJob(scanId: number): Promise<JobResponse> {
    const res = await apiClient.post<ApiResponse<JobResponse>>('/analysis/jobs', { scanId });
    return res.data.data;
  },

  async getJobStatus(jobId: number): Promise<JobResponse> {
    const res = await apiClient.get<ApiResponse<JobResponse>>(`/analysis/jobs/${jobId}`);
    return res.data.data;
  },
};
