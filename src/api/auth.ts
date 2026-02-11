/**
 * Auth API
 * Ported from happi-app-customer/src/api/auth/index.js
 */

import { httpRequest, Config } from './client';

export interface LoginRequest {
  username: string;
  password: string;
  imgCaptchaId?: string;
  imgCaptchaCode?: string;
}

// Backend login DTO structure
interface BackendLoginDto {
  loginRole: number;
  loginStyle: number;
  accountLoginDto: {
    username: string;
    password: string;
    imgCaptchaId?: string;
    imgCaptchaCode?: string;
  };
}

// Data type for login/signup response (the "data" field inside ApiResponse)
export interface AuthUserData {
  accessToken: string;
  id: string;
  realname: string;
  mobile: string;
  email?: string;
  avatar?: string;
  membershipTier?: string;
  coins?: number;
}

export interface SignUpRequest {
  foreignerState: number;
  realname: string;
  idNumber: string;
  nationality?: string;
  passportNumber?: string;
  workPermitNumber?: string;
  workPermitExpiredDate?: string;
  countryCode: string;
  phoneCaptcha: string;
  mobile: string;
  password: string;
  birthday?: string;
  referralCode?: string;
}

export interface OtpRequest {
  mobile: string;
  countryCode?: string;
  type?: string;
}

export interface VerifyOtpRequest {
  mobile: string;
  code: string;
  type?: string;
}

export interface ResetPasswordRequest {
  mobile: string;
  password: string;
  phoneCaptcha: string;
}

export interface PinRequest {
  pin: string;
}

const authApi = {
  /**
   * User login
   * loginStyle: 1 = password login, 4 = OTP login
   */
  login(data: LoginRequest) {
    const payload: BackendLoginDto = {
      loginRole: Config.USER_LOGIN_ROLE,
      loginStyle: 1, // Password login
      accountLoginDto: {
        username: data.username,
        password: data.password,
        imgCaptchaId: data.imgCaptchaId,
        imgCaptchaCode: data.imgCaptchaCode,
      },
    };
    return httpRequest<AuthUserData>({ method: 'POST', url: '/v1/auth/login', data: payload });
  },

  /**
   * User sign up
   */
  signUp(data: SignUpRequest) {
    return httpRequest<AuthUserData>({ method: 'POST', url: '/v1/auth/signUp', data });
  },

  /**
   * Get image captcha
   */
  getCaptcha(params?: { type?: string }) {
    return httpRequest({ method: 'GET', url: '/v1/otp/captcha', params });
  },

  /**
   * Send OTP message
   */
  sendMsg(data: OtpRequest) {
    return httpRequest({ method: 'POST', url: '/v1/otp/msg', data });
  },

  /**
   * Verify OTP
   */
  verify(data: VerifyOtpRequest) {
    return httpRequest({ method: 'POST', url: '/v1/otp/verify', data });
  },

  /**
   * Reset password
   */
  resetPassword(data: ResetPasswordRequest) {
    return httpRequest({ method: 'POST', url: '/v1/auth/reset-password', data });
  },

  /**
   * Verify PIN
   */
  pinVerify(data: PinRequest) {
    return httpRequest({ method: 'POST', url: '/v1/pin/verify', data });
  },

  /**
   * Set PIN
   */
  pinSet(data: PinRequest) {
    return httpRequest({ method: 'POST', url: '/v1/pin/set', data });
  },

  /**
   * Reset PIN
   */
  pinReset(data: PinRequest) {
    return httpRequest({ method: 'POST', url: '/v1/pin/reset', data });
  },
};

export default authApi;
