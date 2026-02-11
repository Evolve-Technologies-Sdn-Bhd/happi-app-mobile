/**
 * Card API - Ported from happi-app-customer/src/api/card/index.js
 */
import { httpRequest } from './client';

export interface Card {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isDefault: boolean;
  last4Digits?: string;
}

export interface AddCardData {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface EditCardData {
  id: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
}

/**
 * Add new card
 */
export const addCard = (data: AddCardData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/card/add',
    data,
  });
};

/**
 * Get my cards
 */
export const getMyCards = (params?: Record<string, any>) => {
  return httpRequest<Card[]>({
    method: 'GET',
    url: '/v1/card/list',
    params,
  });
};

/**
 * Delete card
 */
export const deleteCard = (id: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/card/delete/${id}`,
  });
};

/**
 * Set card as default
 */
export const setDefaultCard = (id: string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/card/${id}/default`,
  });
};

/**
 * Edit card
 */
export const editCard = (data: EditCardData) => {
  return httpRequest({
    method: 'PUT',
    url: '/v1/card/edit',
    data,
  });
};

export default {
  addCard,
  getMyCards,
  deleteCard,
  setDefaultCard,
  editCard,
};
