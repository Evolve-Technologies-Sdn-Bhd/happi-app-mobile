/**
 * Vehicles Screen
 * Manage user vehicles under policy
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { Header, Card, Button, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'Vehicles'>;

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

// Mock data
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plateNumber: 'WXY 1234',
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    color: 'White',
  },
  {
    id: '2',
    plateNumber: 'ABC 5678',
    brand: 'Honda',
    model: 'City',
    year: 2021,
    color: 'Black',
  },
];

export const VehiclesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  const [vehicles, setVehicles] = useState(mockVehicles);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('membership.deleteVehicleConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setVehicles((prev) => prev.filter((v) => v.id !== id));
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <Card style={styles.vehicleCard}>
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car" size={28} color={Colors.primary} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.plateNumber}>{item.plateNumber}</Text>
          <Text style={styles.vehicleModel}>
            {item.brand} {item.model} ({item.year})
          </Text>
          <Text style={styles.vehicleColor}>{item.color}</Text>
        </View>
        <View style={styles.vehicleActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddEditVehicle', { vehicleId: item.id })}
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
        title={t('membership.myVehicles')}
        showBack
        rightIcon="add"
        onRightPress={() => navigation.navigate('AddEditVehicle', {})}
      />

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title={t('membership.noVehicles')}
            description={t('membership.noVehiclesDescription')}
            actionLabel={t('membership.addVehicle')}
            onAction={() => navigation.navigate('AddEditVehicle', {})}
          />
        }
        ListFooterComponent={
          vehicles.length > 0 ? (
            <Button
              title={t('membership.addVehicle')}
              variant="outline"
              icon="add"
              onPress={() => navigation.navigate('AddEditVehicle', {})}
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

  vehicleCard: {
    marginBottom: Spacing.sm,
  },

  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  vehicleInfo: {
    flex: 1,
  },

  plateNumber: {
    fontSize: Typography.size.lg,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },

  vehicleModel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  vehicleColor: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
  },

  vehicleActions: {
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
