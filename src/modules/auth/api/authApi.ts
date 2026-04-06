/**
 * Auth API
 * Authentication related API calls
 */

import { api, ApiResponse } from '../../../shared/utils/api';
import { Endpoints } from '../../../shared/constants/config';
import { User } from '../../../store/authStore';

// Response Types
interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface OtpResponse {
  message: string;
}

interface VerifyOtpResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface ResetPasswordResponse {
  message: string;
}

export const authApi = {
  /**
   * Login with phone and password
   */
  login: async (phone: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return api.post<LoginResponse>(Endpoints.AUTH.LOGIN, {
      mobile: phone,
      password,
    });
  },

  /**
   * Register new user
   */
  register: async (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    referralCode?: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    return api.post<LoginResponse>(Endpoints.AUTH.REGISTER, {
      name: data.name,
      mobile: data.phone,
      email: data.email,
      password: data.password,
      referralCode: data.referralCode,
    });
  },

  /**
   * Send OTP to phone number
   * businessType: 3 = reset password, 1 = sign up
   */
  sendOtp: async (
    phone: string,
    type: 'signup' | 'reset',
    countryCode = '60',
    channel = 'sms'
  ): Promise<ApiResponse<OtpResponse>> => {
    const businessType = type === 'reset' ? 3 : 1;
    return api.post<OtpResponse>(Endpoints.AUTH.SEND_OTP, {
      countryCode,
      mobile: phone,
      channel,
      businessType,
    });
  },

  /**
   * Verify OTP
   */
  verifyOtp: async (
    phone: string,
    code: string,
    type: 'signup' | 'reset',
    countryCode = '60',
    channel = 'sms'
  ): Promise<ApiResponse<VerifyOtpResponse>> => {
    const businessType = type === 'reset' ? 3 : 1;
    return api.post<VerifyOtpResponse>(Endpoints.AUTH.VERIFY_OTP, {
      countryCode,
      mobile: phone,
      phoneCaptcha: code,
      channel,
      businessType,
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (
    phone: string,
    newPassword: string,
    countryCode = '60'
  ): Promise<ApiResponse<ResetPasswordResponse>> => {
    return api.post<ResetPasswordResponse>(Endpoints.AUTH.RESET_PASSWORD, {
      mobile: phone,
      password: newPassword,
      countryCode,
    });
  },

  /**
   * Change password (for logged in users)
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<ResetPasswordResponse>> => {
    return api.post<ResetPasswordResponse>(Endpoints.AUTH.CHANGE_PASSWORD, {
      oldPassword: currentPassword,
      newPassword,
    });
  },

  /**
   * Logout
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return api.post<null>(Endpoints.AUTH.LOGOUT, {});
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    return api.post<{ token: string }>(Endpoints.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });
  },
};
