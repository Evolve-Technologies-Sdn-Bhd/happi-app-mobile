/**
 * Purchase Home Step 4 — Confirm Home Details + Price Preview
 * Ported from happi-app-customer/src/views/purchase/home/step_4.vue
 *
 * Readonly view of home details + total payable preview → Continue → HomeStep5
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
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
import { useCategoryStore } from '../../../../../store';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'HomeStep4'>;

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

// ─── Screen ───────────────────────────────────────────────────────────────────

const HomeStep4: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, isDamage, damageDetail, articles, targetHome: targetHomeJson } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const { getCategoryByCode } = useCategoryStore();

  const targetHome: TargetHome = JSON.parse(targetHomeJson);

  const [loading, setLoading] = useState(true);
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
        console.warn('Step4 product load failed', e);
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
        <Text style={styles.sectionTitle}>Confirm your home details</Text>

        {/* ── Home Details Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardName}>{targetHome.name}</Text>
          <View style={styles.divider} />
          <InfoRow label="Home Category" value={targetHome.category} />
          <InfoRow label="Address" value={addressFull} />
          <InfoRow label="Postcode" value={targetHome.postcode} />
          <InfoRow label="State" value={targetHome.stateName} last />
        </View>

        {/* ── Total Payable ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable: </Text>
          <Text style={styles.totalValue}>{fmtRM(totalPayable)}</Text>
        </View>

        {/* ── Continue ── */}
        <TouchableOpacity
          style={[sharedStyles.continueBtn, { marginTop: 32 }]}
          onPress={() =>
            navigation.navigate('HomeStep5', {
              productId, categoryCode, companyId,
              isDamage, damageDetail, articles, targetHome: targetHomeJson,
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

  card: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
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
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: 4,
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

export default HomeStep4;
