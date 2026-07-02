/**
 * Purchase Detail Screen
 * Ported from happi-app-customer/src/views/purchase/detail.vue
 * Shows product card image + HTML description + Back / Continue buttons
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../app/navigation/types';
import { getProductListByCategoryIdAndCompanyId, Product } from '../../../api/product';
import { getOssImg } from '../../../api/client';
import { useCategoryStore, useAuthStore } from '../../../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseDetail'>;

// Same header config as ProductDetailScreen
const CATEGORY_CONFIG: Record<
  string,
  { title: string; subTitle: string; bg: ReturnType<typeof require>; backColor: string }
> = {
  HAPPI_CYBER: {
    title: 'Cyber Insurance',
    subTitle: 'Your All-in-One Digital Safety Net!',
    bg: require('../../../../assets/products/header-bg-cyber.png'),
    backColor: '#FFFFFF',
  },
  HAPPI_HOME: {
    title: 'Home Content Insurance',
    subTitle: 'Your Belongings Deserve a Bodyguard!',
    bg: require('../../../../assets/products/header-bg-home.png'),
    backColor: '#FDB813',
  },
  HAPPI_TRAVEL: {
    title: 'Travel Insurance',
    subTitle: 'Explore the World with Confidence!',
    bg: require('../../../../assets/products/header-bg-travel.png'),
    backColor: '#FFFFFF',
  },
};

const DEFAULT_CONFIG = {
  title: 'Insurance',
  subTitle: '',
  bg: require('../../../../assets/products/header-bg.png'),
  backColor: '#FFFFFF',
};

export const PurchaseDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId } = route.params;

  const { list: categoryList } = useCategoryStore();
  const { isAuthenticated } = useAuthStore();

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve category DB id
  const categoryItem = categoryList.find(c => c.code === categoryCode);
  const categoryId = categoryItem?.id || '';

  useEffect(() => {
    fetchProduct();
  }, [productId, categoryId, companyId]);

  const fetchProduct = async () => {
    if (!categoryId || !companyId) return;
    setLoading(true);
    try {
      const res = await getProductListByCategoryIdAndCompanyId(categoryId, companyId);
      if (res.success && res.data) {
        const found = res.data.find(p => p.id === productId) ?? res.data[0] ?? null;
        if (found) {
          setProduct({ ...found, cardImgUrl: getOssImg(found.cardImgUrl) });
        }
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You need to create an account first');
      return;
    }
    navigation.navigate('PurchaseStep1', {
      productId,
      categoryCode,
      companyId,
    });
  };

  const htmlTagsStyles = {
    body: {
      color: '#343434',
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FontFamily.regular,
    } as any,
    p: { marginTop: 0, marginBottom: 8 } as any,
    li: { color: '#343434' } as any,
    a: { color: Colors.primary } as any,
  };

  return (
    <View style={styles.container}>
      {/* ── Header — same as ProductDetailScreen ── */}
      <View style={styles.headerSection}>
        <ImageBackground source={config.bg} style={styles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={config.backColor} />
                <Text style={[styles.backText, { color: config.backColor }]}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>{config.title}</Text>
              {!!config.subTitle && (
                <Text style={styles.headerSubTitle}>{config.subTitle}</Text>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : product ? (
          <>
            {/* ── Product card image ── */}
            {product.cardImgUrl ? (
              <View style={styles.cardShadowWrapper}>
                <Image
                  source={{ uri: product.cardImgUrl }}
                  style={styles.productCardImg}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {/* ── Product description (HTML) ── */}
            {product.description ? (
              <View style={styles.descriptionWrapper}>
                <RenderHtml
                  contentWidth={SCREEN_WIDTH - 48}
                  source={{ html: product.description }}
                  tagsStyles={htmlTagsStyles}
                />
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.emptyText}>Product not found</Text>
        )}

        {/* ── Back / Continue buttons ── */}
        <View style={styles.ctrlWrapper}>
          <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.btnBackText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnContinue} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.btnContinueText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },

  // ─── Header (identical to ProductDetailScreen) ────────────────────────────
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    height: 210,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  headerTextBlock: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  headerSubTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 167,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  // ─── Scroll ───────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  loader: { marginTop: 40 },
  emptyText: {
    textAlign: 'center',
    color: '#808080',
    fontSize: 14,
    marginTop: 40,
  },

  // ─── Product card ─────────────────────────────────────────────────────────
  // Vue: .group_2 has filter: drop-shadow(4px 4px 4px #00000040), height 220px
  cardShadowWrapper: {
    elevation: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  productCardImg: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 0,
  },

  // ─── Description ─────────────────────────────────────────────────────────
  // Vue: .detail-wrapper margin: 8px 0 28px
  descriptionWrapper: {
    marginTop: 8,
    marginBottom: 28,
  },

  // ─── Back / Continue buttons ──────────────────────────────────────────────
  // Vue: .ctrl-wrapper row, .text-wrapper 180px bordered gold, .text-wrapper_2 180px gold fill
  ctrlWrapper: {
    flexDirection: 'row',
    gap: 22,
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  btnBack: {
    width: 150,
    height: 36,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBackText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  btnContinue: {
    width: 150,
    height: 36,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContinueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});

export default PurchaseDetailScreen;
