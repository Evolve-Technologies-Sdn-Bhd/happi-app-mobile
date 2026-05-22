/**
 * Purchase Step 3 — Cyber Insurance
 * Ported from happi-app-customer/src/views/purchase/cyber/step_3.vue
 *
 * Readonly personal details + price summary + Confirm & Pay
 */

import React, { useEffect, useState } from 'react';
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
import customerApi from '../../../../../api/customer';
import { getDicList, DicItem } from '../../../../../api/pub';
import {
  getProductListByCategoryIdAndCompanyId,
  Product,
} from '../../../../../api/product';
import { insuranceCheckout } from '../../../../../api/order';
import { useCategoryStore } from '../../../../../store';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep3'>;

// ─── Profile (same shape as step 2) ──────────────────────────────────────────

interface Profile {
  id: string;
  realname: string;
  nationality: string;
  gender: string;
  address: string;
  foreignerState: number;
  idNumber: string;
  passportNumber: string;
  workPermitNumber: string;
  workPermitExpiredDate: string;
  countryCode: string;
  mobile: string;
  email: string;
  birthday: string;
  occupation: string;
  maritalStatus: string;
  username: string;
  corporationName: string;
  idType: number;
  idStatus: number;
}

const EMPTY: Profile = {
  id: '', realname: '', nationality: '', gender: '',
  address: '', foreignerState: 0, idNumber: '', passportNumber: '',
  workPermitNumber: '', workPermitExpiredDate: '', countryCode: '60',
  mobile: '', email: '', birthday: '', occupation: '', maritalStatus: '',
  username: '', corporationName: '', idType: 0, idStatus: 0,
};

// ─── InfoRow helper ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({
  label, value, last,
}) => (
  <View style={[infoRowStyles.row, !last && infoRowStyles.rowBorder]}>
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text style={infoRowStyles.value}>{value}</Text>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 44 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 130, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  value: { flex: 1, fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right' },
});

// ─── Price row helper ─────────────────────────────────────────────────────────

