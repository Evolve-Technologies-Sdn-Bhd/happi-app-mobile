/**
 * Purchase Travel Step 4 — Confirm Trip Details
 * Ported from happi-app-customer/src/views/purchase/travel/api_step_2.vue
 *
 * Shows readonly summary of trip: Cover Type, Insured Persons, Date, Destination, Add On, Total Payable.
 * Continue → TravelStep5
 */

import React from 'react';
import {
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
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelStep4'>;

const fmtDate = (d: string) => {
  const parsed = dayjs(d);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : d;
};

const fmtRM = (n: number) => `RM ${Number(n).toFixed(2)}`;

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[rowStyles.row, !last && rowStyles.border]}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 14, minHeight: 44 },
  border: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 140, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  value: { flex: 1, fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const TravelStep4: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {
    productId, categoryCode, companyId,
    tripType, coverageType, adultCount, childCount,
    country, zone, departDate, returnDate, addonChecked,
    families, offers, quoteId, quoteStartDate, quoteEndDate, quoteRegionCode,
    planCode, quoteData: quoteDataJson,
  } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const isAnnual = tripType === 2;

  const quoteData = (() => {
    try { return quoteDataJson ? JSON.parse(quoteDataJson) : {}; } catch { return {}; }
  })();

  const coverTypeLabel = coverageType === 1 ? 'Individual' : 'Family';
  const insuredPersons = `${adultCount} Adult${adultCount !== 1 ? 's' : ''}, ${childCount} Child${childCount !== 1 ? 'ren' : ''}`;

  const dateText = `${fmtDate(departDate)} - ${fmtDate(returnDate)}`;
  const destinationText = country
    ? (zone ? `${country}, ${zone}` : country)
    : zone;
  const addOnText = addonChecked ? 'Yes' : 'No';
  const addOnLabel = isAnnual ? 'Add On Domestic' : 'Add On Cruise';
  const totalPayable = fmtRM(quoteData.totalPayable ?? 0);

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
        <Text style={styles.sectionTitle}>Confirm your trip details</Text>

        {/* Trip Details Card */}
        <View style={styles.card}>
          <InfoRow label="Cover Type" value={coverTypeLabel} />
          <InfoRow label="Total Insured Person" value={insuredPersons} />
          <InfoRow label="Date" value={dateText} />
          <InfoRow label="Destination" value={destinationText} />
          <InfoRow label={addOnLabel} value={addOnText} last />
        </View>

        {/* Total Payable */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable: </Text>
          <Text style={styles.totalValue}>{totalPayable}</Text>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[sharedStyles.continueBtn, { marginTop: 32 }]}
          onPress={() =>
            navigation.navigate('TravelStep5', {
              productId, categoryCode, companyId,
              tripType, coverageType, adultCount, childCount,
              country, zone, departDate, returnDate, addonChecked,
              families, offers, quoteId, quoteStartDate, quoteEndDate, quoteRegionCode,
              planCode, quoteData: quoteDataJson,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  sectionTitle: {
    color: '#343434',
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },

  card: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default TravelStep4;
