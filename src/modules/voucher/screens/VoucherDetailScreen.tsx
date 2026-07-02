/**
 * Voucher Detail Screen
 * Matches happi-app-customer/src/views/voucher/detail.vue exactly
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Toast, HtmlText } from '../../../shared/components';
import { useToast } from '../../../shared/hooks/useToast';
import { AppConfig } from '../../../shared/constants/config';
import voucherApi from '../../../api/voucher';
import dayjs from 'dayjs';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherDetail'>;
type RouteProps = RouteProp<VoucherStackParamList, 'VoucherDetail'>;

const getOssImg = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${AppConfig.imgBaseUrl}/${url.replace(/^\//, '')}`;
};

export const VoucherDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const { voucherItemId } = route.params;

  const [voucherItemInfo, setVoucherItemInfo] = useState<any>({});
  const [voucherInfo, setVoucherInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [useLoading, setUseLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isUsed = voucherItemInfo.usageStatus === 1 || !!voucherItemInfo.usageDate;
  const isExpiredVoucher =
    voucherItemInfo.usageStatus === 2 ||
    (voucherItemInfo.expiryDate && dayjs().isAfter(dayjs(voucherItemInfo.expiryDate)));
  const expiryDays = voucherItemInfo.expiryDate
    ? dayjs(voucherItemInfo.expiryDate).diff(dayjs(), 'day')
    : 0;

  const loadVoucherItem = useCallback(async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getVoucherItemInfo(voucherItemId);
      if ((res as any).success) {
        const item = (res as any).data;
        setVoucherItemInfo(item);
        if (item.voucherId) {
          const parentRes = await voucherApi.getVoucherInfo(String(item.voucherId));
          if ((parentRes as any).success) {
            setVoucherInfo((parentRes as any).data ?? {});
          }
        }
      } else {
        showToast((res as any).msg || 'Failed to load voucher', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [voucherItemId]);

  useEffect(() => { loadVoucherItem(); }, [loadVoucherItem]);

  const confirmUseNow = async () => {
    setShowConfirmModal(false);
    try {
      setUseLoading(true);
      const res = await voucherApi.startUsage(voucherItemId);
      if ((res as any).success) {
        const data = (res as any).data;
        navigation.navigate('VoucherCountdown', {
          voucherItemId,
          mode: data.mode ?? voucherItemInfo.mode ?? 1,
          voucherCode: data.voucherCode ?? voucherItemInfo.voucherCode ?? '',
          voucherName: data.voucherName ?? voucherItemInfo.voucherName ?? '',
          countdownTime: data.countdownTime ?? 600,
          remainingSeconds: data.remainingSeconds ?? data.countdownTime ?? 600,
          merchantId: data.merchantId,
        });
      } else {
        showToast((res as any).msg || 'Failed to start usage', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    } finally {
      setUseLoading(false);
    }
  };

  const isMode2 = voucherItemInfo.mode === 2;
  const cardImgUrl = getOssImg(voucherItemInfo.cardImgUrl);
  const descHtml = voucherInfo.description || voucherItemInfo.description || '';

  console.log('=== Voucher Detail Debug ===');
  console.log('cardImgUrl INPUT:', voucherItemInfo.cardImgUrl);
  console.log('cardImgUrl OUTPUT:', cardImgUrl);
  console.log('descHtml length:', descHtml?.length);
  console.log('descHtml preview:', descHtml?.substring(0, 100));
  console.log('voucherInfo:', voucherInfo);

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color="#FDB813" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Nav row */}
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {isMode2 ? 'HAPPI Merchant' : 'HAPPI Voucher'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* group_2 � voucher card */}
        <View style={styles.group2}>
          {!!cardImgUrl && (
            <Image source={{ uri: cardImgUrl }} style={styles.image4} contentFit="cover" />
          )}
          <View style={styles.section2}>
            <Text style={styles.voucherName}>{voucherItemInfo.voucherName}</Text>
            <View style={styles.group4}>
              <Ionicons name="time-outline" size={14} color="#808080" />
              <Text style={styles.expiryText}> Expires in {expiryDays} days</Text>
            </View>
          </View>
        </View>

        {/* group_5 � Voucher Code (mode !== 2) */}
        {!isMode2 && (
          <View style={styles.group5}>
            <View style={styles.group5Header}>
              <Text style={styles.sectionFont}>Voucher Code</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(true)}>
                <Text style={styles.howToUse}>How to use</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.group6}>
              <Text style={styles.codeText}>*****</Text>
            </View>
            <Text style={styles.codeHint}>Press "Use Now" to reveal your code and start the timer</Text>
          </View>
        )}

        {/* Merchant instructions (mode === 2) */}
        {isMode2 && (
          <View style={[styles.group5, styles.merchantInstructions]}>
            <Text style={styles.sectionFont}>How to Use</Text>
            <View style={styles.instructionSteps}>
              {[
                'Visit the merchant store',
                'Click "Use at Store" below',
                'Scan the QR code at the counter',
                'Show the countdown timer to staff',
              ].map((step, i, arr) => (
                <View key={i} style={[styles.instructionStep, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* merchantdesc � HTML rich text description */}
        {!!descHtml && (
          <View style={styles.merchantDesc}>
            <HtmlText html={descHtml} baseStyle={styles.descBase} />
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaArea}>
          {voucherItemInfo.usageStatus === 0 && !isExpiredVoucher && (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => setShowConfirmModal(true)}
              disabled={useLoading}
              activeOpacity={0.85}
            >
              {useLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaBtnText}>Use Now</Text>
              )}
            </TouchableOpacity>
          )}
          {isUsed && (
            <View style={[styles.ctaBtn, styles.ctaBtnUsed]}>
              <Text style={styles.ctaBtnText}>Already Used</Text>
            </View>
          )}
          {isExpiredVoucher && !isUsed && (
            <View style={[styles.ctaBtn, styles.ctaBtnExpired]}>
              <Text style={[styles.ctaBtnText, { color: '#666' }]}>Expired</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.confirmModal}>
            <Ionicons name="ticket-outline" size={80} color="#FDB813" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Ready to Use?</Text>
            <Text style={styles.modalDesc}>
              {isMode2
                ? 'Once confirmed, you will need to scan QR or tap NFC at the store within the time limit.'
                : 'Once confirmed, the countdown timer will start. Show your voucher QR code to the merchant.'}
            </Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmUseNow}>
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirmModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd' },
  page: { flex: 1, backgroundColor: '#fdfdfd' },

  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#fdfdfd',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#343434' },

  content: { paddingHorizontal: 23 },

  /* group_2 */
  group2: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  image4: { width: 100, height: 100, borderRadius: 12, flexShrink: 0 },
  section2: { flex: 1, justifyContent: 'space-between' },
  voucherName: { fontSize: 16, fontWeight: '700', color: '#343434' },
  group4: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  expiryText: { fontSize: 10, color: '#808080' },

  /* group_5 */
  group5: { marginTop: 38 },
  group5Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionFont: { fontSize: 17, fontWeight: '700', color: '#343434' },
  howToUse: { fontSize: 12, color: '#FDB813', fontWeight: '500' },

  /* group_6 � code box */
  group6: {
    borderWidth: 1, borderColor: '#FDB813', borderRadius: 10,
    padding: 18, marginBottom: 8,
  },
  codeText: { fontSize: 22, fontWeight: '700', color: '#343434', letterSpacing: 6 },
  codeHint: { fontSize: 12, color: '#aaa' },

  /* Merchant instructions */
  merchantInstructions: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  instructionSteps: { marginTop: 15 },
  instructionStep: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FDB813', alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  stepNumberText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#343434', lineHeight: 20 },

  /* merchantdesc */
  merchantDesc: { marginTop: 20, alignItems: 'center' },
  descBase: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center' },

  /* CTA */
  ctaArea: { alignItems: 'center', marginTop: 62 },
  ctaBtn: {
    backgroundColor: '#FDB813', borderRadius: 30,
    paddingVertical: 17, width: 269, alignItems: 'center',
  },
  ctaBtnUsed: { backgroundColor: '#808080', opacity: 0.6 },
  ctaBtnExpired: { backgroundColor: '#d9d9d9', opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 30, paddingHorizontal: 40,
    width: 300, alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#343434', marginBottom: 10, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#808080', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  confirmBtn: {
    backgroundColor: '#FDB813', borderRadius: 30,
    paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1, borderColor: '#FDB813', borderRadius: 30,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  cancelText: { color: '#FDB813', fontSize: 16, fontWeight: '700' },
});
