/**
 * Purchase Home Step 5 — Final Review + Confirm & Pay
 * Ported from happi-app-customer/src/views/purchase/home/step_5.vue
 *
 * Readonly home details + payable calc + "Confirm & Pay" → insuranceCheckout API
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
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import { getProductListByCategoryIdAndCompanyId, Product } from '../../../../../api/product';
import { insuranceCheckout } from '../../../../../api/order';
import { useCategoryStore } from '../../../../../store';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'HomeStep5'>;

interface TargetHome {
  name: string; category: string; address1: string;
  address2: string; stateName: string; postcode: string;
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[rowStyles.row, !last && rowStyles.border]}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, minHeight: 44 },
  border: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 120, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  value: { flex: 1, fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right' },
});

// ─── PriceRow ─────────────────────────────────────────────────────────────────

const PriceRow: React.FC<{ label: string; amount: string; bold?: boolean }> = ({ label, amount, bold }) => (
  <View style={priceRowStyles.row}>
    <Text style={[priceRowStyles.label, bold && priceRowStyles.boldLabel]}>{label}</Text>
    <Text style={[priceRowStyles.amount, bold && priceRowStyles.boldAmount]}>{amount}</Text>
  </View>
);

const priceRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  amount: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  boldLabel: { color: '#343434', fontFamily: FontFamily.bold, fontWeight: '700', fontSize: 15 },
  boldAmount: { color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: '700', fontSize: 15 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const HomeStep5: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, isDamage, damageDetail, articles: articlesJson, targetHome: targetHomeJson } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const { getCategoryByCode } = useCategoryStore();

  const targetHome: TargetHome = JSON.parse(targetHomeJson);
  const articles: Array<{ name: string; serial: string; sumInsured: number }> = JSON.parse(articlesJson);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const category = getCategoryByCode(categoryCode);
        const res = await getProductListByCategoryIdAndCompanyId(
          category?.id ?? categoryCode, companyId,
        );
        const list: Product[] = (res as any)?.data ?? [];
        setProduct(list.find(p => p.id === productId) ?? null);
      } catch (e) {
        console.warn('Step5 product load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Price calc ─────────────────────────────────────────────────────────────
  const basicPremium = product?.premium ?? product?.price ?? 0;
  const addonPremium = product?.addons?.reduce((s, a) => s + a.premium, 0) ?? 0;
  const grossPremium = basicPremium + addonPremium;
  const taxAmount = product?.taxes?.reduce((s, t) =>
    t.type === 1 ? s + grossPremium * t.value / 100 : s + t.value, 0) ?? 0;
  const totalPayable = grossPremium + taxAmount;
  const fmtRM = (n: number) => `RM ${n.toFixed(2)}`;

  const addressFull = [targetHome.address1, targetHome.address2].filter(Boolean).join(', ');

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleConfirmPay = async () => {
    const category = getCategoryByCode(categoryCode);
    setSubmitting(true);
    try {
      const res = await insuranceCheckout({
        orderOrigin: 1,  // app
        orderType: 2,    // insurance
        companyType: 0,
        categoryType: 2, // home
        home: {
          articles,
          targetHome: {
            name: targetHome.name,
            category: targetHome.category,
            address1: targetHome.address1,
            address2: targetHome.address2,
            stateName: targetHome.stateName,
            postcode: targetHome.postcode,
            damageDetail,
            isDamage,
          },
          categoryId: category?.id ?? '',
          companyId,
          productId,
        },
      });

      const data = (res as any)?.data;
      if ((res as any)?.success && data?.orderGroupId) {
        Alert.alert(
          'Order Placed',
          'Your home insurance order has been placed successfully.',
          [{ text: 'OK', onPress: () => navigation.navigate('ProductIndex') }],
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
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      {renderHeader()}
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Home Details ── */}
        <Text style={styles.sectionTitle}>Home details</Text>
        <View style={styles.card}>
          <Text style={styles.cardName}>{targetHome.name}</Text>
          <View style={styles.divider} />
          <InfoRow label="Home Category" value={targetHome.category} />
          <InfoRow label="Address" value={addressFull} />
          <InfoRow label="Postcode" value={targetHome.postcode} />
          <InfoRow label="State" value={targetHome.stateName} last />
        </View>

        {/* ── Payment Summary ── */}
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
            const taxValue = tax.type === 1 ? grossPremium * tax.value / 100 : tax.value;
            return <PriceRow key={i} label={tax.name} amount={fmtRM(taxValue)} />;
          })}

          <View style={styles.priceDivider} />
          <PriceRow label="Total Payable" amount={fmtRM(totalPayable)} bold />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  sectionTitle: {
    color: '#343434',
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 16,
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
    paddingVertical: 8,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardName: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    paddingVertical: 10,
  },
  divider: { height: 0.5, backgroundColor: 'rgba(128,128,128,0.4)', marginBottom: 4 },

  priceCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
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
    marginBottom: 12,
  },
  priceDivider: { height: 0.5, backgroundColor: 'rgba(128,128,128,0.4)', marginVertical: 8 },

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

export default HomeStep5;
