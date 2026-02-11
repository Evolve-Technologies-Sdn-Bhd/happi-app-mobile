/**
 * Voucher API
 * Ported from happi-app-customer/src/api/voucher/index.js
 */

import { httpRequest } from './client';

export interface Voucher {
  id: string;
  title: string;
  description?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  imageUrl?: string;
  category?: string;
  terms?: string;
  expiryDate: string;
  stock: number;
  coinsRequired?: number;
}

export interface UserVoucher {
  id: string;
  voucherId: string;
  voucher: Voucher;
  status: 'available' | 'used' | 'expired';
  usedAt?: string;
  expiryDate: string;
  countdownEndTime?: string;
}

export interface VoucherListParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
}

const voucherApi = {
  /**
   * Get voucher list (all available vouchers)
   */
  getVoucherList(params?: VoucherListParams) {
    return httpRequest<{ success: boolean; data: { records: Voucher[]; total: number } }>({
      method: 'GET',
      url: '/v1/voucher/app/list',
      params,
    });
  },

  /**
   * Get voucher info by ID
   */
  getVoucherInfo(id: string) {
    return httpRequest<{ success: boolean; data: Voucher }>({
      method: 'GET',
      url: `/v1/voucher/app/info/${id}`,
    });
  },

  /**
   * Get voucher item info
   */
  getVoucherItemInfo(id: string) {
    return httpRequest<{ success: boolean; data: UserVoucher }>({
      method: 'GET',
      url: `/v1/voucher/app/item/info/${id}`,
    });
  },

  /**
   * Redeem voucher with coins
   */
  redeemVoucher(voucherId: string) {
    return httpRequest<{ success: boolean; data: UserVoucher }>({
      method: 'POST',
      url: `/v1/voucher/app/redeem/${voucherId}`,
    });
  },

  /**
   * Get user's vouchers
   */
  getUserVoucherList(params?: VoucherListParams) {
    return httpRequest<{ success: boolean; data: { records: UserVoucher[]; total: number } }>({
      method: 'GET',
      url: '/v1/voucher/app/user/list',
      params,
    });
  },

  /**
   * Start voucher usage - called when user clicks "Use Now"
   * Begins the countdown timer
   */
  startUsage(voucherItemId: string) {
    return httpRequest<{ success: boolean; data: { countdownTime: number; voucher: UserVoucher } }>({
      method: 'POST',
      url: `/v1/voucher/app/start-usage/${voucherItemId}`,
    });
  },

  /**
   * Validate voucher usage by scanning branch QR/NFC code
   */
  validateUsage(voucherItemId: string, nfcNumber: string) {
    return httpRequest<{ success: boolean }>({
      method: 'POST',
      url: `/v1/voucher/app/validate-usage/${voucherItemId}`,
      params: { nfcNumber },
    });
  },

  /**
   * Use offline voucher by scanning branch QR/NFC code
   */
  useVoucher(voucherItemId: string, nfcNumber: string) {
    return httpRequest<{ success: boolean; data: { countdownTime: number; voucher: UserVoucher } }>({
      method: 'POST',
      url: `/v1/voucher/app/use/${voucherItemId}`,
      params: { nfcNumber },
    });
  },
};

export default voucherApi;
