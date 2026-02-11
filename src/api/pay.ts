/**
 * Payment API - Ported from happi-app-customer/src/api/pay/index.js
 */
import { httpRequest } from './client';

export interface PlaceOrderData {
  orderId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface PayResult {
  status: 'success' | 'pending' | 'failed';
  orderId: string;
  transactionId?: string;
  message?: string;
}

/**
 * Place order with Stripe payment
 */
export const stripePlaceOrder = (data: PlaceOrderData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/pay/stripe/place-order',
    data,
  });
};

/**
 * Place order with Razer payment
 */
export const razerPlaceOrder = (data: PlaceOrderData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/pay/razer/place-order',
    data,
  });
};

/**
 * Place order with Chubb payment
 */
export const chubbPlaceOrder = (data: PlaceOrderData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/pay/chubb/place-order',
    data,
  });
};

/**
 * Chubb travel checkout
 */
export const chubbTravelCheckout = (data: any) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/pay/chubb/travel/checkout',
    data,
  });
};

/**
 * Get payment result
 */
export const getPayResult = (orderId: string) => {
  return httpRequest<PayResult>({
    method: 'GET',
    url: `/v1/pay/result/${orderId}`,
  });
};

/**
 * Get refund result
 */
export const getRefundResult = (orderId: string) => {
  return httpRequest({
    method: 'GET',
    url: `/v1/refund/result/${orderId}`,
  });
};

export default {
  stripePlaceOrder,
  razerPlaceOrder,
  chubbPlaceOrder,
  chubbTravelCheckout,
  getPayResult,
  getRefundResult,
};
