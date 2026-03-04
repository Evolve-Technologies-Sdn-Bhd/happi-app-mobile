/**
 * Toast Hook
 * Easy to use toast notifications
 */

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top' | 'bottom';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    position: 'top',
  });

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000, position: ToastPosition = 'top') => {
      setToast({
        visible: true,
        message,
        type,
        duration,
        position,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
