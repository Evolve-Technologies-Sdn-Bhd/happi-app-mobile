/**
 * Header Component
 * Custom navigation header matching original app style
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Typography } from '../../constants/styles';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  light?: boolean;
  centerTitle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBackPress,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightComponent,
  transparent = false,
  light = false,
  centerTitle = true,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const iconColor = light ? Colors.textWhite : Colors.textPrimary;
  const textColor = light ? Colors.textWhite : Colors.textPrimary;

  return (
    <>
      <StatusBar
        barStyle={light ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : Colors.background}
        translucent={transparent}
      />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top },
          transparent && styles.transparent,
        ]}
      >
        <View style={styles.content}>
          {/* Left */}
          <View style={styles.left}>
            {showBack && navigation.canGoBack() && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.iconButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color={iconColor} />
              </TouchableOpacity>
            )}
            {leftIcon && (
              <TouchableOpacity
                onPress={onLeftPress}
                style={styles.iconButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name={leftIcon} size={24} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          {title && (
            <View style={[styles.titleContainer, centerTitle && styles.titleCenter]}>
              <Text
                style={[styles.title, { color: textColor }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          )}

          {/* Right */}
          <View style={styles.right}>
            {rightIcon && (
              <TouchableOpacity
                onPress={onRightPress}
                style={styles.iconButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name={rightIcon} size={24} color={iconColor} />
              </TouchableOpacity>
            )}
            {rightComponent}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.base,
  },
  
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  
  iconButton: {
    padding: Spacing.xs,
  },
  
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  
  titleCenter: {
    alignItems: 'center',
  },
  
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
});
