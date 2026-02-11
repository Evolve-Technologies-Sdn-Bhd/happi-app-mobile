/**
 * Merchant API - Ported from happi-app-customer/src/api/merchant/index.js
 */
import { httpRequest } from './client';

export interface Merchant {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: number;
}

export interface MerchantPageParams {
  page?: number;
  limit?: number;
  keyword?: string;
}

/**
 * Get all merchant list
 */
export const getMerchantList = () => {
  return httpRequest<Merchant[]>({
    method: 'GET',
    url: '/v1/merchant/app/list',
  });
};

/**
 * Get merchant page with pagination
 */
export const getMerchantPage = (params: MerchantPageParams) => {
  return httpRequest<{ list: Merchant[]; total: number }>({
    method: 'GET',
    url: '/v1/merchant/app/page',
    params,
  });
};

/**
 * Get merchant info by ID
 */
export const getMerchantInfo = (merchantId: string) => {
  return httpRequest<Merchant>({
    method: 'GET',
    url: '/v1/merchant/app/info/' + merchantId,
  });
};

export default {
  getMerchantList,
  getMerchantPage,
  getMerchantInfo,
};
