/**
 * Color Constants
 * Matching the original Happi app color scheme
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#FDB813',      // Happi Yellow/Gold
  primaryDark: '#E5A611',
  primaryLight: '#FFEAAD',
  
  // Secondary Colors
  secondary: '#333333',
  secondaryLight: '#666666',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundGrey: '#F5F5F5',
  backgroundDark: '#1A1A1A',
  
  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  textWhite: '#FFFFFF',
  textDark: '#1A1A1A',
  
  // Status Colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  
  // Border Colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#BDBDBD',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Gradient
  gradientStart: '#FDB813',
  gradientEnd: '#F5A623',
  
  // Membership Tier Colors
  tierBronze: '#CD7F32',
  tierSilver: '#C0C0C0',
  tierGold: '#FFD700',
  tierPlatinum: '#E5E4E2',
  
  // Transparent
  transparent: 'transparent',
} as const;

// Tier gradient colors for membership cards
export const TierColors = {
  bronze: {
    gradient: ['#CD7F32', '#8B4513'] as const,
    text: '#FFFFFF',
  },
  silver: {
    gradient: ['#C0C0C0', '#808080'] as const,
    text: '#333333',
  },
  gold: {
    gradient: ['#FFD700', '#FDB813'] as const,
    text: '#333333',
  },
  platinum: {
    gradient: ['#E5E4E2', '#B5B5B5'] as const,
    text: '#333333',
  },
} as const;
export type ColorType = keyof typeof Colors;
