/**
 * Loading Component
 * Full screen and inline loading indicators
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { Text } from '../Text';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/styles';

interface LoadingProps {
  visible?: boolean;
  fullScreen?: boolean;
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  fullScreen = false,
  text,
  size = 'large',
  color = Colors.primary,
}) => {
  if (!visible) return null;

  const content = (
    <View style={fullScreen ? styles.fullScreen : styles.inline}>
      <View style={fullScreen ? styles.card : undefined}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        {content}
      </Modal>
    );
  }

  return content;
};

// Screen loading wrapper
export const ScreenLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <View style={styles.screenLoading}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.screenLoadingText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  inline: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  card: {
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  
  text: {
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  screenLoading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },

  screenLoadingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
});
