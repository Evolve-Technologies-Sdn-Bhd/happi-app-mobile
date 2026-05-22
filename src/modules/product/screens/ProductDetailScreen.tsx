/**
 * Product Detail / Purchase Screen
 * Ported from happi-app-customer/src/views/purchase/index.vue
 * Shows insurer selector → product card swiper → Free Quote CTA
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../app/navigation/types';
import {
  getCompanyList,
  getProductListByCategoryIdAndCompanyId,
  Company,
  Product,
} from '../../../api/product';
import { getFaqListByCategoryId, Faq } from '../../../api/pub';
import { useCategoryStore, useAuthStore } from '../../../store';
import { getOssImg } from '../../../api/client';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'ProductDetail'>;

// Per-category header config — matches nav-bar type in Vue
const CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    subTitle: string;
    bg: ReturnType<typeof require>;
    backColor: string;
  }
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

// ─── T&C collapse card (matches happi-collapse-card) ─────────────────────────

const TacCard: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const [open, setOpen] = useState(false);

  const tagsStyles = {
    body: { color: '#808080', fontSize: 13, lineHeight: 20, fontFamily: FontFamily.regular },
    p: { marginTop: 4, marginBottom: 4 },
    li: { color: '#808080' },
    a: { color: Colors.primary },
  };

  return (
    <TouchableOpacity
      style={styles.tacCard}
      onPress={() => setOpen(v => !v)}
      activeOpacity={0.9}
    >
      <View style={styles.tacHeader}>
        <Text style={styles.tacTitle}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </View>
      {open && (
        <RenderHtml
          contentWidth={SCREEN_WIDTH - 48 - 20}
          source={{ html: content ?? '' }}
          tagsStyles={tagsStyles}
        />
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId } = route.params; // categoryCode e.g. 'HAPPI_CYBER'

  const { list: categoryList, getListAction } = useCategoryStore();
  const { isAuthenticated } = useAuthStore();

  const config = CATEGORY_CONFIG[productId] ?? DEFAULT_CONFIG;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [tacList, setTacList] = useState<Faq[]>([]);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const swiperRef = useRef<FlatList>(null);

  // Resolve category DB id from store
  const categoryItem = categoryList.find(c => c.code === productId);
  const categoryId = categoryItem?.id || '';

  useEffect(() => {
    if (categoryList.length === 0) getListAction();
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    fetchCompanies();
    fetchTac();
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId || !selectedCompanyId) { setProducts([]); return; }
    fetchProducts();
  }, [selectedCompanyId, categoryId]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await getCompanyList(categoryId);
      if (res.success && res.data && res.data.length > 0) {
        setCompanies(res.data);
        setSelectedCompanyId(res.data[0].id);
      } else {
        setCompanies([]);
      }
    } catch { setCompanies([]); }
    setLoadingCompanies(false);
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setActiveProductIndex(0);
    try {
      const res = await getProductListByCategoryIdAndCompanyId(categoryId, selectedCompanyId);
      if (res.success && res.data) {
        const mapped = res.data.map(p => ({ ...p, cardImgUrl: getOssImg(p.cardImgUrl) }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch { setProducts([]); }
    setLoadingProducts(false);
  };

  const fetchTac = async () => {
    try {
      const res = await getFaqListByCategoryId(categoryId);
      if (res.success && res.data) setTacList(res.data);
    } catch { /* silent */ }
  };

  const handleProductScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveProductIndex(Math.max(0, index));
    },
    [],
  );

  const handleFreeQuote = async () => {
    if (!selectedCompanyId) {
      Alert.alert('', 'Please select an insurance company first');
      return;
    }
    if (products.length === 0) {
      Alert.alert('', 'No plans available for this insurer');
      return;
    }

    // CYBER: block duplicate purchase from same company
    if (productId === 'HAPPI_CYBER') {
      try {
        const { getPolicyPage } = await import('../../../api/policy');
        const res = await getPolicyPage({ page: 1, limit: 999, categoryId });
        if (res.success && res.data?.records) {
          const hasPurchased = res.data.records.some(
            p =>
              p.payState === 2 &&
              (p.status as number) !== -1 &&
              p.company?.id === selectedCompanyId,
          );
          if (hasPurchased) {
            const company = companies.find(c => c.id === selectedCompanyId);
            Alert.alert(
              '',
              `You already have a paid policy from ${company?.name || 'this insurance company'}. Please select a different insurer.`,
            );
            return;
          }
        }
      } catch { /* allow to continue */ }
    }

    const selectedProduct = products[activeProductIndex] ?? products[0];
    navigation.navigate('PurchaseDetail', {
      productId: selectedProduct.id,
      categoryCode: productId,
      companyId: selectedCompanyId,
    });
  };

  return (
    <View style={styles.container}>
      {/* ── Header: cyber/home specific bg + title/subtitle ── */}
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
        {/* ── Select Insurer ── */}
        <Text style={styles.sectionHeading}>Select Your Insurer</Text>

        {loadingCompanies ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : companies.length === 0 && !loadingCompanies ? (
          <Text style={styles.emptyText}>No insurers available</Text>
        ) : (
          <View style={styles.companyGrid}>
            {companies.map(company => {
              const selected = company.id === selectedCompanyId;
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyItem}
                  onPress={() => setSelectedCompanyId(company.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={
                      selected
                        ? require('../../../../assets/products/radio-active.png')
                        : require('../../../../assets/products/radio-inactive.png')
                    }
                    style={styles.radioImg}
                  />
                  {company.logoUrl ? (
                    <Image
                      source={{ uri: getOssImg(company.logoUrl) }}
                      style={styles.companyLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.companyName} numberOfLines={2}>{company.name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Product card swiper ── */}
        {selectedCompanyId ? (
          loadingProducts ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : products.length > 0 ? (
            <View style={styles.swiperSection}>
              <FlatList
                ref={swiperRef}
                data={products}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleProductScroll}
                scrollEventThrottle={16}
                keyExtractor={item => item.id}
                renderItem={({ item }) =>
                  item.cardImgUrl ? (
                    <TouchableOpacity
                      style={styles.productSlide}
                      onPress={handleFreeQuote}
                      activeOpacity={0.95}
                    >
                      <Image
                        source={{ uri: item.cardImgUrl }}
                        style={styles.productCardImg}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.productSlide, styles.productSlidePlaceholder]}
                      onPress={handleFreeQuote}
                      activeOpacity={0.95}
                    >
                      <Text style={styles.productPlaceholderName}>{item.name}</Text>
                    </TouchableOpacity>
                  )
                }
              />

              {/* Gold dots */}
              {products.length > 1 && (
                <View style={styles.dotRow}>
                  {products.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeProductIndex && styles.dotActive]} />
                  ))}
                </View>
              )}

              {/* Free Quote button */}
              <TouchableOpacity style={styles.freeQuoteBtn} onPress={handleFreeQuote} activeOpacity={0.8}>
                <Text style={styles.freeQuoteText}>Free Quote</Text>
              </TouchableOpacity>
            </View>
          ) : (
            !loadingProducts && <Text style={styles.emptyText}>No Plans Available</Text>
          )
        ) : null}

        {/* ── T&C section ── */}
        {tacList.length > 0 && (
          <View style={styles.tacSection}>
            {tacList.map(item => (
              <TacCard
                key={item.id}
                title={item.name ?? item.question ?? ''}
                content={item.value ?? item.answer ?? ''}
              />
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },

  // ─── Header ───────────────────────────────────────────────────────────────
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
  scrollContent: { paddingTop: 30 },

  sectionHeading: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  loader: { marginVertical: 20 },
  emptyText: {
    textAlign: 'center',
    color: '#808080',
    fontSize: 14,
    marginVertical: 20,
    paddingHorizontal: 24,
  },

  // ─── Company Grid ─────────────────────────────────────────────────────────
  companyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 30,
  },
  companyItem: {
    width: (SCREEN_WIDTH - 40 - 24) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioImg: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  companyLogo: {
    flex: 1,
    height: 50,
  },
  companyName: {
    flex: 1,
    fontSize: 13,
    color: '#343434',
    fontFamily: FontFamily.regular,
  },

  // ─── Product Swiper ───────────────────────────────────────────────────────
  swiperSection: {
    marginBottom: 20,
  },
  productSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  productCardImg: {
    width: SCREEN_WIDTH - 60,
    height: 220,
  },
  productSlidePlaceholder: {
    height: 220,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  productPlaceholderName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#343434',
    textAlign: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${Colors.primary}66`,
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  freeQuoteBtn: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  freeQuoteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '600',
  },

  // ─── T&C Cards (matches happi-collapse-card with expandedRadius/collapsedRadius = 10px) ──
  tacSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginTop: 20,
  },
  tacCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    // Vue: border-right 5px #fdb813, border-bottom 5px #fdb813, no left/top border
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderRightColor: Colors.primary,
    borderBottomColor: Colors.primary,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    padding: 20,
    paddingHorizontal: 10,
  },
  tacHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tacTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    lineHeight: 24,
    marginRight: 8,
  },
  tacContent: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#808080',
    lineHeight: 20,
    marginTop: 4,
  },
});

export default ProductDetailScreen;
