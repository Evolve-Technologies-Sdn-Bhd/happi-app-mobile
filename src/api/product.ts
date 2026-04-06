/**
 * Product API - Ported from happi-app-customer/src/api/product/index.js
 */
import { httpRequest } from './client';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  companyId: string;
  image?: string;
  status: number;
}

/**
 * Query category list
 */
export const getCategoryList = (params?: Record<string, any>) => {
  return httpRequest<Category[]>({
    method: 'GET',
    url: '/v1/product/app/category/list',
    params,
  });
};

/**
 * Query company list by category ID
 */
export const getCompanyList = (categoryId: string) => {
  return httpRequest<Company[]>({
    method: 'GET',
    url: `/v1/product/app/company/list/${categoryId}`,
  });
};

/**
 * Query Product list by category ID & company ID
 */
export const getProductListByCategoryIdAndCompanyId = (categoryId: string, companyId: string) => {
  return httpRequest<Product[]>({
    method: 'GET',
    url: `/v1/product/app/list/${categoryId}/${companyId}`,
  });
};

export default {
  getCategoryList,
  getCompanyList,
  getProductListByCategoryIdAndCompanyId,
};
