/**
 * Customer API
 * Ported from happi-app-customer/src/api/customer/index.js
 */

import { httpRequest } from './client';

export interface CustomerInfo {
  id: string;
  realname: string;
  username?: string;
  mobile: string;
  countryCode?: string;
  email?: string;
  avatar?: string;
  foreignerState?: number; // 0=local (NRIC), 1=foreigner (passport)
  idNumber?: string;
  idType?: number;
  idStatus?: number;
  passportNumber?: string;
  workPermitNumber?: string;
  workPermitExpiredDate?: string;
  nationality?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  maritalStatus?: string;
  membershipTier?: string;
  membershipPurchase?: { name: string };
  corporationName?: string;
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
  workPermitNumber?: string;
  workPermitExpiredDate?: string;
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
