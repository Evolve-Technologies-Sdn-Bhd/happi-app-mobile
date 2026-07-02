/**
 * Insurance Plans Screen
 * Converted from Vue (happi-app-customer/src/views/product/list.vue)
 * Shows insurance plans filtered by categories and status tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../shared/components';
import { PolicyCard } from '../components';
import { Policy, getPolicyPage } from '../../../api/policy';
import { Category } from '../../../api/product';
import { useCategoryStore, useAuthStore } from '../../../store';
import { ProductStackParamList } from '../../../app/navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<ProductStackParamList, 'InsurancePlans'>;
type InsurancePlansRouteProp = RouteProp<ProductStackParamList, 'InsurancePlans'>;

// Category subsections
const SUBSECTIONS = [
  { name: 'Cyber', code: 'HAPPI_CYBER' },
  { name: 'Home', code: 'HAPPI_HOME' },
  { name: 'Travel', code: 'HAPPI_TRAVEL' },
  { name: 'Auto', code: 'HAPPI_AUTO' },
];

// Tab definitions
const TABS = [
  { name: 'Active', code: 0 },
  { name: 'Pending Payment', code: 1 },
  { name: 'Pending Approval', code: 2 },
  { name: 'Expired', code: 3 },
  { name: 'Cancelled/Rejected', code: 4 },
];

export const InsurancePlansScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InsurancePlansRouteProp>();
  
  // Store
  const { list: categoryList, getListAction } = useCategoryStore();
  const { isAuthenticated } = useAuthStore();

  // State
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentTabCode, setCurrentTabCode] = useState(0);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tabScrollX] = useState(new Animated.Value(0));

  // Get subsection list with category IDs
  const subsectionList = SUBSECTIONS.map((item) => {
    const category = categoryList.find((cat: Category) => cat.code === item.code);
    return {
      name: item.name,
      id: category ? category.id : null,
      code: item.code,
    };
  });

  // Current category ID
  const currentCategoryId = subsectionList[currentCategoryIndex]?.id;

  /**
   * Fetch policies from API
   */
  const fetchPolicies = useCallback(async () => {
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setPolicies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getPolicyPage({
        page: 1,
        limit: 999,
        categoryId: currentCategoryId || undefined,
      });

      if (res.success) {
        const records = res.data.records || [];
        const filteredPolicies = filterPoliciesByTab(records, currentTabCode);
        setPolicies(filteredPolicies);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('fetchPolicies error:', error);
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCategoryId, currentTabCode, isAuthenticated]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPolicies();
    setRefreshing(false);
  }, [fetchPolicies]);

  /**
   * Filter policies by tab (matches Vue logic exactly)
   */
  const filterPoliciesByTab = (records: Policy[], tabCode: number): Policy[] => {
    const currentDate = new Date();

    if (tabCode === 0) {
      // Active: (payState = 2 and status = 1 and not expired) OR (payState = 2 and status = 0 and 72 hours passed since insuredStartDate)
      return records.filter((item) => {
        const endDate = new Date(item.insuredEndDate);
        const startDate = new Date(item.insuredStartDate);
        const hoursSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

        return (
          (item.payState === 2 && item.status === 1 && currentDate <= endDate) ||
          (item.payState === 2 && item.status === 0 && hoursSinceStart >= 72)
        );
      });
    } else if (tabCode === 1) {
      // Pending Payment: payState = 0 and status = 0 and less than 24 hours since insuredStartDate
      return records.filter((item) => {
        const startDate = new Date(item.insuredStartDate);
        const hoursSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        return item.payState === 0 && item.status === 0 && hoursSinceStart < 24;
      });
    } else if (tabCode === 2) {
      // Pending Approval: payState = 2 and status = 0 and less than 72 hours since insuredStartDate
      return records.filter((item) => {
        const startDate = new Date(item.insuredStartDate);
        const hoursSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        return item.payState === 2 && item.status === 0 && hoursSinceStart < 72;
      });
    } else if (tabCode === 3) {
      // Expired: payState = 2 and status = 1 but exceeded insuredEndDate
      return records.filter((item) => {
        const endDate = new Date(item.insuredEndDate);
        return item.payState === 2 && item.status === 1 && currentDate > endDate;
      });
    } else if (tabCode === 4) {
      // Cancelled/Rejected: pending payment items that exceeded 24 hours OR status not 0/1 with rejectTime (last 30 days only)
      return records.filter((item) => {
        const startDate = new Date(item.insuredStartDate);
        const hoursSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const daysSinceStart = hoursSinceStart / 24;

        const isPendingPaymentExpired =
          item.payState === 0 && item.status === 0 && hoursSinceStart >= 24 && daysSinceStart <= 30;

        let isRejected = false;
        if (item.status !== 0 && item.status !== 1 && item.rejectTime !== null) {
          const rejectDate = new Date(item.rejectTime);
          const daysSinceReject = (currentDate.getTime() - rejectDate.getTime()) / (1000 * 60 * 60 * 24);
          isRejected = daysSinceReject <= 30;
        }

        return isPendingPaymentExpired || isRejected;
      });
    }

    return [];
  };

  /**
   * Handle category change
   */
  const handleCategoryChange = (index: number) => {
    setCurrentCategoryIndex(index);
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tabCode: number) => {
    setCurrentTabCode(tabCode);
  };

  /**
   * Handle policy card press
   */
  const handlePolicyPress = (policy: Policy) => {
    navigation.navigate('PolicyDetail', { policyId: policy.id });
  };

  // Load categories on mount
  useEffect(() => {
    if (categoryList.length === 0) {
      getListAction();
    }
  }, [categoryList.length, getListAction]);

  // Handle route params
  useEffect(() => {
    if (route.params?.tabCode !== undefined) {
      setCurrentTabCode(route.params.tabCode);
    }
    if (route.params?.categoryId) {
      const index = subsectionList.findIndex((item) => item.id === route.params.categoryId);
      if (index !== -1) {
        setCurrentCategoryIndex(index);
      }
    }
  }, [route.params]);

  // Fetch policies when category or tab changes
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchPolicies();
    }, [fetchPolicies])
  );

  return (
    <View style={styles.container}>
      <Header title="Insurance Plans" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Category Tabs */}
        <View style={styles.categoryWrapper}>
          <View style={styles.categoryContainer}>
            {subsectionList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryTab,
                  index === 0 && styles.categoryTabFirst,
                  index === subsectionList.length - 1 && styles.categoryTabLast,
                  currentCategoryIndex === index && styles.categoryTabActive,
                ]}
                onPress={() => handleCategoryChange(index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    currentCategoryIndex === index && styles.categoryTabTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Tabs - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollView}
        >
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.statusTab,
                currentTabCode === tab.code && styles.statusTabActive,
              ]}
              onPress={() => handleTabChange(tab.code)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusTabText,
                  currentTabCode === tab.code && styles.statusTabTextActive,
                ]}
              >
                {tab.name}
              </Text>
              {currentTabCode === tab.code && <View style={styles.statusTabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Policy List */}
        <View style={styles.listContainer}>
          {!isAuthenticated ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="lock-closed-outline" size={64} color={Colors.primary} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>Login Required</Text>
              <Text style={styles.emptyText}>Please login to view your insurance plans</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : policies.length > 0 ? (
            policies.map((policy, index) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onPress={() => handlePolicyPress(policy)}
                index={index}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={Colors.primary} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>No Plans Found</Text>
              <Text style={styles.emptyText}>You don't have any insurance plans{`\n`}in this category yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Category Tabs — matches Vue up-subsection (floating pill inside outer border)
  categoryWrapper: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    padding: 3,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  categoryTabFirst: {},
  categoryTabLast: {},
  categoryTabActive: {
    backgroundColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  // Status Tabs
  tabScrollView: {
    marginTop: 10,
  },
  tabScrollContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  statusTab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  statusTabActive: {
    // Active state
  },
  statusTabText: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    fontWeight: '400',
    color: '#A19F9B',
  },
  statusTabTextActive: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 2,
    backgroundColor: Colors.primary,
  },
  // Policy List
  listContainer: {
    paddingHorizontal: 24,
    marginTop: 30,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
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
});

export default InsurancePlansScreen;
