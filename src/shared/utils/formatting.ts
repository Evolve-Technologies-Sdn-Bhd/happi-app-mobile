/**
 * Formatting Utilities
 * Date, currency, phone number formatting
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with plugins
dayjs.extend(relativeTime);

/**
 * Format currency (Malaysian Ringgit)
 */
export const formatCurrency = (amount: number, currency = 'MYR'): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-MY').format(num);
};

/**
 * Format date
 */
export const formatDate = (
  date: string | Date,
  format = 'DD MMM YYYY'
): string => {
  return dayjs(date).format(format);
};

/**
 * Format datetime
 */
export const formatDateTime = (
  date: string | Date,
  format = 'DD MMM YYYY, HH:mm'
): string => {
  return dayjs(date).format(format);
};

/**
 * Format time
 */
export const formatTime = (
  date: string | Date,
  format = 'HH:mm'
): string => {
  return dayjs(date).format(format);
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

/**
 * Format phone number (Malaysian format)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: +60 12-345 6789
  if (cleaned.startsWith('60')) {
    const number = cleaned.slice(2);
    if (number.length === 9) {
      return `+60 ${number.slice(0, 2)}-${number.slice(2, 5)} ${number.slice(5)}`;
    }
    if (number.length === 10) {
      return `+60 ${number.slice(0, 2)}-${number.slice(2, 6)} ${number.slice(6)}`;
    }
  }
  
  return phone;
};

/**
 * Format IC number (Malaysian format)
 */
export const formatICNumber = (ic: string): string => {
  const cleaned = ic.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }
  return ic;
};

/**
 * Mask text (for sensitive data)
 */
export const maskText = (
  text: string,
  visibleStart = 4,
  visibleEnd = 4,
  maskChar = '*'
): string => {
  if (text.length <= visibleStart + visibleEnd) return text;
  
  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const masked = maskChar.repeat(text.length - visibleStart - visibleEnd);
  
  return `${start}${masked}${end}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
  text: string,
  maxLength: number,
  ellipsis = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Title case
 */
export const titleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
