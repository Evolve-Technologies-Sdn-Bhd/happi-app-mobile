/**
 * API Index - Aggregates all API modules
 * Ported from happi-app-customer/src/api/index.js
 */

// Import all API modules
import authApi from './auth';
import customerApi from './customer';
import familyApi from './family';
import homeApi from './home';
import taskApi from './task';
import vehicleApi from './vehicle';
import membershipApi from './membership';
import merchantApi from './merchant';
import serviceApi from './service';
import msgApi from './msg';
import notifyApi from './notify';
import notificationApi from './notification';
import orderApi from './order';
import payApi from './pay';
import policyApi from './policy';
import productApi from './product';
import pubApi from './pub';
import userApi from './user';
import voucherApi from './voucher';
import cardApi from './card';

// Export individual modules for named imports
export * from './auth';
export * from './customer';
export * from './family';
export * from './home';
export * from './task';
export * from './vehicle';
export * from './membership';
export * from './merchant';
export * from './service';
export * from './msg';
export * from './notify';
export * from './notification';
export * from './order';
export * from './pay';
export * from './policy';
export * from './product';
export * from './pub';
export * from './user';
export * from './voucher';
export * from './card';

// Export config and client utilities
export { Config, StorageKeys, httpRequest, getOssImg } from './client';

// Default export with all APIs merged (matches Vue app pattern)
const api = {
  ...authApi,
  ...pubApi,
  ...orderApi,
  ...userApi,
  ...payApi,
  ...msgApi,
  ...notifyApi,
  ...notificationApi,
  ...membershipApi,
  ...customerApi,
  ...taskApi,
  ...homeApi,
  ...vehicleApi,
  ...familyApi,
  ...productApi,
  ...policyApi,
  ...voucherApi,
  ...merchantApi,
  ...serviceApi,
  ...cardApi,
};

export default api;

// Also export modules individually as namespaces
export {
  authApi,
  customerApi,
  familyApi,
  homeApi,
  taskApi,
  vehicleApi,
  membershipApi,
  merchantApi,
  serviceApi,
  msgApi,
  notifyApi,
  notificationApi,
  orderApi,
  payApi,
  policyApi,
  productApi,
  pubApi,
  userApi,
  voucherApi,
  cardApi,
};
