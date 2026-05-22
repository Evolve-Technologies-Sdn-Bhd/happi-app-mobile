/**
 * Purchase Travel Step 3 — Quote Loading
 * Ported from happi-app-customer/src/views/purchase/travel/api_step_0.vue
 *
 * Shows loading spinner while calling the quote API.
 * On success → navigate to TravelPlanSelect with offers.
 */

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import customerApi from '../../../../../api/customer';
import { quote } from '../../../../../api/order';
import { countryNameToIso2 } from '../../../../../utils/countryNameToIso2';
import { FamilyMember } from '../../../../../api/family';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelStep3'>;

const TravelStep3: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {
    productId, categoryCode, companyId,
    tripType, coverageType, adultCount, childCount,
    country, zone, departDate, returnDate, addonChecked, families: familiesJson,
  } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const isAnnual = tripType === 2;

  useEffect(() => {
    const timer = setTimeout(() => doQuote(), 1500);
    return () => clearTimeout(timer);
  }, []);

  const doQuote = async () => {
    try {
      // Load customer info
      const custRes = await customerApi.getCustomerInfo();
      const customer = (custRes as any)?.data ?? (custRes as any) ?? {};

      const families: FamilyMember[] = (() => {
        try { return familiesJson ? JSON.parse(familiesJson) : []; } catch { return []; }
      })();

      const startDateYmd = dayjs(departDate).format('YYYY-MM-DD');
      const endDateYmd = dayjs(returnDate).format('YYYY-MM-DD');

      const coverTypeCode = coverageType === 1 ? 'II' : 'IF';
      const regionCode = zone; // already 'DDOM', 'DZ1', 'DZ2'
      const iso2Country = countryNameToIso2(country);

      // Build insured persons
      const insuredPersons: Array<{ realname: string; userId?: string; familyId?: string }> = [];
      if (customer?.realname) {
        insuredPersons.push({ realname: customer.realname, userId: customer.id });
      }
      families.forEach(f => {
        const name = (f as any).realname || f.name || '';
        if (name) insuredPersons.push({ realname: name, familyId: f.id });
      });

      // Build optional covers
      const optionalCovers: Array<{ Code: string }> = addonChecked
        ? [{ Code: isAnnual ? 'AnnualDomestic' : 'Cruise' }]
        : [];

      const payload: any = {
        orderType: 2,
        companyType: 1,
        categoryType: 3,
        orderOrigin: 1,
        travel: {
          policyType: isAnnual ? 'ANNUAL' : 'SINGLE',
          coverTypeCode,
          regionCode,
          startDate: startDateYmd,
          endDate: endDateYmd,
          travelCountries: isAnnual ? [] : (iso2Country ? [iso2Country] : []),
          optionalCovers,
          insuredPersons,
        },
        customer: { realname: customer.realname },
      };

      const res = await quote(payload as any);
      const data = (res as any)?.data;

      if ((res as any)?.success && data) {
        const offers = data.offers || [];
        // Extract dates and region from first offer
        const firstOffer = offers[0] || {};
        const quoteId = firstOffer.quoteId || '';
        const quoteStartDate =
          firstOffer?.policyDate?.startDate?.date ||
          firstOffer?.tripDate?.startDate?.date ||
          startDateYmd;
        const quoteEndDate =
          firstOffer?.policyDate?.endDate?.date ||
          firstOffer?.tripDate?.endDate?.date ||
          endDateYmd;
        const quoteRegionCode =
          (firstOffer?.region?.code) || regionCode;

        navigation.navigate('TravelPlanSelect', {
          productId, categoryCode, companyId,
          tripType, coverageType, adultCount, childCount,
          country, zone, departDate, returnDate, addonChecked,
          families: familiesJson,
          offers: JSON.stringify(offers),
          quoteId,
          quoteStartDate,
          quoteEndDate,
          quoteRegionCode,
        });
      } else {
        const msg = (res as any)?.msg || 'Failed to get quote. Please try again.';
        Alert.alert('', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e: any) {
      console.warn('Quote error', e);
      Alert.alert('', e?.message || 'An error occurred. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.headerSection}>
        <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={sharedStyles.headerTextBlock}>
              <Text style={sharedStyles.headerTitle}>{config.title}</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>HAPPI is securing your quote.</Text>
        <Text style={styles.loadingSubText}>Your quote is being generated.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#808080',
    textAlign: 'center',
  },
});

export default TravelStep3;