const PriceRow: React.FC<{ label: string; amount: string; bold?: boolean; separator?: boolean }> = ({
  label, amount, bold, separator,
}) => (
  <View style={[styles.priceRow, separator && styles.priceRowSeparator]}>
    <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>{label}</Text>
    <Text style={[styles.priceAmount, bold && styles.priceAmountBold]}>{amount}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const CyberStep3: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, employmentLocation } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const { getCategoryByCode } = useCategoryStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile>({ ...EMPTY });
  const [product, setProduct] = useState<Product | null>(null);
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [genderRes, occupationRes, maritalRes, nationalityRes] = await Promise.allSettled([
          getDicList('GENDER'),
          getDicList('OCCUPATION'),
          getDicList('MARITAL_STATUS'),
          getDicList('NATIONALITY'),
        ]);
        const cache: Record<string, DicItem[]> = {};
        const extract = (r: PromiseSettledResult<any>, code: string) => {
          if (r.status === 'fulfilled') {
            cache[code] = Array.isArray((r.value as any)?.data) ? (r.value as any).data : [];
          }
        };
        extract(genderRes, 'GENDER');
        extract(occupationRes, 'OCCUPATION');
        extract(maritalRes, 'MARITAL_STATUS');
        extract(nationalityRes, 'NATIONALITY');
        setDictCache(cache);

        // Customer info (fresh for accuracy after step 2 update)
        const customerRes = await customerApi.getCustomerInfo();
        const info = (customerRes as any)?.data ?? (customerRes as any);
        if (info) {
          setProfile({
            id: info.id ?? '',
            realname: info.realname ?? '',
            nationality: String(info.nationality ?? ''),
            gender: String(info.gender ?? ''),
            address: info.address ?? '',
            foreignerState: info.foreignerState ?? 0,
            idNumber: info.idNumber ?? '',
            passportNumber: info.passportNumber ?? '',
            workPermitNumber: info.workPermitNumber ?? '',
            workPermitExpiredDate: info.workPermitExpiredDate ?? '',
            countryCode: info.countryCode ?? '60',
            mobile: info.mobile ?? '',
            email: info.email ?? '',
            birthday: info.birthday ? dayjs(info.birthday).format('YYYY-MM-DD') : '',
            occupation: String(info.occupation ?? ''),
            maritalStatus: String(info.maritalStatus ?? ''),
            username: info.username ?? '',
            corporationName: info.corporationName ?? '',
            idType: info.idType ?? 0,
            idStatus: info.idStatus ?? 0,
          });
        }

        // Product for price calc
        const category = getCategoryByCode(categoryCode);
        const productRes = await getProductListByCategoryIdAndCompanyId(
          category?.id ?? categoryCode,
          companyId,
        );
        const products: Product[] = (productRes as any)?.data ?? [];
        const found = products.find(p => p.id === productId);
        setProduct(found ?? null);
      } catch (e) {
        console.warn('Step3 load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Dict label ─────────────────────────────────────────────────────────────
  const getLabel = (dictCode: string, code: string) => {
    if (!code) return '';
    const found = (dictCache[dictCode] ?? []).find(i => String(i.code) === String(code));
    return found ? found.name : code;
  };

  // ── Price calc ─────────────────────────────────────────────────────────────
  const basicPremium = product?.premium ?? product?.price ?? 0;
  const addonPremium = product?.addons?.reduce((s, a) => s + a.premium, 0) ?? 0;
  const grossPremium = basicPremium + addonPremium;
  const taxAmount = product?.taxes?.reduce((s, t) =>
    t.type === 1 ? s + grossPremium * t.value / 100 : s + t.value
  , 0) ?? 0;
  const totalPayable = grossPremium + taxAmount;
  const fmtRM = (n: number) => `RM ${n.toFixed(2)}`;

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleConfirmPay = async () => {
    const category = getCategoryByCode(categoryCode);
    setSubmitting(true);
    try {
      const res = await insuranceCheckout({
        orderOrigin: 1,  // app
        orderType: 2,    // insurance
        companyType: 0,
        categoryType: 1, // cyber
        customer: {
          id: profile.id,
          realname: profile.realname,
          username: profile.username,
          countryCode: profile.countryCode,
          mobile: profile.mobile,
          email: profile.email,
          gender: profile.gender,
          maritalStatus: profile.maritalStatus,
          address: profile.address,
          idType: profile.idType,
          idStatus: profile.idStatus,
          idNumber: profile.idNumber,
          occupation: profile.occupation,
          birthday: profile.birthday,
          corporationName: profile.corporationName,
        },
        cyber: {
          employmentLocation,
          categoryId: category?.id ?? '',
          companyId,
          productId,
        },
      });

      const data = (res as any)?.data;
      if ((res as any)?.success && data?.orderGroupId) {
        Alert.alert(
          'Order Placed',
          'Your insurance order has been placed successfully.',
          [{
            text: 'OK',
            onPress: () => navigation.navigate('ProductIndex'),
          }],
        );
      } else {
        Alert.alert('Error', (res as any)?.msg ?? 'Checkout failed. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Header ─────────────────────────────────────────────────────────────────
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

  if (loading) {
    return (
      <View style={sharedStyles.container}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={sharedStyles.container}>
      {renderHeader()}

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Personal details (readonly) ── */}
        <Text style={styles.sectionTitle}>Personal details</Text>

        <View style={styles.formCard}>
          <InfoRow label="Full Name" value={profile.realname} />
          <InfoRow
            label="Nationality"
            value={getLabel('NATIONALITY', profile.nationality) || profile.nationality}
          />
          <InfoRow label="Gender" value={getLabel('GENDER', profile.gender)} />
          <InfoRow label="Address" value={profile.address} />

          {profile.foreignerState === 0 ? (
            <InfoRow label="NRIC" value={profile.idNumber} />
          ) : (
            <>
              <InfoRow label="Passport" value={profile.passportNumber} />
              <InfoRow label="Work Permit No." value={profile.workPermitNumber} />
              <InfoRow label="Work Permit Expiry" value={profile.workPermitExpiredDate} />
            </>
          )}

          <InfoRow
            label="Mobile Number"
            value={profile.mobile ? `+${profile.countryCode} ${profile.mobile}` : ''}
          />
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Date of Birth" value={profile.birthday} />
          <InfoRow label="Occupation" value={getLabel('OCCUPATION', profile.occupation)} />
          <InfoRow
            label="Marital Status"
            value={getLabel('MARITAL_STATUS', profile.maritalStatus)}
            last
          />
        </View>

        {/* ── Price summary ── */}
        <Text style={styles.sectionTitle}>Payment summary</Text>

        <View style={styles.priceCard}>
          <Text style={styles.productName}>{product?.name ?? 'Insurance Plan'}</Text>

          <PriceRow label="Basic Premium" amount={fmtRM(basicPremium)} />

          {product?.addons?.map((addon, i) => (
            <PriceRow key={i} label={addon.name} amount={fmtRM(addon.premium)} />
          ))}

          {(product?.addons?.length ?? 0) > 0 && (
            <PriceRow label="Gross Premium" amount={fmtRM(grossPremium)} />
          )}

          {product?.taxes?.map((tax, i) => {
            const taxValue = tax.type === 1
              ? grossPremium * tax.value / 100
              : tax.value;
            return <PriceRow key={i} label={tax.name} amount={fmtRM(taxValue)} />;
          })}

          <View style={styles.divider} />
          <PriceRow
            label="Total Payable"
            amount={fmtRM(totalPayable)}
            bold
            separator
          />
        </View>

        {/* ── Confirm & Pay ── */}
        <TouchableOpacity
          style={styles.confirmPayBtn}
          onPress={handleConfirmPay}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.confirmPayBtnText}>Confirm & Pay</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

  formCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },

  // Price card
  priceCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  productName: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceRowSeparator: {
    paddingTop: 12,
  },
  priceLabel: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  priceLabelBold: { color: '#343434', fontFamily: FontFamily.bold, fontWeight: '700', fontSize: 15 },
  priceAmount: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  priceAmountBold: { color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: '700', fontSize: 15 },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginVertical: 4,
  },

  // Confirm & Pay button
  confirmPayBtn: {
    width: 200,
    height: 36,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  confirmPayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});

export default CyberStep3;
