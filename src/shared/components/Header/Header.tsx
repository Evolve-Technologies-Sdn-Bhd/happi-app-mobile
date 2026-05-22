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
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '../../../shared/constants/fonts';

const navBarBg = require('../../../../assets/images/nav-header-bg.png');

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
  titleRight?: React.ReactNode;
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
  titleRight,
  transparent = false,
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

  const navRow = (
    <View style={styles.navRow}>
      <View style={styles.left}>
        {showBack && navigation.canGoBack() && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="arrow-back" size={16} color="#ffffff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name={leftIcon} size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.right}>
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name={rightIcon} size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
        {rightComponent}
      </View>
    </View>
  );

  if (transparent) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.transparentContainer, { paddingTop: insets.top }]}>
          {navRow}
          {title && (
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {titleRight && <View style={styles.titleRightWrapper}>{titleRight}</View>}
            </View>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FDB813" translucent={false} />
      <View style={styles.headerWrapper}>
        {/* Status bar placeholder – solid yellow (#FDB813), matches Vue happi-status-bar */}
        <View style={[styles.statusBarFill, { height: insets.top }]} />
        {/* Nav content – background image stretched over nav row + title */}
        <ImageBackground
          source={navBarBg}
          style={styles.container}
          resizeMode="stretch"
        >
          {navRow}
          {title && (
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {titleRight && <View style={styles.titleRightWrapper}>{titleRight}</View>}
            </View>
          )}
        </ImageBackground>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  statusBarFill: {
    backgroundColor: '#FDB813',
    width: '100%',
  },

  headerWrapper: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  container: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 26,
  },

  transparentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingBottom: 26,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    marginLeft: 4,
    lineHeight: 20,
  },

  title: {
    marginTop: 8,
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 22,
    fontFamily: FontFamily.bold,
    lineHeight: 32,
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titleRightWrapper: {
    marginRight: 6,
  },
});

