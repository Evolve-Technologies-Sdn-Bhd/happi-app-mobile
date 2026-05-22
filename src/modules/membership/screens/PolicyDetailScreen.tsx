/**
 * Policy Detail Screen
 * View detailed policy information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { Header, Card, Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { FontFamily } from '../../../shared/constants/fonts';

type RouteProps = RouteProp<MembershipStackParamList, 'PolicyDetail'>;

// Mock policy detail
const mockPolicy = {
  id: '1',
  productName: 'Personal Accident Protection',
  planName: 'Standard',
  policyNumber: 'HP-PA-2024-001',
  status: 'active',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2025-01-14'),
  coverageAmount: 100000,
  premium: 149,
  insuredName: 'John Doe',
  insuredPhone: '+60123456789',
  insuredEmail: 'john@example.com',
  insuredIC: '900101-01-1234',
  benefits: [
    { name: 'Accidental Death', amount: 100000 },
    { name: 'Permanent Disability', amount: 100000 },
    { name: 'Medical Expenses', amount: 10000 },
    { name: 'Hospital Income', amount: 100 },
  ],
  nominees: [
    { name: 'Jane Doe', relationship: 'Spouse', percentage: 50 },
    { name: 'John Doe Jr', relationship: 'Child', percentage: 50 },
  ],
};

export const PolicyDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { policyId } = route.params;

  return (
    <View style={styles.container}>
      <Header title={t('membership.policyDetails')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Policy Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.productIcon}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <View style={[styles.statusBadge, styles.statusActive]}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <Text style={styles.productName}>{mockPolicy.productName}</Text>
          <Text style={styles.planName}>{mockPolicy.planName} Plan</Text>

          <View style={styles.policyNumber}>
            <Text style={styles.policyNumberLabel}>{t('membership.policyNumber')}</Text>
            <Text style={styles.policyNumberValue}>{mockPolicy.policyNumber}</Text>
          </View>
        </Card>

        {/* Coverage Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membership.coverageDetails')}</Text>
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('membership.coverage')}</Text>
              <Text style={styles.infoValueBold}>{formatCurrency(mockPolicy.coverageAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('membership.premium')}</Text>
              <Text style={styles.infoValue}>{formatCurrency(mockPolicy.premium)}/year</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('membership.startDate')}</Text>
              <Text style={styles.infoValue}>{formatDate(mockPolicy.startDate)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('membership.endDate')}</Text>
              <Text style={styles.infoValue}>{formatDate(mockPolicy.endDate)}</Text>
            </View>
          </Card>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membership.benefits')}</Text>
          <Card>
            {mockPolicy.benefits.map((benefit, index) => (
              <React.Fragment key={index}>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.benefitName}>{benefit.name}</Text>
                  <Text style={styles.benefitAmount}>{formatCurrency(benefit.amount)}</Text>
                </View>
                {index < mockPolicy.benefits.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Insured Person */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membership.insuredPerson')}</Text>
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('common.name')}</Text>
              <Text style={styles.infoValue}>{mockPolicy.insuredName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('common.icNumber')}</Text>
              <Text style={styles.infoValue}>{mockPolicy.insuredIC}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('common.phone')}</Text>
              <Text style={styles.infoValue}>{mockPolicy.insuredPhone}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('common.email')}</Text>
              <Text style={styles.infoValue}>{mockPolicy.insuredEmail}</Text>
            </View>
          </Card>
        </View>

        {/* Nominees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membership.nominees')}</Text>
          <Card>
            {mockPolicy.nominees.map((nominee, index) => (
              <React.Fragment key={index}>
                <View style={styles.nomineeRow}>
                  <View style={styles.nomineeAvatar}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.nomineeInfo}>
                    <Text style={styles.nomineeName}>{nominee.name}</Text>
                    <Text style={styles.nomineeRelation}>{nominee.relationship}</Text>
                  </View>
                  <Text style={styles.nomineePercentage}>{nominee.percentage}%</Text>
                </View>
                {index < mockPolicy.nominees.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.base }]}>
        <Button
          title={t('membership.downloadPolicy')}
          variant="outline"
          style={{ flex: 1, marginRight: Spacing.sm }}
          onPress={() => {}}
        />
        <Button
          title={t('membership.renew')}
          style={{ flex: 1 }}
          onPress={() => {}}
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

  scrollContent: {
    padding: Spacing.base,
  },

  headerCard: {
    marginBottom: Spacing.base,
    alignItems: 'center',
  },

  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },

  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },

  statusActive: {
    backgroundColor: `${Colors.success}15`,
  },

  statusText: {
    fontSize: Typography.size.sm,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: Colors.success,
  },

  productName: {
    fontSize: Typography.size.lg,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },

  planName: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  policyNumber: {
    backgroundColor: Colors.backgroundGrey,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },

  policyNumberLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  policyNumberValue: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
  },

  section: {
    marginBottom: Spacing.base,
  },

  sectionTitle: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },

  infoLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  infoValue: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium, fontWeight: '500',
  },

  infoValueBold: {
    fontSize: Typography.size.lg,
    color: Colors.primary,
    fontFamily: FontFamily.bold, fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },

  benefitName: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },

  benefitAmount: {
    fontSize: Typography.size.sm,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
  },

  nomineeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },

  nomineeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  nomineeInfo: {
    flex: 1,
  },

  nomineeName: {
    fontSize: Typography.size.sm,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: Colors.textPrimary,
  },

  nomineeRelation: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  nomineePercentage: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.primary,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
});
