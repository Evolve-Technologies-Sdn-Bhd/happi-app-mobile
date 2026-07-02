/**
 * Redeem Voucher Screen â€” Buy voucher with HAPPIcoins + PIN verification
 * Matches happi-app-customer/src/views/voucher/redeem/index.vue
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { TextInput } from '../../../shared/components/TextInput';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Toast, HtmlText, Header } from '../../../shared/components';
import { useToast } from '../../../shared/hooks/useToast';
import { useUserStore } from '../../../store';
import { AppConfig } from '../../../shared/constants/config';
import voucherApi from '../../../api/voucher';
import dayjs from 'dayjs';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherRedeem'>;
type RouteProps = RouteProp<VoucherStackParamList, 'VoucherRedeem'>;

const PIN_LENGTH = 4;
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'âŒ«'];

export const RedeemVoucherScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const { voucherId } = route.params;
  const balance = useUserStore((s) => s.balance);
  const purchaseMembershipList = useUserStore((s) => s.purchaseMembershipList);
  const getUserBalanceAction = useUserStore((s) => s.getUserBalanceAction);

  const [voucherInfo, setVoucherInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const hasValidMembership = React.useMemo(() => {
    if (!purchaseMembershipList?.length) return false;
    const today = new Date();
    return purchaseMembershipList.some((item: any) => {
      if (!item.expiryDate) return true;
      return new Date(item.expiryDate.replace(/-/g, '/')) >= today;
    });
  }, [purchaseMembershipList]);

  const expiryDays = voucherInfo.expiryDate
    ? dayjs(voucherInfo.expiryDate).diff(dayjs(), 'day')
    : 0;

  const cardImgUrl = voucherInfo.cardImgUrl
    ? voucherInfo.cardImgUrl.startsWith('http')
      ? voucherInfo.cardImgUrl
      : `${AppConfig.imgBaseUrl}/${voucherInfo.cardImgUrl.replace(/^\//, '')}`
    : null;

  console.log('💳 RedeemVoucherScreen Debug');
  console.log('cardImgUrl INPUT:', voucherInfo.cardImgUrl);
  console.log('cardImgUrl OUTPUT:', cardImgUrl);
  console.log('description length:', voucherInfo.description?.length);
  console.log('description preview:', voucherInfo.description?.substring(0, 100));

  const canAfford = balance >= (voucherInfo.coinDeduction || 0);

  const loadVoucher = useCallback(async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getVoucherInfo(voucherId);
      if ((res as any).success) {
        setVoucherInfo((res as any).data);
      } else {
        showToast((res as any).msg || 'Failed to load voucher', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [voucherId]);

  useEffect(() => { loadVoucher(); }, [loadVoucher]);

  const onRedeemPress = () => {
    if (!hasValidMembership) {
      showToast('Only members can redeem vouchers. Please purchase a membership first.', 'warning');
      return;
    }
    if (!canAfford) {
      showToast(`Insufficient coins. You need ${voucherInfo.coinDeduction} HAPPIcoins.`, 'warning');
      return;
    }
    setShowConfirm(true);
  };

  const onConfirmRedeem = () => {
    setShowConfirm(false);
    setPin('');
    setShowPin(true);
  };

  const onNumpadPress = (key: string) => {
    if (key === 'âŒ«') {
      setPin((p) => p.slice(0, -1));
    } else if (key !== '' && pin.length < PIN_LENGTH) {
      setPin((p) => p + key);
    }
  };

  const onVerifyPin = async () => {
    if (pin.length !== PIN_LENGTH) {
      showToast('Please enter your 4-digit PIN', 'warning');
      return;
    }
    try {
      setRedeemLoading(true);
      const pinRes = await voucherApi.pinVerify(pin);
      if (!(pinRes as any).success) {
        showToast((pinRes as any).msg || 'Invalid PIN', 'error');
        setPin('');
        return;
      }

      const redeemRes = await voucherApi.redeemVoucher(voucherId);
      if ((redeemRes as any).success) {
        const voucherItemId = (redeemRes as any).data?.id || (redeemRes as any).data?.voucherItemId || '';
        setShowPin(false);
        await getUserBalanceAction();
        navigation.navigate('RedeemSuccess', { voucherId, voucherItemId: String(voucherItemId) });
      } else {
        showToast((redeemRes as any).msg || 'Redemption failed', 'error');
        setPin('');
      }
    } catch (e) {
      showToast('Network error', 'error');
      setPin('');
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color="#FDB813" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Header
        title={voucherInfo.mode === 2 ? 'HAPPI Merchant' : 'HAPPI Voucher'}
        showBack
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Voucher card */}
        <View style={styles.voucherCard}>
          {cardImgUrl && (
            <Image source={{ uri: cardImgUrl }} style={styles.cardImage} contentFit="cover" />
          )}
          <View style={styles.cardRight}>
            <Text style={styles.cardName}>{voucherInfo.voucherName}</Text>
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={14} color="#808080" />
              <Text style={styles.expiryText}>Expires in {expiryDays} days</Text>
            </View>
            <Text style={styles.coinCost}>{voucherInfo.coinDeduction} HAPPIcoins</Text>
          </View>
        </View>

        {/* Description */}
        {!!voucherInfo.description && (
          <View style={styles.descContainer}>
            <HtmlText html={voucherInfo.description} baseStyle={styles.descText} />
          </View>
        )}

        {/* Redeem With section */}
        <View style={styles.redeemSection}>
          <Text style={styles.redeemLabel}>Redeem With</Text>
          <Text style={styles.redeemCoins}>{voucherInfo.coinDeduction} HAPPIcoins</Text>
          <Text style={styles.availableCoins}>Available: {balance} HAPPIcoins</Text>
        </View>

        {!canAfford && (
          <Text style={styles.insufficientText}>Insufficient HAPPIcoins to redeem this voucher</Text>
        )}

        <TouchableOpacity
          style={[styles.redeemBtn, (!canAfford || !hasValidMembership) && styles.redeemBtnDisabled]}
          onPress={onRedeemPress}
          activeOpacity={0.85}
        >
          <Text style={styles.redeemBtnText}>Redeem</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirm Redemption?</Text>
            <Text style={styles.modalDesc}>
              You will use {voucherInfo.coinDeduction} HAPPIcoins to redeem "{voucherInfo.voucherName}".
            </Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirmRedeem}>
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN modal */}
      <Modal visible={showPin} transparent animationType="slide">
        <View style={styles.pinOverlay}>
          <TouchableOpacity style={styles.pinDismiss} onPress={() => setShowPin(false)} />
          <View style={[styles.pinSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.pinHandle} />
            <Text style={styles.pinTitle}>Redeem Voucher</Text>
            <Text style={styles.pinSubtitle}>Enter the 4-digit PIN</Text>
            <Text style={styles.pinSubtitle}>to redeem your voucher</Text>

            {/* PIN dots */}
            <View style={styles.pinDots}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]}>
                  <Text style={styles.pinDigit}>{pin[i] ? 'â—' : ''}</Text>
                </View>
              ))}
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
              {NUMPAD.map((key, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.numpadKey, key === '' && styles.numpadKeyEmpty]}
                  onPress={() => onNumpadPress(key)}
                  disabled={key === ''}
                >
                  <Text style={[styles.numpadKeyText, key === 'âŒ«' && styles.backspaceText]}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.pinVerifyBtn, (pin.length < PIN_LENGTH || redeemLoading) && styles.pinVerifyBtnDisabled]}
              onPress={onVerifyPin}
              disabled={pin.length < PIN_LENGTH || redeemLoading}
            >
              {redeemLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.pinVerifyText}>Verify Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd' },
  page: { flex: 1, backgroundColor: '#fdfdfd' },
  content: { padding: 20 },
  voucherCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardImage: { width: 110, height: 110, borderRadius: 12 },
  cardRight: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#343434' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { fontSize: 13, color: '#808080' },
  coinCost: { fontSize: 16, fontWeight: '800', color: '#FDB813' },
  descContainer: { marginBottom: 20 },
  descText: { fontSize: 14, color: '#808080', lineHeight: 20 },
  redeemSection: {
    backgroundColor: '#FFF8E7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  redeemLabel: { fontSize: 13, color: '#808080', marginBottom: 4 },
  redeemCoins: { fontSize: 22, fontWeight: '900', color: '#343434', marginBottom: 4 },
  availableCoins: { fontSize: 13, color: '#808080' },
  insufficientText: { color: '#ff4d4f', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  redeemBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  redeemBtnDisabled: { backgroundColor: '#d0d0d0' },
  redeemBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Confirm modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#343434', marginBottom: 10 },
  modalDesc: { fontSize: 14, color: '#808080', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalConfirmBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 25,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalCancelBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  modalCancelText: { color: '#808080', fontSize: 15 },
  // PIN modal
  pinOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pinDismiss: { flex: 1 },
  pinSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  pinHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pinTitle: { fontSize: 18, fontWeight: '700', color: '#343434', textAlign: 'center', marginBottom: 6 },
  pinSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28 },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  pinDigit: { fontSize: 14, color: '#343434' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 20 },
  numpadKey: {
    width: 80,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyEmpty: { backgroundColor: 'transparent' },
  numpadKeyText: { fontSize: 22, fontWeight: '600', color: '#343434' },
  backspaceText: { fontSize: 20 },
  pinVerifyBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  pinVerifyBtnDisabled: { backgroundColor: '#d0d0d0' },
  pinVerifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  membershipWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  membershipWarningText: { fontSize: 13, color: '#856404', textAlign: 'center' },
});

