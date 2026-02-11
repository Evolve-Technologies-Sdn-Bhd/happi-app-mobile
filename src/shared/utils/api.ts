/**
 * API Client
 * Axios instance with interceptors for auth and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AppConfig } from '../constants/config';
import { storage } from './storage';
import { StorageKeys } from '../constants/config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  timeout: AppConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.get(StorageKeys.AUTH_TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (AppConfig.enableLogs) {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📦 Request Data:', JSON.stringify(config.data, null, 2));
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (AppConfig.enableLogs) {
      console.log(`✅ [API Response] ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (AppConfig.enableLogs) {
      console.error(`❌ [API Error] ${originalRequest?.url}`, error.response?.status);
      console.error('Error Data:', error.response?.data);
    }
    
    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = await storage.get(StorageKeys.REFRESH_TOKEN);
      
      if (refreshToken && originalRequest) {
        try {
          // Attempt to refresh token
          const response = await axios.post(
            `${AppConfig.apiBaseUrl}/pub/customer/refresh-token`,
            { refreshToken }
          );
          
          const { token: newToken } = response.data.data;
          await storage.set(StorageKeys.AUTH_TOKEN, newToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          await storage.remove(StorageKeys.AUTH_TOKEN);
          await storage.remove(StorageKeys.REFRESH_TOKEN);
          await storage.remove(StorageKeys.USER_DATA);
          
          // Navigate to login - will be handled by auth state
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Helper Functions
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<T>>(url, { params }).then(res => res.data),
    
  post: <T>(url: string, data?: Record<string, unknown>) =>
    apiClient.post<ApiResponse<T>>(url, data).then(res => res.data),
    
  put: <T>(url: string, data?: Record<string, unknown>) =>
    apiClient.put<ApiResponse<T>>(url, data).then(res => res.data),
    
  patch: <T>(url: string, data?: Record<string, unknown>) =>
    apiClient.patch<ApiResponse<T>>(url, data).then(res => res.data),
    
  delete: <T>(url: string) =>
    apiClient.delete<ApiResponse<T>>(url).then(res => res.data),
    
  upload: <T>(url: string, formData: FormData) =>
    apiClient.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),
};

export default apiClient;
