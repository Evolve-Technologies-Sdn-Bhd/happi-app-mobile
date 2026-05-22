/**
 * Voucher Countdown Screen — Active usage timer
 * Matches happi-app-customer/src/views/voucher/countdown.vue
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Toast } from '../../../shared/components';
import { useToast } from '../../../shared/hooks/useToast';
import voucherApi from '../../../api/voucher';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherCountdown'>;
type RouteProps = RouteProp<VoucherStackParamList, 'VoucherCountdown'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_API = (code: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`;

export const CountdownScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const { voucherItemId, mode, voucherCode, voucherName, countdownTime, remainingSeconds: initialRemaining } =
    route.params;

  const [remaining, setRemaining] = useState(Math.max(0, initialRemaining));
  const [isValidated, setIsValidated] = useState(false);
  const [isExpired, setIsExpired] = useState(initialRemaining <= 0);
  const [scanLoading, setScanLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isWarning = remaining <= 30 && !isExpired;
  const progress = countdownTime > 0 ? remaining / countdownTime : 0;

  const formattedTime = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleExpire = useCallback(async () => {
    setIsExpired(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await voucherApi.validateUsage(voucherItemId, '');
    } catch (e) {
      console.error('Expire validate error:', e);
    }
  }, [voucherItemId]);

  useEffect(() => {
    if (isExpired || isValidated) return;
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isExpired, isValidated, handleExpire]);

  const handleGoBack = () => {
    navigation.navigate('VoucherMy');
  };

  // Mode 2: scan store QR to validate
  const scanStoreQR = async () => {
    showToast('QR scanning requires device camera permissions. Use NFC or ask staff to scan.', 'info');
  };

  // The radius for SVG-style progress circle (drawn with View border)
  const CIRCLE_SIZE = 200;
  const STROKE = 8;
  const RADIUS = (CIRCLE_SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  // We use a simple filled arc via borderColor trick

  return (
    <LinearGradient
      colors={isExpired ? ['#ff6b6b', '#cc0000'] : isValidated ? ['#27ae60', '#1a7a40'] : ['#FDB813', '#FF8C00']}
      style={[styles.page, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isValidated ? 'Voucher Used' : isExpired ? 'Session Expired' : mode === 2 ? 'HAPPI Merchant' : 'HAPPI Voucher'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>

        {/* ---- Active state ---- */}
        {!isValidated && !isExpired && (
          <>
            {/* Countdown circle */}
            <View style={styles.circleWrapper}>
              <View style={[styles.circleOuter, isWarning && styles.circleWarning]}>
                <View style={styles.circleInner}>
                  <Text style={styles.countdownTime}>{formattedTime()}</Text>
                  <Text style={styles.countdownLabel}>remaining</Text>
                </View>
              </View>
            </View>

            <Text style={styles.voucherName}>{voucherName}</Text>

            {/* Mode 1: QR code */}
            {mode !== 2 && (
              <View style={styles.qrSection}>
                <Image
                  source={{ uri: QR_API(voucherCode) }}
                  style={styles.qrImage}
                  contentFit="contain"
                />
                <Text style={styles.voucherCode}>{voucherCode}</Text>
                <Text style={styles.qrInstruction}>Show this QR code to the merchant</Text>
              </View>
            )}

            {/* Mode 2: Scan QR / NFC */}
            {mode === 2 && (
              <View style={styles.validationSection}>
                <Text style={styles.validationInstruction}>Validate at the store</Text>
                <View style={styles.validationBtns}>
                  <TouchableOpacity style={styles.validationBtn} onPress={scanStoreQR} disabled={scanLoading}>
                    <View style={styles.validationBtnIcon}>
                      <Ionicons name="qr-code-outline" size={32} color="#FDB813" />
                    </View>
                    <Text style={styles.validationBtnLabel}>Scan Store QR</Text>
                  </TouchableOpacity>
                  <View style={styles.validationBtn}>
                    <View style={styles.validationBtnIcon}>
                      <Ionicons name="wifi-outline" size={32} color="#FDB813" />
                    </View>
                    <Text style={styles.validationBtnLabel}>Tap NFC</Text>
                  </View>
                </View>
                <Text style={styles.hintText}>
                  Scan the store's QR code or tap NFC to validate your voucher
                </Text>
              </View>
            )}

            {mode !== 2 && (
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>Present this to the merchant</Text>
                <Text style={styles.instructionSub}>
                  They will scan your voucher to complete the redemption
                </Text>
              </View>
            )}
          </>
        )}

        {/* ---- Success state ---- */}
        {isValidated && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultIconCircle, styles.successCircle]}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
            <Text style={styles.resultTitle}>Voucher Used Successfully</Text>
            <Text style={styles.resultSubtitle}>Thank you for using HappiSafe</Text>
            <TouchableOpacity style={styles.resultBtn} onPress={handleGoBack}>
              <Text style={styles.resultBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---- Expired state ---- */}
        {isExpired && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultIconCircle, styles.expiredCircle]}>
              <Ionicons name="close" size={48} color="#fff" />
            </View>
            <Text style={styles.resultTitle}>Voucher Session Expired</Text>
            <Text style={styles.resultSubtitle}>The validation window has ended</Text>
            <Text style={styles.resultNote}>Your voucher cannot be used anymore</Text>
            <TouchableOpacity style={[styles.resultBtn, styles.expiredBtn]} onPress={handleGoBack}>
              <Text style={styles.resultBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  // Countdown
  circleWrapper: { marginBottom: 24 },
  circleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWarning: { borderColor: '#fff', backgroundColor: 'rgba(255,80,80,0.2)' },
  circleInner: { alignItems: 'center' },
  countdownTime: { fontSize: 48, fontWeight: '900', color: '#fff' },
  countdownLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  voucherName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  // QR
  qrSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    marginBottom: 16,
  },
  qrImage: { width: 180, height: 180, marginBottom: 12 },
  voucherCode: { fontSize: 20, fontWeight: '700', color: '#343434', letterSpacing: 3, marginBottom: 6 },
  qrInstruction: { fontSize: 13, color: '#808080', textAlign: 'center' },
  // Validation (mode 2)
  validationSection: { alignItems: 'center', width: '100%' },
  validationInstruction: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 20 },
  validationBtns: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  validationBtn: { alignItems: 'center', gap: 8 },
  validationBtnIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationBtnLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  hintText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
  // Instructions
  instructions: { alignItems: 'center' },
  instructionText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  instructionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
  // Result states
  resultContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  resultIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCircle: { backgroundColor: 'rgba(255,255,255,0.3)' },
  expiredCircle: { backgroundColor: 'rgba(255,255,255,0.3)' },
  resultTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  resultSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  resultNote: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 30 },
  resultBtn: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 20,
  },
  expiredBtn: {},
  resultBtnText: { fontSize: 16, fontWeight: '700', color: '#343434' },
});
