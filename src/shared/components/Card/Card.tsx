/**
 * Card Component
 * Reusable card container
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadows } from '../../constants/styles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg';
  onPress?: TouchableOpacityProps['onPress'];
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
  borderRadius = 'md',
  onPress,
}) => {
  const cardStyles: ViewStyle[] = [
    styles.base,
    padding !== 'none' ? styles[`padding_${padding}`] : undefined,
    shadow !== 'none' ? Shadows[shadow] : undefined,
    styles[`radius_${borderRadius}`],
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  
  // Padding
  padding_sm: {
    padding: Spacing.sm,
  },
  padding_md: {
    padding: Spacing.base,
  },
  padding_lg: {
    padding: Spacing.xl,
  },
  
  // Border radius
  radius_sm: {
    borderRadius: BorderRadius.sm,
  },
  radius_md: {
    borderRadius: BorderRadius.md,
  },
  radius_lg: {
    borderRadius: BorderRadius.lg,
  },
});
