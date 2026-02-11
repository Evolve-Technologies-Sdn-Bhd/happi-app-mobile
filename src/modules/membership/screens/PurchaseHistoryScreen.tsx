/**
 * Purchase History Screen
 * View past purchases and transactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Header, Card, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';

interface Purchase {
  id: string;
  productName: string;
  planName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  paymentMethod: string;
  transactionId: string;
}

// Mock data
const mockPurchases: Purchase[] = [
  {
    id: '1',
    productName: 'Personal Accident Protection',
    planName: 'Standard',
    amount: 149,
    status: 'completed',
    date: new Date('2024-03-15'),
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-2024-001234',
  },
  {
    id: '2',
    productName: 'Vehicle Protection',
    planName: 'Premium',
    amount: 299,
    status: 'completed',
    date: new Date('2024-03-01'),
    paymentMethod: 'Online Banking',
    transactionId: 'TXN-2024-001233',
  },
  {
    id: '3',
    productName: 'Travel Protection',
    planName: 'Basic',
    amount: 79,
    status: 'failed',
    date: new Date('2024-02-20'),
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-2024-001232',
  },
];

const getStatusConfig = (status: Purchase['status']) => {
  switch (status) {
    case 'completed':
      return { color: Colors.success, icon: 'checkmark-circle', label: 'Completed' };
    case 'pending':
      return { color: Colors.warning, icon: 'time', label: 'Pending' };
    case 'failed':
      return { color: Colors.error, icon: 'close-circle', label: 'Failed' };
  }
};

export const PurchaseHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch purchase history
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderPurchase = ({ item }: { item: Purchase }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <Card style={styles.purchaseCard}>
        <View style={styles.purchaseHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.planName}>{item.planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.purchaseDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{item.paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValueSmall}>{item.transactionId}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t('membership.purchaseHistory')} showBack />

      <FlatList
        data={mockPurchases}
        keyExtractor={(item) => item.id}
        renderItem={renderPurchase}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={t('membership.noPurchases')}
            description={t('membership.noPurchasesDescription')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  purchaseCard: {
    marginBottom: Spacing.sm,
  },

  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  productName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  planName: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  purchaseDetails: {
    gap: Spacing.xs,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  detailValue: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  detailValueSmall: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
});
