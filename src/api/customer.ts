/**
 * Customer API
 * Ported from happi-app-customer/src/api/customer/index.js
 */

import { httpRequest } from './client';

export interface CustomerInfo {
  id: string;
  realname: string;
  mobile: string;
  email?: string;
  avatar?: string;
  idNumber?: string;
  nationality?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  membershipTier?: string;
  coins?: number;
  referralCode?: string;
}

export interface UpdateCustomerRequest {
  realname?: string;
  email?: string;
  avatar?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  maritalStatus?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

const customerApi = {
  /**
   * Get customer info
   */
  getCustomerInfo() {
    return httpRequest<CustomerInfo>({
      method: 'GET',
      url: '/v1/customer/app/info',
    });
  },

  /**
   * Update customer info
   */
  updateCustomerInfo(data: UpdateCustomerRequest) {
    return httpRequest({ method: 'PUT', url: '/v1/customer/app/info', data });
  },

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest) {
    return httpRequest({ method: 'PUT', url: '/v1/customer/app/password', data });
  },
};

export default customerApi;
