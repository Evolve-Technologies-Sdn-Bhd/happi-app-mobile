/**
 * Nominees Screen
 * Manage policy nominees
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { Header, Card, Button, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';

type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'Nominees'>;

interface Nominee {
  id: string;
  name: string;
  relationship: string;
  icNumber: string;
  percentage: number;
}

// Mock data
const mockNominees: Nominee[] = [
  {
    id: '1',
    name: 'Jane Doe',
    relationship: 'Spouse',
    icNumber: '901231-01-5678',
    percentage: 50,
  },
  {
    id: '2',
    name: 'John Doe Jr',
    relationship: 'Child',
    icNumber: '150515-01-1234',
    percentage: 50,
  },
];

export const NomineesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  const [nominees, setNominees] = useState(mockNominees);

  const totalPercentage = nominees.reduce((sum, n) => sum + n.percentage, 0);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('membership.deleteNomineeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setNominees((prev) => prev.filter((n) => n.id !== id));
          },
        },
      ]
    );
  };

  const renderNominee = ({ item }: { item: Nominee }) => (
    <Card style={styles.nomineeCard}>
      <View style={styles.nomineeContent}>
        <View style={styles.nomineeAvatar}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </View>
        <View style={styles.nomineeInfo}>
          <Text style={styles.nomineeName}>{item.name}</Text>
          <Text style={styles.nomineeRelation}>{item.relationship}</Text>
          <Text style={styles.nomineeIC}>IC: {item.icNumber}</Text>
        </View>
        <View style={styles.nomineeRight}>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{item.percentage}%</Text>
          </View>
          <View style={styles.nomineeActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddEditNominee', { nomineeId: item.id })}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t('membership.nominees')}
        showBack
        rightIcon="add"
        onRightPress={() => navigation.navigate('AddEditNominee', {})}
      />

      {/* Total Percentage Banner */}
      {nominees.length > 0 && (
        <View
          style={[
            styles.percentageBanner,
            totalPercentage === 100 ? styles.percentageComplete : styles.percentageWarning,
          ]}
        >
          <Ionicons
            name={totalPercentage === 100 ? 'checkmark-circle' : 'warning'}
            size={20}
            color={totalPercentage === 100 ? Colors.success : Colors.warning}
          />
          <Text
            style={[
              styles.percentageBannerText,
              { color: totalPercentage === 100 ? Colors.success : Colors.warning },
            ]}
          >
            {totalPercentage === 100
              ? t('membership.benefitFullyAllocated')
              : t('membership.benefitNotFullyAllocated', { percentage: 100 - totalPercentage })}
          </Text>
        </View>
      )}

      <FlatList
        data={nominees}
        keyExtractor={(item) => item.id}
        renderItem={renderNominee}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="person-add-outline"
            title={t('membership.noNominees')}
            description={t('membership.noNomineesDescription')}
            actionLabel={t('membership.addNominee')}
            onAction={() => navigation.navigate('AddEditNominee', {})}
          />
        }
        ListFooterComponent={
          nominees.length > 0 && totalPercentage < 100 ? (
            <Button
              title={t('membership.addNominee')}
              variant="outline"
              icon="add"
              onPress={() => navigation.navigate('AddEditNominee', {})}
              style={styles.addButton}
            />
          ) : null
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

  percentageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },

  percentageComplete: {
    backgroundColor: `${Colors.success}15`,
  },

  percentageWarning: {
    backgroundColor: `${Colors.warning}15`,
  },

  percentageBannerText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  nomineeCard: {
    marginBottom: Spacing.sm,
  },

  nomineeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  nomineeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  nomineeInfo: {
    flex: 1,
  },

  nomineeName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  nomineeRelation: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  nomineeIC: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  nomineeRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },

  percentageBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },

  percentageText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  nomineeActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButton: {
    marginTop: Spacing.md,
  },
});
