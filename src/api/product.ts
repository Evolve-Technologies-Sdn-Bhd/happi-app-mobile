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

export interface ProductAddon {
  name: string;
  premium: number;
  description?: string;
}

export interface ProductTax {
  name: string;
  type: number; // 1=percentage of premium, 2=fixed
  value: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  companyId: string;
  image?: string;
  cardImgUrl?: string;
  status: number;
  // Payable calc fields
  premium?: number;
  addons?: ProductAddon[];
  taxes?: ProductTax[];
  grossDescription?: string;
  commissionPercentage?: number;
  sumInsured?: number;
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
