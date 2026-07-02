/**
 * Membership Detail Screen
 * Ported from happi-app-customer/src/views/membership/detail.vue
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Dimensions,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { Colors } from '../../../shared/constants/colors';
import { useUserStore } from '../../../store';
import { HtmlText } from '../../../shared/components/HtmlText';
import api, { getOssImg } from '../../../api';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Mirror the Vue card ratio: 382w × 220h
const CARD_W = SCREEN_WIDTH - 48; // 24px margin each side
const CARD_H = Math.round(CARD_W * (220 / 382));

type RouteProps = RouteProp<MembershipStackParamList, 'MembershipDetail'>;
type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipDetail'>;

export const MembershipDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const { membershipId } = route.params;

  const userInfo = useUserStore((state) => state.info);
  const token = useUserStore((state) => state.token);

  const [membershipInfo, setMembershipInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [coverageVisible, setCoverageVisible] = useState(false);

  const isLoggedIn = !!(token && userInfo?.id);

  // Display name logic (matches detail.vue)
  const displayName = React.useMemo(() => {
    if (!isLoggedIn) return 'YOUR NAME HERE';
    let name = String(userInfo?.realname || '');
    if (!name) return 'YOUR NAME HERE';

    const maxLength = 26;
    if (name.length <= maxLength) return name.toUpperCase();

    const splitPatterns = [
      { pattern: /\s+bin\s+/i, replacement: '\nBIN ' },
      { pattern: /\s+binti\s+/i, replacement: '\nBINTI ' },
      { pattern: /\s+a\/l\s+/i, replacement: '\nA/L ' },
      { pattern: /\s+a\/p\s+/i, replacement: '\nA/P ' },
    ];

    for (const { pattern, replacement } of splitPatterns) {
      if (pattern.test(name)) {
        return name.replace(pattern, replacement).toUpperCase();
      }
    }

    let breakPoint = name.lastIndexOf(' ', maxLength);
    if (breakPoint === -1 || breakPoint < 10) breakPoint = maxLength;

    return `${name.substring(0, breakPoint).trim()}\n${name.substring(breakPoint).trim()}`.toUpperCase();
  }, [userInfo, isLoggedIn]);

  const displayMemberId = React.useMemo(() => {
    if (!isLoggedIn) return '----';
    return userInfo?.uniqueId || '----';
  }, [userInfo, isLoggedIn]);

  // Load membership info from API (matches detail.vue getMembershipInfo)
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await api.getMembershipInfo(membershipId);
        if (res.success && res.data) {
          setMembershipInfo(res.data);
        }
      } catch (error) {
        console.error('❌ getMembershipInfo error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [membershipId]);

  // sumInsuredTips with placeholder replaced (matches Vue computed)
  const sumInsuredTips = React.useMemo(() => {
    if (!membershipInfo.sumInsuredTips) return '';
    const formatted = membershipInfo.sumInsured
      ? `RM ${Number(membershipInfo.sumInsured).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
      : '';
    return String(membershipInfo.sumInsuredTips).replace('#sum_insured#', formatted);
  }, [membershipInfo]);

  // Join Now — navigate directly to confirm page
  const handleJoinNow = () => {
    if (!isLoggedIn) {
      Alert.alert('Account Required', 'You need to create an account first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.getParent()?.navigate('Auth' as never) },
      ]);
      return;
    }
    navigation.navigate('MembershipPurchaseConfirm', { membershipId });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const cardImageUrl = membershipInfo.cardImgUrl ? getOssImg(membershipInfo.cardImgUrl) : '';

  return (
    <View style={styles.container}>

      {/* ── GROUP SECTION: background image + navbar ── */}
      <View style={styles.groupSection}>
        <ImageBackground
          source={require('../../../../assets/products/header-bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Memberships</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* ── CARD: sibling of groupSection, overlaps its rounded bottom ── */}
      <View style={styles.cardWrapper}>
        <View style={[styles.cardContainer, { width: CARD_W, height: CARD_H }]}>
          {cardImageUrl ? (
            <Image
              source={{ uri: cardImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.cardPlaceholder]} />
          )}
          <Text
            style={[
              styles.cardName,
              {
                top: Math.round(CARD_H * (80 / 220)),
                left: Math.round(CARD_W * (28 / 382)),
              },
            ]}
          >
            {displayName}
          </Text>
          <View
            style={[
              styles.memberIdWrapper,
              {
                bottom: Math.round(CARD_H * (30 / 220)),
                left: Math.round(CARD_W * (28 / 382)),
              },
            ]}
          >
            <Text style={styles.memberIdLabel}>Member ID</Text>
            <Text style={styles.memberIdValue}>{displayMemberId}</Text>
          </View>
        </View>
      </View>

      {/* ── GROUP_2: Subscription fee (fixed) ── */}
      <View style={styles.group2}>
        <Text style={styles.feeLabel}>Subscription fee</Text>
        <Text style={styles.feeAmount}>
          {membershipInfo.subscriptionFee
            ? `RM ${Number(membershipInfo.subscriptionFee).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
            : '—'}
        </Text>
        <Text style={styles.feePerYear}>per year</Text>
      </View>

      {/* ── GROUP_3: HAPPIcoins (fixed) ── */}
      <View style={styles.group3}>
        <Image
          source={require('../../../../assets/images/coin-icon.png')}
          style={styles.coinIcon}
          contentFit="contain"
        />
        <Text style={styles.coinText}>
          {membershipInfo.coinValue ?? '—'} HAPPIcoins
        </Text>
      </View>

      {/* ── CONTENT-SCROLL: only sumInsuredTips scrolls (matches Vue content-scroll) ── */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollInner}
        showsVerticalScrollIndicator={false}
      >
        {!!sumInsuredTips && (
          <View style={styles.group4}>
            <HtmlText html={sumInsuredTips} baseStyle={styles.detailHtml} />
          </View>
        )}
      </ScrollView>

      {/* ── GROUP_5: More information (sticky bottom) ── */}
      <TouchableOpacity
        style={styles.group5}
        onPress={() => setCoverageVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.moreInfoText}>More information</Text>
        <Ionicons name="information-circle-outline" size={20} color="#343434" />
      </TouchableOpacity>

      {/* ── Join Now button (sticky bottom) ── */}
      <SafeAreaView edges={['bottom']} style={styles.joinButtonWrapper}>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinNow}
          activeOpacity={0.85}
        >
          <Text style={styles.joinButtonText}>Join Now</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Coverage bottom-sheet ── */}
      <Modal
        visible={coverageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverageVisible(false)}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setCoverageVisible(false)}
        />
        {/* Sheet pinned to bottom */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.bottomSheet}>
              <Text style={styles.sheetTitle}>More Information</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
                {membershipInfo.coverage ? (
                  <HtmlText html={membershipInfo.coverage} baseStyle={styles.sheetHtml} />
                ) : (
                  <Text style={styles.sheetHtml}>No coverage information available.</Text>
                )}
              </ScrollView>
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setCoverageVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Group Section: rounded bottom, bg image behind navbar only ──
  groupSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingBottom: 175,
  },

  headerContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    lineHeight: 32,
  },

  // card-wrapper — sibling of groupSection, no elevation so Android uses render order
  cardWrapper: {
    marginTop: -120,
    marginHorizontal: 24,
    alignItems: 'center',
  },

  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  cardPlaceholder: {
    backgroundColor: '#333355',
  },

  cardName: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  memberIdWrapper: {
    position: 'absolute',
    flexDirection: 'column',
    gap: 2,
  },

  memberIdLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: FontFamily.medium,
  },

  memberIdValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: FontFamily.bold,
  },

  // ── group_2 (fee section) ──
  group2: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingBottom: 42,
    backgroundColor: '#FDFDFD',
  },

  feeLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    lineHeight: 20,
  },

  feeAmount: {
    marginTop: 12,
    fontSize: 42,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#FDB813',
    lineHeight: 52,
  },

  feePerYear: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
  },

  // ── group_3 (coins) ──
  group3: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    paddingBottom: 16,
  },

  coinIcon: {
    width: 26,
    height: 26,
  },

  coinText: {
    marginLeft: 11,
    color: '#808080',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  // ── content-scroll: flex:1 so it fills remaining space between coins and bottom buttons ──
  contentScroll: {
    flex: 1,
  },

  contentScrollInner: {
    flexGrow: 1,
  },

  // ── group_4 (sumInsuredTips) ──
  group4: {
    marginTop: 40,
    marginHorizontal: 52,

  },

  detailHtml: {
    color: '#808080',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 22,
  },

  // ── group_5 (More information) ──
  group5: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  moreInfoText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    lineHeight: 20,
  },

  // ── Join Now ──
  joinButtonWrapper: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FDFDFD',
  },

  joinButton: {
    alignSelf: 'center',
    width: 274,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  // ── Coverage Modal (voucher filter sheet style) ──
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 40,
    paddingBottom: 40,
    minHeight: 376,
    maxHeight: '80%',
  },

  sheetTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#808080',
    marginBottom: 20,
  },

  sheetScroll: {
    maxHeight: 360,
  },

  sheetHtml: {
    fontSize: 14,
    color: '#808080',
  },

  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  sheetCloseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FDB813',
  },

  sheetCloseBtnText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});
