/**
 * Service API - Ported from happi-app-customer/src/api/service/index.js
 */
import { httpRequest } from './client';

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  sort: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  providerId?: string;
  price?: number;
  image?: string;
  phone?: string;
  status: number;
}

export interface ServiceListParams {
  categoryId?: string;
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface ServiceUsageData {
  serviceId: string;
  actionType?: string; // default: CALL_NOW
  providerId?: string;
  categoryId?: string;
}

/**
 * Get service category list
 */
export const getServiceCategoryList = (params?: Record<string, any>) => {
  return httpRequest<ServiceCategory[]>({
    method: 'GET',
    url: '/v1/service/app/category/list',
    params,
  });
};

/**
 * Get service list with pagination and filters
 */
export const getServiceList = (params: ServiceListParams) => {
  return httpRequest<{ list: Service[]; total: number }>({
    method: 'GET',
    url: '/v1/service/app/page',
    params,
  });
};

/**
 * Get service detail by ID
 */
export const getServiceDetail = (serviceId: string) => {
  return httpRequest<Service>({
    method: 'GET',
    url: `/v1/service/app/info/${serviceId}`,
  });
};

/**
 * Record service usage/click
 */
export const recordServiceUsage = (data: ServiceUsageData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/service/app/usage',
    data,
  });
};

export default {
  getServiceCategoryList,
  getServiceList,
  getServiceDetail,
  recordServiceUsage,
};
