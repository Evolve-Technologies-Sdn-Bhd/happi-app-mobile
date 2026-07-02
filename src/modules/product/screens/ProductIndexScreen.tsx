/**
 * Product Index Screen
 * Main product/insurance page with policy cards and product categories
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { PolicyCardSlider } from '../components';
import { ProductStackParamList } from '../../../app/navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'ProductIndex'>;

// Product Categories
const PRODUCT_CATEGORIES = [
  {
    id: 'HAPPI_CYBER',
    name: 'Cyber',
    icon: require('../../../../assets/products/icon-cyber.png'),
  },
  {
    id: 'HAPPI_HOME',
    name: 'Home',
    icon: require('../../../../assets/products/icon-home.png'),
  },
  {
    id: 'HAPPI_TRAVEL',
    name: 'Travel',
    icon: require('../../../../assets/products/icon-travel.png'),
  },
  {
    id: 'HAPPI_AUTO',
    name: 'Auto',
    icon: require('../../../../assets/products/icon-auto.png'),
  },
];

// Mock policies data (empty for now - will be fetched from API)
const mockPolicies: Array<{
  id: string;
  productName: string;
  year: string;
  customerName: string;
  policyNumber: string;
  companyLogo?: string;
}> = [];

export const ProductIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  // When navigated here with goToPlans=true (e.g. from Profile Insurance Management),
  // push InsurancePlans on top so back always returns to ProductIndex.
  useEffect(() => {
    if (route.params?.goToPlans) {
      navigation.navigate('InsurancePlans', {});
    }
  }, [route.params?.goToPlans]);

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === 'HAPPI_AUTO') {
      // Coming soon
      return;
    }
    // Navigate to product detail or quote flow
    navigation.navigate('ProductDetail', { productId: categoryId });
  };

  const handlePolicyCardPress = (policy: typeof mockPolicies[0]) => {
    // Navigate to policy detail
    navigation.navigate('ProductDetail', { productId: policy.id });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Background */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={require('../../../../assets/products/header-bg.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Insurance</Text>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>

        {/* Policy Cards Slider */}
        <PolicyCardSlider
          policies={mockPolicies}
          onCardPress={handlePolicyCardPress}
        />

        {/* Quick Action Menu */}
        <View style={styles.quickActionSection}>
          <View style={styles.quickActionRow}>
            {/* Insurance Plans */}
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('InsurancePlans', {})}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../../assets/products/icon-insurance-plans.png')}
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Insurance</Text>
              <Text style={styles.quickActionText}>Plans</Text>
            </TouchableOpacity>

            {/* Submit Claims */}
            <TouchableOpacity
              style={[styles.quickActionItem, styles.quickActionItemDisabled]}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../../assets/products/icon-submit-claims.png')}
                style={styles.quickActionIcon}
              />
              <Text style={[styles.quickActionText, styles.quickActionTextDisabled, styles.firstLineText]}>Submit</Text>
              <Text style={[styles.quickActionText, styles.quickActionTextDisabled, styles.secondLineText]}>Claims</Text>
            </TouchableOpacity>

            {/* History */}
            <TouchableOpacity
              style={[styles.quickActionItem, styles.quickActionItemDisabled]}
              activeOpacity={0.7}
            >
              <View style={styles.historyIconWrapper}>
                <Image
                  source={require('../../../../assets/products/icon-history.png')}
                  style={styles.quickActionIcon}
                />
                <Image
                  source={require('../../../../assets/products/icon-history-badge.png')}
                  style={styles.historyBadge}
                />
              </View>
              <Text style={[styles.quickActionText, styles.quickActionTextDisabled]}>History</Text>
            </TouchableOpacity>

            {/* Coming Soon */}
            <TouchableOpacity
              style={[styles.quickActionItem, styles.quickActionItemDisabled]}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../../assets/products/icon-coming-soon.png')}
                style={styles.quickActionIcon}
              />
              <Text style={[styles.quickActionText, styles.quickActionTextDisabled, styles.firstLineText]}>Coming</Text>
              <Text style={[styles.quickActionText, styles.quickActionTextDisabled, styles.secondLineText]}>Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.sectionUnderline} />

          {/* Product Grid */}
          <View style={styles.productGrid}>
            {PRODUCT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.productItem}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <Image source={category.icon} style={styles.productIcon} />
                <Text style={styles.productName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  // Header Section
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  headerSafeArea: {
    flex: 1,
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
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    lineHeight: 32,
  },
  // Quick Action Menu Section
  quickActionSection: {
    marginTop: 15,
    paddingHorizontal: 24,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  quickActionItem: {
    minWidth: 60,
    maxWidth: 80,
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 10,
    marginHorizontal: 4,
  },
  quickActionItemDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    width: 35,
    height: 35,
    marginBottom: 13,
    alignSelf: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    color: '#343434',
    lineHeight: 17,
    textAlign: 'center',
    width: '100%',
  },
  quickActionTextDisabled: {
    opacity: 1,
  },
  historyIconWrapper: {
    position: 'relative',
    width: 35,
    height: 35,
    marginBottom: 13,
    alignSelf: 'center',
  },
  historyBadge: {
    position: 'absolute',
    right: 3,
    bottom: 0,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  firstLineText: {
    marginTop: 0,
  },
  secondLineText: {
    marginTop: 3,
  },
  // Products Section
  productsSection: {
    marginTop: 30,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#343434',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 8,
  },
  sectionUnderline: {
    backgroundColor: Colors.primary,
    width: 31,
    height: 2,
    marginBottom: 18,
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  productItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
    // maxWidth: SCREEN_WIDTH / 4,
  },
  productIcon: {
    width: 35,
    height: 35,
  },
  productName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    color: '#343434',
    lineHeight: 20,
    marginTop: 3,
  },
});

export default ProductIndexScreen;
