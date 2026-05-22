/**
 * Product Detail Screen
 * View product details and purchase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList, RootStackParamList } from '../../../app/navigation/types';
import { Header, Card, Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList & RootStackParamList, 'ProductDetail'>;
type RouteProps = RouteProp<HomeStackParamList, 'ProductDetail'>;

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  coverage: string;
  features: string[];
}

// Mock data - replace with API
const mockProduct = {
  id: '1',
  name: 'Personal Accident Protection',
  description:
    'Comprehensive personal accident coverage that protects you and your loved ones from unexpected accidents. Get peace of mind knowing you are covered 24/7.',
  icon: 'person-outline',
  features: [
    {
      icon: 'shield-checkmark',
      title: '24/7 Coverage',
      description: 'Protection around the clock',
    },
    {
      icon: 'medical',
      title: 'Medical Expenses',
      description: 'Coverage for medical bills',
    },
    {
      icon: 'cash',
      title: 'Income Replacement',
      description: 'Compensate for lost income',
    },
    {
      icon: 'heart',
      title: 'Death Benefit',
      description: 'Financial support for family',
    },
  ] as Feature[],
  plans: [
    {
      id: 'basic',
      name: 'Basic',
      price: 99,
      coverage: 'RM 50,000',
      features: ['Personal accident', 'Medical expenses up to RM 5,000', 'Basic coverage'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 149,
      coverage: 'RM 100,000',
      features: [
        'Personal accident',
        'Medical expenses up to RM 10,000',
        'Income replacement',
        'Extended coverage',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 299,
      coverage: 'RM 250,000',
      features: [
        'Personal accident',
        'Medical expenses up to RM 25,000',
        'Income replacement',
        'Death benefit',
        'Full coverage',
        'Family protection',
      ],
    },
  ] as Plan[],
};

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [isLoading, setIsLoading] = useState(false);

  const { productId } = route.params;

  const handlePurchase = () => {
    const plan = mockProduct.plans.find((p) => p.id === selectedPlan);
    if (plan) {
      // TODO: Implement payment flow
      Alert.alert(
        t('common.comingSoon'),
        `Payment for ${mockProduct.name} - ${plan.name} (RM${plan.price}/year) will be available soon.`,
        [{ text: t('common.ok') }]
      );
    }
  };

  const selectedPlanData = mockProduct.plans.find((p) => p.id === selectedPlan);

  return (
    <View style={styles.container}>
      <Header title={t('product.detail')} showBack transparent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Header */}
        <View style={styles.productHeader}>
          <View style={styles.productIcon}>
            <Ionicons
              name={mockProduct.icon as any}
              size={48}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.productName}>{mockProduct.name}</Text>
          <Text style={styles.productDesc}>{mockProduct.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('product.benefits')}</Text>
          <View style={styles.featuresGrid}>
            {mockProduct.features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('product.selectPlan')}</Text>
          {mockProduct.plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === plan.id && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planCoverage}>
                    Coverage: {plan.coverage}
                  </Text>
                </View>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>RM {plan.price}</Text>
                  <Text style={styles.planPeriod}>/year</Text>
                </View>
              </View>
              
              {selectedPlan === plan.id && (
                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.planFeatureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.base }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>
            RM {selectedPlanData?.price || 0}/year
          </Text>
        </View>
        <Button
          title={t('product.buyNow')}
          onPress={handlePurchase}
          loading={isLoading}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Spacing.base,
  },

  productHeader: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },

  productIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  productName: {
    fontSize: Typography.size.xl,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  productDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.size.lg,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  featureCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  featureTitle: {
    fontSize: Typography.size.sm,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },

  featureDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  planCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.sm,
  },

  planCardSelected: {
    borderColor: Colors.primary,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
  },

  planCoverage: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  planPriceContainer: {
    alignItems: 'flex-end',
  },

  planPrice: {
    fontSize: Typography.size.lg,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.primary,
  },

  planPeriod: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  planFeatures: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },

  planFeatureText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },

  bottomInfo: {},

  bottomLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  bottomPrice: {
    fontSize: Typography.size.lg,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.primary,
  },

  bottomButton: {
    flex: 0.5,
  },
});
