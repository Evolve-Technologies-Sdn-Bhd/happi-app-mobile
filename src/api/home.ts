/**
 * Home API - Ported from happi-app-customer/src/api/customer/home.js
 */
import { httpRequest } from './client';

export interface Home {
  id: string;
  address: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface AddHomeData {
  address: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateHomeData extends AddHomeData {
  id: string;
}

/**
 * Get home info by ID
 */
export const getHomeInfo = (id: string) => {
  return httpRequest<Home>({
    method: 'GET',
    url: `/v1/customer/home/app/info/${id}`,
  });
};

/**
 * Get home list
 */
export const getHomeList = (params?: Record<string, any>) => {
  return httpRequest<Home[]>({
    method: 'GET',
    url: '/v1/customer/home/app/list',
    params,
  });
};

/**
 * Add home
 */
export const addHome = (data: AddHomeData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/customer/home/app/add',
    data,
  });
};

/**
 * Update home
 */
export const updateHome = (data: UpdateHomeData) => {
  return httpRequest({
    method: 'PUT',
    url: '/v1/customer/home/app/update',
    data,
  });
};

/**
 * Delete home(s)
 */
export const deleteHome = (ids: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/customer/home/app/delete/${ids}`,
  });
};

export default {
  getHomeInfo,
  getHomeList,
  addHome,
  updateHome,
  deleteHome,
};
