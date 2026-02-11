/**
 * Family API - Ported from happi-app-customer/src/api/customer/family.js
 */
import { httpRequest } from './client';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  icNo?: string;
  passportNo?: string;
  gender?: number;
  nationality?: string;
}

export interface AddFamilyMemberData {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  icNo?: string;
  passportNo?: string;
  gender?: number;
  nationality?: string;
}

export interface UpdateFamilyMemberData extends AddFamilyMemberData {
  id: string;
}

/**
 * Get family member info by ID
 */
export const getFamilyMemberInfo = (id: string) => {
  return httpRequest<FamilyMember>({
    method: 'GET',
    url: `/v1/customer/family/member/app/info/${id}`,
  });
};

/**
 * Get family member list
 */
export const getFamilyMemberList = (params?: Record<string, any>) => {
  return httpRequest<FamilyMember[]>({
    method: 'GET',
    url: '/v1/customer/family/member/app/list',
    params,
  });
};

/**
 * Add family member
 */
export const addFamilyMember = (data: AddFamilyMemberData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/customer/family/member/app/add',
    data,
  });
};

/**
 * Update family member
 */
export const updateFamilyMember = (data: UpdateFamilyMemberData) => {
  return httpRequest({
    method: 'PUT',
    url: '/v1/customer/family/member/app/update',
    data,
  });
};

/**
 * Delete family member(s)
 */
export const deleteFamilyMember = (ids: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/customer/family/member/app/delete/${ids}`,
  });
};

export default {
  getFamilyMemberInfo,
  getFamilyMemberList,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
};
