/**
 * Purchase Home Step 3 — Select Home + T&C
 * Ported from happi-app-customer/src/views/purchase/home/step_3.vue
 *
 * Shows "Select Your Home" button if none chosen, or a collapsible card of
 * the selected home. T&C checkbox + confirm dialog → HomeStep4.
 *
 * Home is selected by navigating to HomeSelectScreen and receiving the
 * result back via route.params.selectedHome (same pattern as FamilyMembers → addedNominee).
 */

import React, { useState, useCallback } from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import { Home } from '../../../../../api/home';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'HomeStep3'>;

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[rowStyles.row, !last && rowStyles.border]}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value || ''}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, minHeight: 44 },
  border: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 120, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  value: { flex: 1, fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const HomeStep3: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, isDamage, damageDetail, articles } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [targetHome, setTargetHome] = useState<Home | null>(null);
  const [tncChecked, setTncChecked] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(true);

  // ── Receive selected home from HomeSelectScreen ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      const selected = (route.params as any)?.selectedHome;
      if (selected) {
        try {
          const home: Home = JSON.parse(selected);
          setTargetHome(home);
        } catch (e) {
          console.warn('Failed to parse selectedHome', e);
        }
        navigation.setParams({ selectedHome: undefined } as any);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(route.params as any)?.selectedHome]),
  );

  const addressFull = targetHome
    ? [targetHome.address1, targetHome.address2].filter(Boolean).join(', ') || targetHome.address || ''
    : '';

  // ── Continue ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!targetHome?.id) {
      Alert.alert('', 'Please select your home');
      return;
    }
    if (!tncChecked) {
      Alert.alert('', 'Please accept the terms and conditions to proceed.');
      return;
    }
    setConfirmVisible(true);
  };

  const onConfirm = () => {
    setConfirmVisible(false);
    navigation.navigate('HomeStep4', {
      productId, categoryCode, companyId, isDamage, damageDetail, articles,
      targetHome: JSON.stringify({
        name: targetHome?.name || targetHome?.address1 || 'My Home',
        category: targetHome?.category || '',
        address1: targetHome?.address1 || targetHome?.address || '',
        address2: targetHome?.address2 || '',
        stateName: targetHome?.stateName || targetHome?.state || '',
        postcode: targetHome?.postcode || '',
      }),
    });
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={sharedStyles.headerSection}>
      <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
        <SafeAreaView edges={['top']}>
          <View style={sharedStyles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={sharedStyles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={config.backColor} />
              <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={sharedStyles.headerTextBlock}>
            <Text style={sharedStyles.headerTitle}>{config.title}</Text>
            {!!config.subTitle && (
              <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  return (
    <View style={sharedStyles.container}>
      {renderHeader()}

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Select Your Home button or Selected Home Card (Vue step_3) ── */}
        {!targetHome ? (
          <TouchableOpacity
            style={styles.selectHomeBtn}
            onPress={() =>
              navigation.navigate('HomeSelect', {
                productId, categoryCode, companyId, isDamage, damageDetail, articles,
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.selectHomeBtnText}>Select Your Home</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.homeCard}>
            <TouchableOpacity
              style={styles.homeCardHeader}
              onPress={() => setCardExpanded(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.homeCardTitle}>
                {targetHome.name || targetHome.address1 || 'My Home'}
              </Text>
              <Ionicons
                name={cardExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#808080"
              />
            </TouchableOpacity>

            {cardExpanded && (
              <View style={styles.homeCardBody}>
                {!!targetHome.category && <InfoRow label="Home Category" value={targetHome.category} />}
                <InfoRow label="Address" value={addressFull} />
                <InfoRow label="Postcode" value={targetHome.postcode} />
                <InfoRow label="State" value={targetHome.stateName || targetHome.state} />
                <View style={styles.removeRow}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setTargetHome(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── T&C Checkbox ── */}
        <TouchableOpacity
          style={styles.tncRow}
          onPress={() => setTncChecked(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, tncChecked && styles.checkboxActive]}>
            {tncChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.tncText}>
            I have read and agree to the Terms and Conditions for insurance purchase.
          </Text>
        </TouchableOpacity>

        {/* ── Continue ── */}
        <TouchableOpacity
          style={sharedStyles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Confirm Dialog ── */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Please Confirm Your Details</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmBackBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.confirmBackText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmOkBtn} onPress={onConfirm}>
                <Text style={styles.confirmOkText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  selectHomeBtn: {
    width: 200,
    height: 36,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  selectHomeBtnText: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
  },

  homeCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  homeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  homeCardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginRight: 8,
  },
  homeCardBody: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.3)',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  removeRow: { paddingVertical: 12, alignItems: 'flex-end' },
  removeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },
  removeBtnText: {
    color: '#FF4444',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 13,
  },

  tncRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 28,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.primary },
  tncText: { flex: 1, fontSize: 13, color: '#808080', fontFamily: FontFamily.regular, lineHeight: 20 },

  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmBtnRow: { flexDirection: 'row', gap: 12 },
  confirmBackBtn: {
    flex: 1,
    height: 42,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBackText: { fontSize: 15, color: '#808080', fontFamily: FontFamily.regular },
  confirmOkBtn: {
    flex: 1,
    height: 42,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmOkText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});

export default HomeStep3;

