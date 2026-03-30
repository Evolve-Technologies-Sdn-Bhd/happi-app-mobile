/**
 * Profile Index Screen
 * UI matches happi-app-customer/src/views/profile/index.vue
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  Clipboard,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { getOssImg } from '../../../api';

// SVG icons
import AIIconSvg from '../../../../assets/images/profile/profile-ai-icon.svg';
import NotifDotSvg from '../../../../assets/images/profile/profile-notification-dot.svg';
import NotifIconSvg from '../../../../assets/images/profile/profile-notification-icon.svg';

// PNG assets
const imgBg        = require('../../../../assets/images/profile/profile-header-bg.png');
const imgQr        = require('../../../../assets/images/profile/profile-qr-icon.png');
const imgCopy      = require('../../../../assets/images/profile/profile-copy-icon.png');
const imgPersonal  = require('../../../../assets/images/profile/profile-personal-icon.png');
const imgInsurance = require('../../../../assets/images/profile/profile-insurance-icon.png');
const imgPrivacy   = require('../../../../assets/images/profile/profile-privacy-icon.png');
const imgHelp      = require('../../../../assets/images/profile/profile-help-icon.png');
const imgFamily    = require('../../../../assets/images/profile/profile-family-icon.png');
const imgChevron   = require('../../../../assets/images/profile/profile-chevron-icon.png');

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileIndex'>;

export const ProfileIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const userInfo = useUserStore((state) => state.info);
  const purchaseMembershipList = useUserStore((state) => state.purchaseMembershipList);
  const logoutAction = useUserStore((state) => state.logoutAction);
  const getUserInfoAction = useUserStore((state) => state.getUserInfoAction);
  const [unreadCount, setUnreadCount] = useState(0);

  // Display name – matches Vue displayName computed
  const displayName = useMemo(() => {
    const name = String((userInfo as any)?.name || userInfo?.realname || user?.name || '');
    if (!name) return '';
    const maxLength = 25;
    if (name.length <= maxLength) return name;
    const cutPatterns = [/\s+bin\s+/i, /\s+binti\s+/i, /\s+a\/l\s+/i, /\s+a\/p\s+/i];
    let cutIndex = -1;
    for (const pattern of cutPatterns) {
      const match = name.match(pattern);
      if (match?.index !== undefined && (cutIndex === -1 || match.index < cutIndex)) {
        cutIndex = match.index;
      }
    }
    const trimmed = cutIndex !== -1 ? name.substring(0, cutIndex).trim() : name;
    return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed;
  }, [userInfo, user?.name]);

  const isMember = !!(purchaseMembershipList && purchaseMembershipList.length > 0);
  const invitationCode = (userInfo as any)?.invitationCode || userInfo?.referralCode || user?.referralCode;
  const uniqueId = userInfo?.uniqueId;
  const avatarUri = userInfo?.avatar ? getOssImg(userInfo.avatar) : user?.avatar || null;
  const fallbackLetter = ((userInfo as any)?.realname || displayName || '?').charAt(0).toUpperCase();

  useFocusEffect(
    useCallback(() => {
      getUserInfoAction();
    }, [getUserInfoAction])
  );

  const handleLogout = () => {
    Alert.alert('Reminder', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          logoutAction();
          await logout();
        },
      },
    ]);
  };

  const copyText = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', '');
  };

  const menuRows = [
    {
      icon: imgPersonal,
      iconStyle: styles.img6,
      label: 'Personal Details',
      onPress: () => navigation.navigate('PersonalInfo'),
    },
    {
      icon: imgInsurance,
      iconStyle: styles.img8,
      label: 'Insurance Management',
      onPress: () => navigation.getParent()?.navigate('Products' as never),
    },
    {
      icon: imgPrivacy,
      iconStyle: styles.img9,
      label: 'Privacy & Security',
      onPress: () => navigation.navigate('PrivacySecurity'),
    },
    {
      icon: imgHelp,
      iconStyle: styles.img9,
      label: 'Help Center',
      onPress: () => navigation.navigate('Support'),
    },
    {
      icon: imgFamily,
      iconStyle: styles.img11,
      label: 'My Family & Assets',
      onPress: () => navigation.navigate('FamilyAssets'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header section – same background image as Vue */}
        <ImageBackground
          source={imgBg}
          style={[styles.section, { paddingTop: insets.top + 14 }]}
          resizeMode="stretch"
        >
          {/* Top bar: back | invisible spacer | AI + notification */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>

            {/* visibility:hidden spacer – matches Vue layout */}
            <Text style={styles.hiddenText}>EN | BM | ZH</Text>

            <View style={styles.rightIcons}>
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('AIChat' as never)}
              >
                <AIIconSvg width={26.5} height={21} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ml13}
                onPress={() => navigation.getParent()?.navigate('Notification' as never)}
              >
                {unreadCount > 0 ? (
                  <NotifDotSvg width={28} height={27.5} />
                ) : (
                  <NotifIconSvg width={28} height={27.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar block */}
          <View style={styles.avatarBlock}>
            <View style={styles.section2} />
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.image3, styles.pos]} />
            ) : (
              <View style={[styles.image3, styles.pos, styles.fallbackAvatar]}>
                <Text style={styles.fallbackText}>{fallbackLetter}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('QRCode')} style={styles.pos2}>
              <Image source={imgQr} style={styles.image4} />
            </TouchableOpacity>
          </View>

          <Text style={styles.text2} numberOfLines={1}>
            {displayName.toUpperCase() || 'USER'}
          </Text>

          {!!uniqueId && (
            <View style={styles.uidWrapper}>
              <Text style={styles.text3}>User ID : {uniqueId}</Text>
            </View>
          )}

          {!!invitationCode && (
            <TouchableOpacity
              style={styles.referralWrapper}
              onPress={() => navigation.navigate('QRCode')}
            >
              <Text style={styles.text3}>Referral Code : {invitationCode}</Text>
              <TouchableOpacity onPress={() => copyText(invitationCode)}>
                <Image source={imgCopy} style={styles.image5} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {!isMember && (
            <TouchableOpacity
              style={styles.textWrapper}
              onPress={() => navigation.getParent()?.navigate('Membership' as never)}
            >
              <Text style={styles.text4}>Be a member</Text>
            </TouchableOpacity>
          )}
        </ImageBackground>

        {/* White menu card – overlaps header with negative margin */}
        <View style={styles.section3}>

          <TouchableOpacity style={styles.menuRow} onPress={menuRows[0].onPress}>
            <View style={styles.menuLeft}>
              <Image source={menuRows[0].icon} style={menuRows[0].iconStyle} />
              <Text style={styles.text5}>{menuRows[0].label}</Text>
            </View>
            <Image source={imgChevron} style={styles.image7} />
          </TouchableOpacity>

          {menuRows.slice(1).map((row) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.menuRow, styles.group2]}
              onPress={row.onPress}
            >
              <View style={styles.menuLeft}>
                <Image source={row.icon} style={row.iconStyle} />
                <Text style={styles.text6}>{row.label}</Text>
              </View>
              <Image source={imgChevron} style={styles.image7} />
            </TouchableOpacity>
          ))}

          <View style={styles.btnWrapper}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionWrapper}>
          <Text style={styles.versionText}>
            v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  section: {
    paddingHorizontal: 14,
    paddingBottom: 156,
    alignItems: 'center',
  },

  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hiddenText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    opacity: 0,
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ml13: {
    marginLeft: 13,
  },

  avatarBlock: {
    marginTop: 32,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section2: {
    position: 'absolute',
    backgroundColor: '#ff9a02',
    borderRadius: 55,
    width: 110,
    height: 110,
  },

  image3: {
    borderRadius: 55,
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: '#f7cb06',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
    elevation: 6,
  },

  pos: {
    position: 'absolute',
  },

  fallbackAvatar: {
    backgroundColor: '#ff9a02',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '700',
  },

  image4: {
    width: 28.5,
    height: 28.5,
  },

  pos2: {
    position: 'absolute',
    bottom: '15%',
    right: -20,
  },

  text2: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 25.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    maxWidth: '90%',
    textAlign: 'center',
  },

  uidWrapper: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  referralWrapper: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  text3: {
    marginRight: 8,
    color: '#ffffff',
    fontSize: 18.5,
    fontWeight: '700',
    lineHeight: 20,
  },

  image5: {
    width: 15,
    height: 19,
  },

  textWrapper: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f3dbb6',
    borderRadius: 30,
    alignItems: 'center',
    width: 96,
  },

  text4: {
    color: '#6a3b11',
    fontWeight: '700',
    fontSize: 12,
  },

  section3: {
    marginTop: -122,
    paddingTop: 42,
    paddingHorizontal: 46,
    paddingBottom: 23,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
  },

  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  group2: {
    marginTop: 32,
  },

  img6:  { width: 21, height: 13, resizeMode: 'contain' },
  img8:  { width: 21, height: 15, resizeMode: 'contain' },
  img9:  { width: 20, height: 21, resizeMode: 'contain' },
  img11: { width: 24, height: 18, resizeMode: 'contain' },

  text5: {
    marginLeft: 18,
    fontSize: 14,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 20,
  },

  text6: {
    marginLeft: 19,
    fontSize: 14,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 20,
  },

  image7: {
    width: 6,
    height: 10,
    resizeMode: 'contain',
  },

  btnWrapper: {
    alignItems: 'center',
    marginTop: 19,
  },

  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 36,
    backgroundColor: '#f3dbb6',
    borderRadius: 30,
    alignItems: 'center',
  },

  logoutText: {
    color: '#6a3b11',
    fontWeight: '700',
    fontSize: 14,
  },

  versionWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },

  versionText: {
    color: '#b0b0b0',
    fontSize: 12,
    fontWeight: '400',
  },
});