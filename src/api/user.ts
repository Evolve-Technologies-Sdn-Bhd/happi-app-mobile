/**
 * User API
 * Ported from happi-app-customer/src/api/user/index.js
 */

import { httpRequest } from './client';

export interface UserBalance {
  amount: number;
}

export interface BalanceHistory {
  id: string;
  amount: number;
  type: string;
  description?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
}

export interface FeeAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const userApi = {
  /**
   * Get frequently used mobile
   */
  getFrequentlyUsedMobile() {
    return httpRequest({
      method: 'GET',
      url: '/v1/order/address/app/frequently-used-mobile',
    });
  },

  /**
   * Get user info (alias for customer info)
   */
  getUserInfo() {
    return httpRequest({ method: 'GET', url: '/v1/customer/app/info' });
  },

  /**
   * Update user info
   */
  updateUserInfo(data: any) {
    return httpRequest({ method: 'PUT', url: '/customer/app/info', data });
  },

  /**
   * Get default address
   */
  getDefaultAddress() {
    return httpRequest<{ success: boolean; data: Address }>({
      method: 'GET',
      url: '/v1/user/address/app/user-default',
    });
  },

  /**
   * Get address info by ID
   */
  getAddressInfo(id: string) {
    return httpRequest<{ success: boolean; data: Address }>({
      method: 'GET',
      url: `/v1/user/address/app/info/${id}`,
    });
  },

  /**
   * Get address list
   */
  getAddressList() {
    return httpRequest<{ success: boolean; data: Address[] }>({
      method: 'GET',
      url: '/v1/user/address/app/list/user',
    });
  },

  /**
   * Add address
   */
  addAddress(data: Partial<Address>) {
    return httpRequest({ method: 'POST', url: '/v1/user/address/app/add', data });
  },

  /**
   * Update address
   */
  updateAddress(data: Partial<Address>) {
    return httpRequest({ method: 'POST', url: '/v1/user/address/app/update', data });
  },

  /**
   * Delete address
   */
  deleteAddress(id: string) {
    return httpRequest({ method: 'DELETE', url: `/v1/user/address/app/delete?id=${id}` });
  },

  /**
   * Get fee account info
   */
  getFeeAccountInfo(id: string) {
    return httpRequest<{ success: boolean; data: FeeAccount }>({
      method: 'GET',
      url: `/v1/user/fee-account/app/info/${id}`,
    });
  },

  /**
   * Get fee account list
   */
  getFeeAccountList(flow?: string) {
    return httpRequest<{ success: boolean; data: FeeAccount[] }>({
      method: 'GET',
      url: `/v1/user/fee-account/app/list/user?flow=${flow || ''}`,
    });
  },

  /**
   * Add fee account
   */
  addFeeAccount(data: Partial<FeeAccount>) {
    return httpRequest({ method: 'POST', url: '/v1/user/fee-account/app/add', data });
  },

  /**
   * Update fee account
   */
  updateFeeAccount(data: Partial<FeeAccount>) {
    return httpRequest({ method: 'POST', url: '/v1/user/fee-account/app/update', data });
  },

  /**
   * Delete fee account
   */
  deleteFeeAccount(id: string) {
    return httpRequest({ method: 'DELETE', url: `/v1/user/fee-account/app/delete?id=${id}` });
  },

  /**
   * Get user balance info (coins)
   */
  getUserBalanceInfo() {
    return httpRequest<UserBalance>({
      method: 'GET',
      url: '/v1/user/balance/app/info',
    });
  },

  /**
   * Get balance history
   */
  getUserBalanceHistList(params?: { page?: number; limit?: number }) {
    return httpRequest<{ records: BalanceHistory[]; total: number }>({
      method: 'GET',
      url: '/v1/user/balance-hist/app/list',
      params,
    });
  },
};

export default userApi;
