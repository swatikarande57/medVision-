import { apiClient } from './client';
import type { ApiResponse, ScanResponse } from '../types/api';

export const scanApi = {
  async getAllScans(): Promise<ScanResponse[]> {
    const res = await apiClient.get<ApiResponse<ScanResponse[]>>('/scans');
    return res.data.data;
  },

  async getScanById(id: number): Promise<ScanResponse> {
    const res = await apiClient.get<ApiResponse<ScanResponse>>(`/scans/${id}`);
    return res.data.data;
  },

  async getScansByPatient(patientId: number): Promise<ScanResponse[]> {
    const res = await apiClient.get<ApiResponse<ScanResponse[]>>(`/scans/patient/${patientId}`);
    return res.data.data;
  },

  async uploadScan(
    patientId: number,
    file: File,
    modality?: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<ScanResponse> {
    const formData = new FormData();
    formData.append('patientId', String(patientId));
    formData.append('file', file);
    if (modality) formData.append('modality', modality);

    const res = await apiClient.post<ApiResponse<ScanResponse>>('/scans/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return res.data.data;
  },

  async deleteScan(id: number): Promise<void> {
    await apiClient.delete(`/scans/${id}`);
  },
};
