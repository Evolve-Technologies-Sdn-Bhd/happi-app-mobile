/**
 * Family Members Screen
 * Manage family members under the policy
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
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';

type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'FamilyMembers'>;

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  icNumber: string;
  phone?: string;
}

// Mock data
const mockFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Jane Doe',
    relationship: 'Spouse',
    icNumber: '901231-01-5678',
    phone: '+60123456781',
  },
  {
    id: '2',
    name: 'John Doe Jr',
    relationship: 'Child',
    icNumber: '150515-01-1234',
  },
];

export const FamilyMembersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  const [familyMembers, setFamilyMembers] = useState(mockFamilyMembers);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('membership.deleteFamilyMemberConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: FamilyMember }) => (
    <Card style={styles.memberCard}>
      <View style={styles.memberContent}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRelation}>{item.relationship}</Text>
          <Text style={styles.memberIC}>IC: {item.icNumber}</Text>
          {item.phone && (
            <Text style={styles.memberPhone}>{item.phone}</Text>
          )}
        </View>
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddEditFamilyMember', { memberId: item.id })}
          >
            <Ionicons name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t('membership.familyMembers')}
        showBack
        rightIcon="add"
        onRightPress={() => navigation.navigate('AddEditFamilyMember', {})}
      />

      <FlatList
        data={familyMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('membership.noFamilyMembers')}
            description={t('membership.noFamilyMembersDescription')}
            actionLabel={t('membership.addFamilyMember')}
            onAction={() => navigation.navigate('AddEditFamilyMember', {})}
          />
        }
        ListFooterComponent={
          familyMembers.length > 0 ? (
            <Button
              title={t('membership.addFamilyMember')}
              variant="outline"
              icon="add"
              onPress={() => navigation.navigate('AddEditFamilyMember', {})}
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

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  memberCard: {
    marginBottom: Spacing.sm,
  },

  memberContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  memberRelation: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  memberIC: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  memberPhone: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  memberActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButton: {
    marginTop: Spacing.md,
  },
});
