/**
 * Membership API
 * Ported from happi-app-customer/src/api/membership/index.js
 */

import { httpRequest } from './client';

export interface MembershipItem {
  id: string;
  name: string;
  description?: string;
  cardImgUrl?: string;
  price: number;
  tier: string;
  benefits?: string[];
  features?: MembershipFeature[];
}

export interface MembershipFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface MembershipPurchase {
  id: string;
  membershipId: string;
  membershipName: string;
  tier: string;
  purchaseDate: string;
  expiryDate: string;
  status: string;
  cardImgUrl?: string;
}

export interface MembershipMultiplier {
  tier: string;
  multiplier: number;
}

export interface CompletePA {
  policyId: string;
  nominees?: any[];
}

const membershipApi = {
  /**
   * Get membership list
   */
  getMembershipList(query?: { page?: number; limit?: number }) {
    return httpRequest<MembershipItem[]>({
      method: 'GET',
      url: '/v1/membership/app/list',
      query,
    });
  },

  /**
   * Get membership info by ID
   */
  getMembershipInfo(id: string) {
    return httpRequest<MembershipItem>({
      method: 'GET',
      url: `/v1/membership/app/info/${id}`,
    });
  },

  /**
   * Get user's purchased memberships
   */
  getMembershipPurchaseList(query?: { page?: number; limit?: number }) {
    return httpRequest<MembershipPurchase[]>({
      method: 'GET',
      url: '/v1/membership/app/purchase/list',
      query,
    });
  },

  /**
   * Get membership group list
   */
  getMembershipGroupList(query?: { page?: number; limit?: number }) {
    return httpRequest<any[]>({
      method: 'GET',
      url: '/v1/membership/app/group/list',
      query,
    });
  },

  /**
   * Get multiplier list for coin rewards
   */
  getMembershipMultiplierList() {
    return httpRequest<MembershipMultiplier[]>({
      method: 'GET',
      url: '/v1/membership/app/multiplier/list',
    });
  },

  /**
   * Complete PA (Personal Accident) form
   */
  completePA(data: CompletePA) {
    return httpRequest({
      method: 'PUT',
      url: '/v1/membership/app/complete/pa',
      data,
    });
  },
};

export default membershipApi;
