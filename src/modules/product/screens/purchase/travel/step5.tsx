/**
 * Purchase Travel Step 5 — Full Review + Confirm & Pay
 * Ported from happi-app-customer/src/views/purchase/travel/api_step_3.vue
 *
 * Trip details, travellers, price breakdown → "Confirm & Pay" → insuranceCheckout
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import { insuranceCheckout } from '../../../../../api/order';
import customerApi from '../../../../../api/customer';
import { countryNameToIso2 } from '../../../../../utils/countryNameToIso2';
import { FamilyMember } from '../../../../../api/family';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelStep5'>;

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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, minHeight: 40 },
  border: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 140, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  value: { flex: 1, fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right' },
});

// ─── CollapsibleTraveller ─────────────────────────────────────────────────────

interface TravellerInfo {
  title: string;
  name: string;
  idNumber: string;
  passportNumber: string;
  foreignerState: number;
}

const TravellerCard: React.FC<{ traveller: TravellerInfo; index: number }> = ({ traveller, index }) => {
  const [expanded, setExpanded] = useState(index === 0);
  return (
    <View style={tStyles.card}>
      <TouchableOpacity style={tStyles.header} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <Text style={tStyles.headerText} numberOfLines={1}>{traveller.title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
      </TouchableOpacity>
      {expanded && (
        <View style={tStyles.body}>
          <InfoRow label="Name" value={traveller.name} />
          {traveller.foreignerState === 0
            ? <InfoRow label="NRIC Number" value={traveller.idNumber} last />
            : <InfoRow label="Passport" value={traveller.passportNumber} last />
          }
        </View>
      )}
    </View>
  );
};

const tStyles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginRight: 8,
  },
  body: { paddingHorizontal: 16, paddingBottom: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const TravelStep5: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {
    productId, categoryCode, companyId,
    tripType, coverageType, adultCount, childCount,
    country, zone, departDate, returnDate, addonChecked,
    families: familiesJson, quoteId,
    quoteStartDate, quoteEndDate, quoteRegionCode,
    planCode, quoteData: quoteDataJson,
  } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const isAnnual = tripType === 2;
  const [paying, setPaying] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; idNumber: string; passportNumber: string; foreignerState: number } | null>(null);

  React.useEffect(() => {
    customerApi.getCustomerInfo().then(res => {
      const info = (res as any)?.data ?? (res as any);
      if (info?.realname) {
        setUserInfo({
          name: info.realname ?? '',
          idNumber: info.idNumber ?? '',
          passportNumber: info.passportNumber ?? '',
          foreignerState: info.foreignerState ?? 0,
        });
      }
    }).catch(() => {});
  }, []);

  const quoteData = (() => {
    try { return quoteDataJson ? JSON.parse(quoteDataJson) : {}; } catch { return {}; }
  })();
  const families: FamilyMember[] = (() => {
    try { return familiesJson ? JSON.parse(familiesJson) : []; } catch { return []; }
  })();

  const basePremium = Number(quoteData.basePremium ?? 0);
  const addOnAmount = Number(quoteData.addOnAmount ?? 0);
  const grossPremium = basePremium + addOnAmount;
  const serviceTax = Number(quoteData.serviceTax ?? 0);
  const stampDuty = Number(quoteData.stampDuty ?? 0);
  const totalPayable = Number(quoteData.totalPayable ?? grossPremium + serviceTax + stampDuty);

  const coverTypeLabel = coverageType === 1 ? 'Individual' : 'Family';
  const insuredPersons = `${adultCount} Adult${adultCount !== 1 ? 's' : ''}, ${childCount} Child${childCount !== 1 ? 'ren' : ''}`;
  const dateText = `${fmtDate(departDate)} - ${fmtDate(returnDate)}`;
  const destinationText = country ? (zone ? `${country}, ${zone}` : country) : zone;
  const addOnLabel = isAnnual ? 'Add On Domestic' : 'Add On Cruise';

  const handleConfirmPay = async () => {
    setPaying(true);
    try {
      const custRes = await customerApi.getCustomerInfo();
      const customer = (custRes as any)?.data ?? (custRes as any) ?? {};

      const insuredPersonsList: Array<{ realname: string; userId?: string; familyId?: string }> = [];
      if (customer?.realname) {
        insuredPersonsList.push({ realname: customer.realname, userId: customer.id });
      }
      families.forEach(f => {
        const name = (f as any).realname || f.name || '';
        if (name) insuredPersonsList.push({ realname: name, familyId: f.id });
      });

      const iso2Country = countryNameToIso2(country);
      const optionalCovers: Array<{ Code: string }> = addonChecked
        ? [{ Code: isAnnual ? 'AnnualDomestic' : 'Cruise' }]
        : [];

      const normalizeZone = (z: string) => {
        if (!z) return 'DZ1';
        const upper = z.trim().toUpperCase();
        if (upper === 'DDOM') return 'DDOM';
        const m = upper.match(/ZONE(\d+)/i);
        return m ? `DZ${m[1]}` : (upper.startsWith('DZ') ? upper : 'DZ1');
      };

      const resolvedRegion = normalizeZone(quoteRegionCode || zone);
      const startDate = quoteStartDate || dayjs(departDate).format('YYYY-MM-DD');
      const endDate = quoteEndDate || dayjs(returnDate).format('YYYY-MM-DD');

      const res = await insuranceCheckout({
        orderOrigin: 1,
        orderType: 2,
        companyType: 1,
        categoryType: 3,
        travel: {
          quoteId,
          policyType: isAnnual ? 'ANNUAL' : 'SINGLE',
          coverTypeCode: coverageType === 1 ? 'II' : 'IF',
          regionCode: resolvedRegion,
          travelCountries: isAnnual ? [] : (iso2Country ? [iso2Country] : []),
          startDate,
          endDate,
          insuredPersons: insuredPersonsList,
          optionalCovers,
          planCode,
        },
        customer: { realname: customer.realname },
      });

      if ((res as any)?.success) {
        Alert.alert('Success', 'Your travel insurance has been confirmed!', [
          { text: 'OK', onPress: () => navigation.navigate('ProductIndex') },
        ]);
      } else {
        const msg = (res as any)?.msg || 'Checkout failed. Please try again.';
        Alert.alert('', msg);
      }
    } catch (e: any) {
      console.warn('Checkout error', e);
      Alert.alert('', e?.message || 'An error occurred. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const renderHeader = () => (
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
  );

  return (
    <View style={sharedStyles.container}>
      {renderHeader()}
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Details */}
        <Text style={styles.sectionTitle}>Trip details</Text>
        <View style={styles.card}>
          <InfoRow label="Cover Type" value={coverTypeLabel} />
          <InfoRow label="Total Insured Person" value={insuredPersons} />
          <InfoRow label="Date" value={dateText} />
          <InfoRow label="Destination" value={destinationText} />
          <InfoRow label={addOnLabel} value={addonChecked ? 'Yes' : 'No'} last />
        </View>

        {/* Travellers */}
        <Text style={styles.sectionTitle}>Travellers</Text>
        {userInfo && (
          <TravellerCard
            index={0}
            traveller={{
              title: `Traveller 1 - Self (${userInfo.name})`,
              name: userInfo.name,
              idNumber: userInfo.idNumber,
              passportNumber: userInfo.passportNumber,
              foreignerState: userInfo.foreignerState,
            }}
          />
        )}
        {families.map((f, i) => (
          <TravellerCard
            key={f.id}
            index={i + 1}
            traveller={{
              title: `Traveller ${i + 2} - ${f.relationship || 'Family'} (${f.name})`,
              name: f.name,
              idNumber: f.idNumber ?? '',
              passportNumber: f.passportNumber ?? '',
              foreignerState: f.foreignerState ?? 0,
            }}
          />
        ))}

        {/* Checkout */}
        <Text style={styles.sectionTitle}>Checkout</Text>
        <View style={[styles.card, { paddingVertical: 8 }]}>
          {/* Price rows */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Insurance Premium</Text>
            <Text style={styles.priceValue}>{fmtRM(basePremium)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{addOnLabel}</Text>
            <Text style={styles.priceValue}>{fmtRM(addOnAmount)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Gross Premium</Text>
            <Text style={styles.priceValue}>{fmtRM(grossPremium)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Tax (8%)*</Text>
            <Text style={styles.priceValue}>{fmtRM(serviceTax)}</Text>
          </View>
          <View style={[styles.priceRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.priceLabel}>Stamp Duty**</Text>
            <Text style={styles.priceValue}>{fmtRM(stampDuty)}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.footnote}>
            * Service tax 8% only applicable for Domestic (Single Trip) &amp; Domestic (Annual Trip)
          </Text>
          <Text style={[styles.footnote, { marginTop: 6 }]}>
            ** Stamp Duty is only chargeable if gross premium per policy exceeds RM 150
          </Text>
          <View style={styles.divider} />
          <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.totalValue}>{fmtRM(totalPayable)}</Text>
        </View>

        {/* Confirm & Pay */}
        <TouchableOpacity
          style={[styles.confirmPayBtn, paying && { opacity: 0.6 }]}
          onPress={handleConfirmPay}
          disabled={paying}
          activeOpacity={0.8}
        >
          {paying
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.confirmPayBtnText}>Confirm &amp; Pay</Text>
          }
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
    fontSize: 17,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },

  card: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  priceLabel: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  priceValue: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular },

  divider: { height: 1, backgroundColor: 'rgba(128,128,128,0.3)', marginVertical: 10 },
  footnote: { fontSize: 11, color: '#AAAAAA', fontFamily: FontFamily.regular, lineHeight: 16 },

  totalLabel: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginTop: 8,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 8,
  },

  confirmPayBtn: {
    width: 200,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  confirmPayBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default TravelStep5;
