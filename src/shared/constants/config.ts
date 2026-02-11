/**
 * App Configuration
 * Environment-specific settings
 */

type Environment = 'development' | 'staging' | 'production';

interface Config {
  env: Environment;
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  buildNumber: string;
  timeout: number;
  enableLogs: boolean;
}

const ENV: Environment = (__DEV__ ? 'development' : 'production') as Environment;

const configs: Record<Environment, Config> = {
  development: {
    env: 'development',
    apiBaseUrl: 'http://localhost:9030/api',
    appName: 'Happi Dev',
    appVersion: '1.0.0',
    buildNumber: '1',
    timeout: 30000,
    enableLogs: true,
  },
  staging: {
    env: 'staging',
    apiBaseUrl: 'https://test-admin.happi.com.my/api',
    appName: 'Happi Staging',
    appVersion: '1.0.0',
    buildNumber: '1',
    timeout: 30000,
    enableLogs: true,
  },
  production: {
    env: 'production',
    apiBaseUrl: 'https://admin.happi.com.my/api',
    appName: 'Happi',
    appVersion: '1.0.0',
    buildNumber: '1',
    timeout: 30000,
    enableLogs: false,
  },
};

export const AppConfig = configs[ENV];

// Storage Keys
export const StorageKeys = {
  AUTH_TOKEN: '@happi/auth_token',
  REFRESH_TOKEN: '@happi/refresh_token',
  USER_DATA: '@happi/user_data',
  LANGUAGE: '@happi/language',
  ONBOARDING_COMPLETED: '@happi/onboarding_completed',
  PUSH_TOKEN: '@happi/push_token',
  THEME: '@happi/theme',
  PRIVACY_AGREED: '@happi/privacy_agreed',
} as const;

// API Endpoints
export const Endpoints = {
  // Auth
  AUTH: {
    LOGIN: '/pub/customer/login',
    REGISTER: '/pub/customer/mobile/register',
    SEND_OTP: '/pub/customer/mobile/code',
    VERIFY_OTP: '/pub/customer/mobile/verify',
    REFRESH_TOKEN: '/pub/customer/refresh-token',
    LOGOUT: '/customer/logout',
    RESET_PASSWORD: '/pub/customer/reset-password',
    CHANGE_PASSWORD: '/customer/change-password',
  },
  
  // User
  USER: {
    PROFILE: '/customer/info',
    UPDATE_PROFILE: '/customer/update',
    UPLOAD_AVATAR: '/customer/avatar',
  },
  
  // Membership
  MEMBERSHIP: {
    LIST: '/customer/membership/list',
    DETAIL: '/customer/membership/detail',
    PURCHASE: '/customer/membership/purchase',
    MY_MEMBERSHIPS: '/customer/membership/my',
  },
  
  // Product
  PRODUCT: {
    LIST: '/customer/product/list',
    DETAIL: '/customer/product/detail',
    CATEGORIES: '/customer/product/categories',
  },
  
  // Voucher
  VOUCHER: {
    LIST: '/customer/voucher/list',
    DETAIL: '/customer/voucher/detail',
    MY_VOUCHERS: '/customer/voucher/my',
    REDEEM: '/customer/voucher/redeem',
    USE: '/customer/voucher/use',
  },
  
  // Payment
  PAYMENT: {
    CREATE_ORDER: '/customer/order/create',
    PAYMENT_METHODS: '/customer/payment/methods',
    PROCESS_PAYMENT: '/customer/payment/process',
    ORDER_STATUS: '/customer/order/status',
  },
  
  // Service
  SERVICE: {
    LIST: '/customer/service/list',
    DETAIL: '/customer/service/detail',
  },
  
  // Notification
  NOTIFICATION: {
    LIST: '/customer/message/list',
    DETAIL: '/customer/message/detail',
    MARK_READ: '/customer/message/read',
    UNREAD_COUNT: '/customer/message/unread-count',
  },
  
  // Common
  COMMON: {
    UPLOAD: '/pub/upload',
    BANNER: '/pub/banner',
    CONFIG: '/pub/config',
  },
} as const;
