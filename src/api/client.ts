/**
 * API Client Configuration
 * Ported from happi-app-customer/src/utils/util.request.js
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/userStore';

// Environment configuration - matches happi-app-customer/src/config/index.js
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.happi.com.my';
const IMG_BASE_URL = process.env.EXPO_PUBLIC_IMG_BASE_URL || 'https://cdn.happi.com.my';
const APP_KEY = 'happi-customer';
const VERSION_CODE = '126.01.23';
const DEFAULT_LOCALE_CODE = 'en';
const USER_LOGIN_ROLE = 1;

export const Config = {
  API_BASE_URL,
  IMG_BASE_URL,
  APP_KEY,
  VERSION_CODE,
  DEFAULT_LOCALE_CODE,
  USER_LOGIN_ROLE,
};

// Storage keys
export const StorageKeys = {
  AUTH_TOKEN: `${APP_KEY}-token`,
  USER_DATA: `${APP_KEY}-user`,
  REFRESH_TOKEN: `${APP_KEY}-refresh-token`,
  AGREED_PRIVACY: `${APP_KEY}-agreed`,
  LANGUAGE: `${APP_KEY}-language`,
  PINIA_STATE: `${APP_KEY}-pinia`,
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - matches Vue app's request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from userStore (like Vue app) instead of AsyncStorage
    const token = useUserStore.getState().token;
    
    if (token) {
      config.headers.Authorization = token;
      console.log(`🔑 [HTTP] Using token from store:`, token.substring(0, 50) + '...');
    } else {
      console.log(`⚠️ [HTTP] No token in store`);
    }
    
    // Add timestamp to prevent caching for GET requests
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        _t: Math.floor(Date.now() / 1000),
        ...config.params,
      };
    }
    
    console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
    
    return config;
  },
  (error) => {
    console.error('[HTTP Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - matches Vue app's response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[HTTP Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    
    // Handle 401 unauthorized
    if (response.data.code === 401) {
      // Public endpoints that shouldn't redirect
      const publicEndpoints = [
        '/v1/membership/app/list',
        '/v1/membership/app/info/',
        '/v1/policy/app/list',
        '/v1/policy/app/info/',
        '/v1/product/app/company/list/',
        '/v1/product/app/list/',
        '/v1/product/app/category/list',
        'v1/misc/app/list',
      ];
      
      const isPublicEndpoint = publicEndpoints.some(
        (endpoint) => response.config.url?.includes(endpoint)
      );
      
      if (!isPublicEndpoint) {
        // Clear storage and trigger logout
        AsyncStorage.multiRemove([
          StorageKeys.AUTH_TOKEN,
          StorageKeys.USER_DATA,
          StorageKeys.REFRESH_TOKEN,
        ]);
        // Navigation to login will be handled by the auth store
      }
    }
    
    // Transform response to standard format
    const transformedResponse = {
      success: response.data.success || response.data.code === 200,
      code: response.data.code,
      msg: response.data.msg || response.data.message,
      message: response.data.msg || response.data.message,
      data: response.data.data,
    };
    
    console.log('[HTTP Transformed Response]', transformedResponse);
    
    // Return transformed response
    return transformedResponse;
  },
  (error) => {
    console.error(`[HTTP Error]`, error);
    
    // Show network error
    if (error.message === 'Network Error') {
      // Toast will be handled in the calling component
    }
    
    return Promise.reject(error);
  }
);

// HTTP request helper - matches Vue app's httpRequest function
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: any;
  query?: any;
}

// API Response type - matches Vue app's response structure
export interface ApiResponse<T = any> {
  success: boolean;
  code?: number;
  msg?: string;
  message?: string;
  data: T;
}

export const httpRequest = async <T = any>(opts: RequestOptions): Promise<ApiResponse<T>> => {
  const { method, url, data, params, query } = opts;
  
  const config: AxiosRequestConfig = {
    method,
    url,
    params: params || query,
    data,
  };
  
  return apiClient.request<any, ApiResponse<T>>(config);
};

// Helper to get OSS image URL - matches Vue app's $getOssImg
export const getOssImg = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${IMG_BASE_URL}/${path}`;
};

export default apiClient;
