/**
 * Vehicle API - Ported from happi-app-customer/src/api/customer/vehicle.js
 */
import { httpRequest } from './client';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  type?: string;
  postcode?: string;
}

export interface AddVehicleData {
  vehicleNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  type?: string;
  postcode?: string;
}

export interface UpdateVehicleData extends AddVehicleData {
  id: string;
}

/**
 * Get vehicle info by ID
 */
export const getVehicleInfo = (id: string) => {
  return httpRequest<Vehicle>({
    method: 'GET',
    url: `/v1/customer/vehicle/app/info/${id}`,
  });
};

/**
 * Get vehicle list
 */
export const getVehicleList = (params?: Record<string, any>) => {
  return httpRequest<Vehicle[]>({
    method: 'GET',
    url: '/v1/customer/vehicle/app/list',
    params,
  });
};

/**
 * Add vehicle
 */
export const addVehicle = (data: AddVehicleData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/customer/vehicle/app/add',
    data,
  });
};

/**
 * Update vehicle
 */
export const updateVehicle = (data: UpdateVehicleData) => {
  return httpRequest({
    method: 'PUT',
    url: '/v1/customer/vehicle/app/update',
    data,
  });
};

/**
 * Delete vehicle(s)
 */
export const deleteVehicle = (ids: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/customer/vehicle/app/delete/${ids}`,
  });
};

export default {
  getVehicleInfo,
  getVehicleList,
  addVehicle,
  updateVehicle,
  deleteVehicle,
};
