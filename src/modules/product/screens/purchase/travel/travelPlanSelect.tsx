/**
 * Travel Plan Selection
 * Ported from happi-app-customer/src/views/purchase/travel/api_step_1_5_offer_select.vue
 *
 * Presents First Plan and Executive Plan side by side.
 * User selects one → Continue → TravelStep4
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelPlanSelect'>;

const fmtRM = (val: number) => {
  if (!val || isNaN(val)) return 'RM 0.00';
  return 'RM ' + Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getAddonPremium = (pricing: any): number => {
  try {
    const codes = ['Cruise', 'AnnualDomestic'];
    const fromTop = (pricing?.chargeItems || []).find((it: any) => codes.includes(String(it.code)));
    if (fromTop?.totalPremium != null) return Number(fromTop.totalPremium);
    const ip = Array.isArray(pricing?.individualPricing) ? pricing.individualPricing[0] : null;
    const fromIp = ip && Array.isArray(ip.chargeItems)
      ? ip.chargeItems.find((it: any) => codes.includes(String(it.code)))
      : null;
    if (fromIp?.totalPremium != null) return Number(fromIp.totalPremium);
  } catch {}
  return 0;
};

const pickTax = (pricing: any, code: string): number => {
  try {
    const fromTop = (pricing?.taxes || []).find((t: any) => String(t.code).toUpperCase() === code.toUpperCase());
    if (fromTop?.amount != null) return Number(fromTop.amount);
    const firstItem = Array.isArray(pricing?.chargeItems) ? pricing.chargeItems[0] : null;
    const fromItem = firstItem && Array.isArray(firstItem.taxes)
      ? firstItem.taxes.find((t: any) => String(t.code).toUpperCase() === code.toUpperCase())
      : null;
    if (fromItem?.amount != null) return Number(fromItem.amount);
  } catch {}
  return 0;
};

const TravelPlanSelect: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {
    productId, categoryCode, companyId,
    tripType, coverageType, adultCount, childCount,
    country, zone, departDate, returnDate, addonChecked,
    families, offers: offersJson,
    quoteId, quoteStartDate, quoteEndDate, quoteRegionCode,
  } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const isAnnual = tripType === 2;

  const firstPlanCode = isAnnual ? 'PFIA' : 'PFIS';
  const execPlanCode = isAnnual ? 'PEXA' : 'PEXS';

  const offers: any[] = (() => {
    try { return offersJson ? JSON.parse(offersJson) : []; } catch { return []; }
  })();

  const [selectedCode, setSelectedCode] = useState<string>('');

  useEffect(() => {
    if (offers.find(o => o?.plan?.code === firstPlanCode)) {
      setSelectedCode(firstPlanCode);
    } else if (offers.find(o => o?.plan?.code === execPlanCode)) {
      setSelectedCode(execPlanCode);
    }
  }, []);

  const getPriceByPlan = (planCode: string): number => {
    const offer = offers.find(o => o?.plan?.code === planCode);
    return offer?.pricing?.totalPrice ? Number(offer.pricing.totalPrice) : 0;
  };

  const handleContinue = () => {
    if (!selectedCode) {
      Alert.alert('', 'Please select a plan to continue.');
      return;
    }
    const selectedOffer = offers.find(o => o?.plan?.code === selectedCode);
    if (!selectedOffer?.pricing) {
      Alert.alert('', 'Selected plan is unavailable. Please go back and try again.');
      return;
    }
    const pricing = selectedOffer.pricing;
    const addOnAmount = getAddonPremium(pricing);
    const basePremium = Number(pricing.basePrice ?? 0);
    const stampDuty = pickTax(pricing, 'Stamp');
    const serviceTax = 0;
    const totalPayable = Number(pricing.totalPrice ?? basePremium + addOnAmount + stampDuty);
    const resolvedQuoteId = selectedOffer.quoteId || quoteId;
    const resolvedStart =
      selectedOffer?.policyDate?.startDate?.date ||
      selectedOffer?.tripDate?.startDate?.date ||
      quoteStartDate;
    const resolvedEnd =
      selectedOffer?.policyDate?.endDate?.date ||
      selectedOffer?.tripDate?.endDate?.date ||
      quoteEndDate;
    const resolvedRegion = (selectedOffer?.region?.code) || quoteRegionCode;

    const quoteData = JSON.stringify({
      quoteId: resolvedQuoteId,
      basePremium,
      addOnAmount,
      totalPayable,
      totalTax: Number(pricing.totalTax ?? 0),
      stampDuty,
      serviceTax,
    });

    navigation.navigate('TravelStep4', {
      productId, categoryCode, companyId,
      tripType, coverageType, adultCount, childCount,
      country, zone, departDate, returnDate, addonChecked,
      families,
      offers: offersJson,
      quoteId: resolvedQuoteId,
      quoteStartDate: resolvedStart,
      quoteEndDate: resolvedEnd,
      quoteRegionCode: resolvedRegion,
      planCode: selectedCode,
      quoteData,
    });
  };

  const PlanCard: React.FC<{ planCode: string; label: string }> = ({ planCode, label }) => {
    const price = getPriceByPlan(planCode);
    const available = offers.some(o => o?.plan?.code === planCode);
    const selected = selectedCode === planCode;

    return (
      <TouchableOpacity
        style={[styles.planCard, selected && styles.planCardActive, !available && styles.planCardDisabled]}
        onPress={() => available && setSelectedCode(planCode)}
        activeOpacity={available ? 0.8 : 1}
      >
        <Text style={[styles.planName, selected && styles.planNameActive]}>{label}</Text>
        <Text style={[styles.planPrice, selected && styles.planPriceActive]}>
          {available ? `Total Price\n${fmtRM(price)}` : 'N/A'}
        </Text>
        <View style={[styles.selectBtn, selected && styles.selectBtnActive]}>
          <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>
            {selected ? 'Selected' : 'Select'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.headerSection}>
        <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={sharedStyles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={config.backColor} />
                <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={sharedStyles.headerTextBlock}>
              <Text style={sharedStyles.headerTitle}>{config.title}</Text>
              {!!config.subTitle && <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Select Your Plan</Text>

        {/* Plan cards */}
        <View style={styles.plansRow}>
          <PlanCard planCode={firstPlanCode} label="First Plan" />
          <PlanCard planCode={execPlanCode} label="Executive Plan" />
        </View>

        {offers.length === 0 && (
          <Text style={styles.noOffersText}>No plans available. Please go back and try again.</Text>
        )}

        {/* Continue */}
        <TouchableOpacity style={sharedStyles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  sectionTitle: {
    color: '#343434',
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },

  plansRow: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },

  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.primary,
  },
  planCardActive: { backgroundColor: Colors.primary },
  planCardDisabled: { opacity: 0.4 },

  planName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#808080',
    marginBottom: 10,
    textAlign: 'center',
  },
  planNameActive: { color: '#FFFFFF' },

  planPrice: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#343434',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  planPriceActive: { color: '#FFFFFF' },

  selectBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  selectBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  selectBtnText: { fontSize: 13, fontFamily: FontFamily.bold, fontWeight: '700', color: Colors.primary },
  selectBtnTextActive: { color: Colors.primary },

  noOffersText: {
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default TravelPlanSelect;
