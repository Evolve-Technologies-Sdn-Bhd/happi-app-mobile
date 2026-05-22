/**
 * Policy API - Ported from happi-app-customer/src/api/order/policy.js
 */
import { httpRequest } from './client';

// Policy status enum
export enum PolicyStatus {
  PENDING_APPROVAL = 0,
  ACTIVE = 1,
  REJECTED = 2,
  CANCELLED = 3,
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 0,
  PARTIAL = 1,
  PAID = 2,
}

// Policy interface
export interface Policy {
  id: string;
  policyNumber: string;
  status: PolicyStatus;
  payState: PaymentStatus;
  insuredStartDate: string;
  insuredEndDate: string;
  rejectTime: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    categoryId: string;
  };
  customer: {
    id: string;
    realname: string;
    postcode?: string;
  };
  company: {
    id: string;
    name: string;
    logoUrl: string;
  };
  // Detail fields (present on getPolicyInfo response)
  categoryName?: string;
  productName?: string;
  premium?: number;
  sumInsured?: string | number;
  addons?: Array<{ name: string; premium: number }>;
  orderInfo?: {
    id: string;
    actualAmount: number;
  };
}

// Policy page query params
export interface PolicyPageQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  tabCode?: number; // 0=all, 1=active
}

// Policy page response
export interface PolicyPageResponse {
  records: Policy[];
  total: number;
  current: number;
  size: number;
}

/**
 * Get policy list with pagination
 */
export const getPolicyPage = (params?: PolicyPageQuery) => {
  return httpRequest<PolicyPageResponse>({
    method: 'GET',
    url: '/v1/policy/app/list',
    params,
  });
};

/**
 * Get policy info by policy ID
 */
export const getPolicyInfo = (policyId: string) => {
  return httpRequest<Policy>({
    method: 'GET',
    url: `/v1/policy/app/info/${policyId}`,
  });
};

/**
 * Get policy info by order ID
 */
export const getPolicyInfoByOrderId = (orderId: string) => {
  return httpRequest<Policy>({
    method: 'GET',
    url: `/v1/policy/app/info/order/${orderId}`,
  });
};

export default {
  getPolicyPage,
  getPolicyInfo,
  getPolicyInfoByOrderId,
};
