/**
 * Service Index Screen
 * Ported from happi-app-customer/src/views/service/index.vue
 * Shows list of services with categories, search, and filter
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ImageBackground,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { TextInput } from '../../../shared/components/TextInput';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ServiceStackParamList } from '../../../app/navigation/types';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';
import { getOssImg, getServiceCategoryList, getServiceList, ServiceCategory } from '../../../api';

type NavigationProp = NativeStackNavigationProp<ServiceStackParamList, 'ServiceIndex'>;

interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  providerId?: string;
  providerLogoUrl?: string;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

interface ServiceListResponse {
  records?: Service[];
}

export const ServiceIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryList, setCategoryList] = useState<ServiceCategory[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Refetch services when category or sort changes
  useEffect(() => {
    if (categoryList.length > 0) {
      fetchServices();
    }
  }, [selectedCategoryId]);

  useFocusEffect(
    React.useCallback(() => {
      if (categoryList.length > 0) {
        fetchServices();
      }
    }, [selectedCategoryId])
  );

  const fetchCategories = async () => {
    try {
      const response = await getServiceCategoryList({ mode: 3 });
      if (response.success && response.data && response.data.length > 0) {
        const allCategory: ServiceCategory = {
          id: '',
          name: 'All',
          sort: 0,
        };
        setCategoryList([allCategory, ...response.data]);
        setSelectedCategoryId(null);
      } else {
        Alert.alert('Error', response.msg || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const fetchServices = async () => {
    try {
      const queryParams: any = {
        page: 1,
        limit: 999,
      };

      if (selectedCategoryId) {
        queryParams.categoryId = selectedCategoryId;
      }

      if (sortBy) {
        queryParams.sortBy = sortBy;
      }

      const response = await getServiceList(queryParams);
      if (response.success && response.data) {
        const data = response.data as any;
        setServiceList(data.records || data || []);
      } else {
        Alert.alert('Error', response.msg || 'Failed to load services');
        setServiceList([]);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      Alert.alert('Error', 'Failed to load services');
      setServiceList([]);
    }
  };

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    let filtered = serviceList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((service) => {
        // Search in name
        const nameMatch = service.name.toLowerCase().includes(q);

        // Search in first FAQ answer
        const firstFaqAnswer =
          service.faqs && service.faqs.length > 0 && service.faqs[0].answer
            ? service.faqs[0].answer.toLowerCase()
            : '';
        const faqMatch = firstFaqAnswer.includes(q);

        return nameMatch || faqMatch;
      });
    }

    return filtered;
  }, [serviceList, searchQuery]);

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleServicePress = (service: Service) => {
    navigation.navigate('ServiceDetail', { serviceId: service.id });
  };

  const getFirstAnswer = (service: Service): string => {
    if (service.faqs && service.faqs.length > 0 && service.faqs[0].answer) {
      return service.faqs[0].answer;
    }
    return service.description || 'No description available';
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const applyFilter = () => {
    setShowFilter(false);
    fetchServices();
  };

  const resetFilter = () => {
    setSortBy('');
  };

  const decodeHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&reg;/g, '\u00ae')
      .replace(/&trade;/g, '\u2122')
      .replace(/&copy;/g, '\u00a9')
      .replace(/&ndash;/g, '\u2013')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ldquo;/g, '\u201c')
      .replace(/&rdquo;/g, '\u201d')
      .replace(/&hellip;/g, '\u2026')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .trim();
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Background */}
      <View style={styles.headerSection}>
        <ImageBackground
          source={require('../../../../assets/products/header-bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>HAPPI Services</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#808080"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="search" size={20} color="#808080" />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      {categoryList.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContent}
        >
          {categoryList.map((category) => {
            const isSelected = category.id === selectedCategoryId || (!category.id && !selectedCategoryId);
            return (
              <TouchableOpacity
                key={category.id || 'all'}
                style={[
                  styles.tab,
                  isSelected && styles.tabActive,
                ]}
                onPress={() => handleCategoryPress(category.id || null)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Service List - Scrollable */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceItem}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              <View style={styles.imageWrapper}>
                {!imageErrors[service.id] && service.providerLogoUrl ? (
                  <Image
                    source={{ uri: getOssImg(service.providerLogoUrl) }}
                    style={styles.serviceImage}
                    onError={() => handleImageError(service.id)}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {decodeHtml(getFirstAnswer(service))}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={Colors.primary} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptyText}>There are no services available{`\n`}in this category yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        />
        {/* Sheet pinned to bottom */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Sort by</Text>

              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setSortBy('mostPopular')}
                >
                  <View style={styles.radioCircle}>
                    {sortBy === 'mostPopular' && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Most Popular</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setSortBy('newest')}
                >
                  <View style={styles.radioCircle}>
                    {sortBy === 'newest' && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Newest</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setSortBy('alphabetical')}
                >
                  <View style={styles.radioCircle}>
                    {sortBy === 'alphabetical' && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Alphabetical (A-Z)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterBtn, styles.filterBtnReset]}
                  onPress={resetFilter}
                >
                  <Text style={styles.filterBtnTextReset}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, styles.filterBtnApply]}
                  onPress={applyFilter}
                >
                  <Text style={styles.filterBtnTextApply}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  // Header Section
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingBottom: 45,
  },
  headerSafeArea: {
  },
  headerContent: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '500' as any,
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: Spacing.md,
    marginTop: 15,
    zIndex: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.primary,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textDark,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterButton: {
    padding: Spacing.sm,
  },
  tabContainer: {
    marginTop: 10,
    maxHeight: 40,
    marginHorizontal: 24,
  },
  tabContent: {
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginRight: Spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.size.md,
    color: '#A19F9B',
    fontWeight: '400' as any,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as any,
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
  },
  serviceContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  serviceTitle: {
    fontSize: Typography.size.md,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.primary,
    lineHeight: 20,
  },
  serviceDesc: {
    fontSize: Typography.size.sm,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: Colors.textDark,
    lineHeight: 18,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
  filterContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 40,
    paddingBottom: 40,
    minHeight: 376,
  },
  filterTitle: {
    fontSize: Typography.size.md,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#808080',
    marginBottom: Spacing.lg,
  },
  filterOptions: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: Typography.size.md,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#808080',
  },
  filterButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  filterBtn: {
    paddingVertical: Spacing.md,
    borderRadius: 30,
    alignItems: 'center',
  },
  filterBtnReset: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterBtnApply: {
    backgroundColor: Colors.primary,
  },
  filterBtnTextReset: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  filterBtnTextApply: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.background,
  },
});
