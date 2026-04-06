/**
 * Public/Common API - Ported from happi-app-customer/src/api/pub/index.js
 */
import { httpRequest } from './client';

export interface Config {
  key: string;
  value: string;
  groupId: string;
}

export interface DicItem {
  code: string;
  name: string;
  value: string;
}

export interface Ad {
  id: string;
  title: string;
  image: string;
  link?: string;
  sort: number;
}

export interface City {
  id: string;
  name: string;
  code: string;
  parentId?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort: number;
}

export interface Tac {
  id: string;
  name: string;
  title: string;
  content: string;
  type: number;
  docUrl?: string;
}

export interface Misc {
  id: string;
  code: string;
  title: string;
  content: string;
  type: number;
  docUrl?: string;
  value?: string;
  sort?: number;
  state?: number;
}

export interface SupportEmailData {
  subject: string;
  message: string;
  email?: string;
  name?: string;
}

/**
 * Get config by group ID
 */
export const getConfig = (groupId: string) => {
  return httpRequest<Config[]>({
    method: 'GET',
    url: `/config/app/list/${groupId}`,
  });
};

/**
 * Get dictionary list by type code
 */
export const getDicList = (typeCode: string) => {
  return httpRequest<DicItem[]>({
    method: 'GET',
    url: `/dic/app/list/${typeCode}`,
  });
};

/**
 * Submit complaint
 */
export const complaintAdd = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/complaint/add',
    data,
  });
};

/**
 * Get advertisement list by ad code
 */
export const getAdList = (adCode: string) => {
  return httpRequest<Ad[]>({
    method: 'GET',
    url: '/ad/app/list/' + adCode,
  });
};

/**
 * Get city list
 */
export const getCityList = () => {
  return httpRequest<City[]>({
    method: 'GET',
    url: '/city/app/list',
  });
};

/**
 * Get presigned URL for upload
 */
export const getUploadPresignedUrl = (params: { fileName: string; contentType?: string }) => {
  return httpRequest<{ url: string; key: string }>({
    method: 'GET',
    url: '/upload/presigned-url',
    params,
  });
};

/**
 * Get FAQ list by category ID
 */
export const getFaqListByCategoryId = (categoryId: string) => {
  return httpRequest<Faq[]>({
    method: 'GET',
    url: 'v1/misc/app/list',
    params: { targetId: categoryId },
  });
};

/**
 * Get Terms and Conditions list
 */
export const getTacList = (membershipFlag?: boolean, insuranceFlag?: boolean) => {
  const params: Record<string, any> = { type: 2, targetType: 0 };
  if (membershipFlag) {
    params.membershipFlag = 1;
  }
  if (insuranceFlag) {
    params.insuranceFlag = 1;
  }
  return httpRequest<Tac[]>({
    method: 'GET',
    url: 'v1/misc/app/list',
    params,
  });
};

/**
 * Get tip by code
 */
export const getTipByCode = (code: string) => {
  return httpRequest<Misc>({
    method: 'GET',
    url: `v1/misc/app/info/${code}`,
  });
};

/**
 * Get misc list
 */
export const getMiscList = (params: Record<string, any>) => {
  return httpRequest<Misc[]>({
    method: 'GET',
    url: 'v1/misc/app/list',
    params,
  });
};

/**
 * Send support email
 */
export const sendSupportEmail = (data: SupportEmailData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/support/sendEmail',
    data,
  });
};

export default {
  getConfig,
  getDicList,
  complaintAdd,
  getAdList,
  getCityList,
  getUploadPresignedUrl,
  getFaqListByCategoryId,
  getTacList,
  getTipByCode,
  getMiscList,
  sendSupportEmail,
};
