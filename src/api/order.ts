/**
 * Order API - Ported from happi-app-customer/src/api/order/index.js
 */
import { httpRequest } from './client';

export interface CheckoutData {
  items: any[];
  addressId?: string;
  couponCode?: string;
  paymentMethod?: string;
}

export interface QuoteData {
  items: any[];
  addressId?: string;
}

export interface OrderDetail {
  id: string;
  orderNo: string;
  status: number;
  totalAmount: number;
  payAmount: number;
  createTime: string;
  items: any[];
}

export interface OrderPageParams {
  pageNum?: number;
  pageSize?: number;
  status?: number;
}

/**
 * Checkout order
 */
export const checkout = (data: CheckoutData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/checkout',
    data,
  });
};

export interface InsuranceCheckoutData {
  orderOrigin: number; // 1=app, 2=web
  orderType: number;   // 2=insurance
  companyType: number; // 0=default, 1=chubb, 2=pacific
  categoryType: number; // 1=cyber, 2=home, 3=travel, 4=auto
  customer?: Record<string, any>;
  cyber?: {
    employmentLocation: number;
    categoryId: string;
    companyId: string;
    productId: string;
  };
  home?: {
    articles: Array<{ name: string; serial: string; sumInsured: number }>;
    targetHome: {
      name: string;
      category: string;
      address1: string;
      address2: string;
      stateName: string;
      postcode: string;
      damageDetail: string;
      isDamage: number;
    };
    categoryId: string;
    companyId: string;
    productId: string;
  };
  travel?: {
    quoteId?: string;
    policyType: string;
    coverTypeCode: string;
    regionCode: string;
    startDate: string;
    endDate: string;
    travelCountries: string[];
    optionalCovers?: Array<{ Code: string }>;
    insuredPersons?: Array<{ realname: string; userId?: string; familyId?: string }>;
    planCode?: string;
  };
}

/**
 * Insurance-specific checkout (cyber/home/travel)
 */
export const insuranceCheckout = (data: InsuranceCheckoutData) => {
  return httpRequest<{ orderGroupId: string }>({
    method: 'POST',
    url: '/v1/order/app/checkout',
    data,
  });
};

/**
 * Quote order
 */
export const quote = (data: QuoteData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/quote',
    data,
  });
};

/**
 * Check order from detail
 */
export const orderCheckFromDetail = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/check-from-detail',
    data,
  });
};

/**
 * Create order from detail page
 */
export const createOrderFromDetail = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/create-from-detail',
    data,
  });
};

/**
 * Create order from cart
 */
export const createOrderFromCart = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/create-from-cart',
    data,
  });
};

/**
 * Compute actual pay price
 */
export const computePayPrice = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/order/app/computePayPrice',
    data,
  });
};

/**
 * Get user order page list
 */
export const userOrderPage = (params: OrderPageParams) => {
  return httpRequest<{ list: OrderDetail[]; total: number }>({
    method: 'GET',
    url: '/v1/order/app/user-order-page',
    params,
  });
};

/**
 * Get order info by ID
 */
export const getOrderInfo = (orderId: string) => {
  return httpRequest<OrderDetail>({
    method: 'GET',
    url: `/v1/order/app/${orderId}`,
  });
};

/**
 * Get vice order info
 */
export const getViceOrderInfo = (orderId: string) => {
  return httpRequest({
    method: 'GET',
    url: `/v1/order/app/vice/${orderId}`,
  });
};

/**
 * Create order (pending payment)
 */
export const orderCreate = (orderId: string) => {
  return httpRequest({
    method: 'GET',
    url: `/v1/order/app/create/${orderId}`,
  });
};

/**
 * Cancel order
 */
export const cancelOrder = (orderId: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/order/app/cancel/${orderId}`,
  });
};

/**
 * Get sub order IDs
 */
export const getSubOrderIds = (orderId: string) => {
  return httpRequest<string[]>({
    method: 'GET',
    url: `/v1/order/app/sub-order-ids/${orderId}`,
  });
};

/**
 * Delete order
 */
export const deleteOrder = (orderId: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/order/app/${orderId}`,
  });
};

/**
 * Cancel refund
 */
export const cancelRefund = (orderId: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/order/refund/app/cancel/${orderId}`,
  });
};

export default {
  checkout,
  quote,
  orderCheckFromDetail,
  createOrderFromDetail,
  createOrderFromCart,
  computePayPrice,
  userOrderPage,
  getOrderInfo,
  getViceOrderInfo,
  orderCreate,
  cancelOrder,
  getSubOrderIds,
  deleteOrder,
  cancelRefund,
};
