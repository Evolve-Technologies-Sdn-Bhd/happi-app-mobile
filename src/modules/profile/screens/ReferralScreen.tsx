/**
 * QR Code / Referral Screen
 * UI matches happi-app-customer/src/views/profile/qrcode.vue
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { getOssImg } from '../../../api';
import { FontFamily } from '../../../shared/constants/fonts';

// PNG assets (same as profile page)
const imgBg   = require('../../../../assets/images/profile/profile-header-bg.png');
const imgCopy = require('../../../../assets/images/profile/profile-copy-icon.png');

export const ReferralScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const userInfo = useUserStore((state) => state.info);
  const getUserInfoAction = useUserStore((state) => state.getUserInfoAction);

  useFocusEffect(
    useCallback(() => {
      getUserInfoAction();
    }, [getUserInfoAction])
  );

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

  const invitationCode = (userInfo as any)?.invitationCode || userInfo?.referralCode || user?.referralCode || '';
  const uniqueId = userInfo?.uniqueId;
  const avatarUri = userInfo?.avatar ? getOssImg(userInfo.avatar) : user?.avatar || null;
  const fallbackLetter = ((userInfo as any)?.realname || displayName || '?').charAt(0).toUpperCase();

  const qrCodeUrl = invitationCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=212x212&data=${encodeURIComponent(invitationCode)}`
    : '';

  const copyCode = async () => {
    if (!invitationCode) return;
    await Clipboard.setStringAsync(invitationCode);
    Alert.alert('Copied', '');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header â€“ identical to profile page */}
        <ImageBackground
          source={imgBg}
          style={[styles.section, { paddingTop: insets.top + 14 }]}
          resizeMode="stretch"
        >
          {/* Top bar */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.hiddenText}>EN | BM | ZH</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarBlock}>
            <View style={styles.section2} />
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.image3, styles.pos]} />
            ) : (
              <View style={[styles.image3, styles.pos, styles.fallbackAvatar]}>
                <Text style={styles.fallbackText}>{fallbackLetter}</Text>
              </View>
            )}
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
            <View style={styles.referralWrapper}>
              <Text style={styles.text3}>Referral Code : {invitationCode}</Text>
              <TouchableOpacity onPress={copyCode}>
                <Image source={imgCopy} style={styles.image5} />
              </TouchableOpacity>
            </View>
          )}
        </ImageBackground>

        {/* QR Card â€“ white section overlapping header */}
        <View style={styles.section3}>
          <Text style={styles.qrTitle}>Scan QR Code</Text>

          <View style={styles.qrWrapper}>
            {qrCodeUrl ? (
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>No referral code available</Text>
              </View>
            )}
          </View>

          <Text style={styles.qrHint}>Share this code with your friends</Text>
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
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    opacity: 0,
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
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  text2: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 25.5,
    fontFamily: FontFamily.bold,
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
  },

  text3: {
    marginRight: 8,
    color: '#ffffff',
    fontSize: 18.5,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 20,
  },

  image5: {
    width: 15,
    height: 19,
  },

  // QR card â€“ overlaps header with negative margin
  section3: {
    marginTop: -100,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    alignItems: 'center',
  },

  qrTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 24,
  },

  qrWrapper: {
    width: 220,
    height: 220,
    // borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
  },

  qrImage: {
    width: 212,
    height: 212,
  },

  qrPlaceholder: {
    width: 212,
    height: 212,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  qrPlaceholderText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
  },

  qrHint: {
    marginTop: 20,
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
  },
});
