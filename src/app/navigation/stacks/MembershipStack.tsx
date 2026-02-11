/**
 * Membership Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MembershipStackParamList } from '../types';

// Import screens from membership module
import {
  MembershipIndexScreen,
  PolicyDetailScreen,
  FamilyMembersScreen,
  VehiclesScreen,
  NomineesScreen,
  PurchaseHistoryScreen,
} from '../../../modules/membership/screens';

const Stack = createNativeStackNavigator<MembershipStackParamList>();

export const MembershipStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MembershipIndex" component={MembershipIndexScreen} />
      <Stack.Screen name="MembershipDetail" component={PolicyDetailScreen} />
      <Stack.Screen name="MembershipList" component={PurchaseHistoryScreen} />
      <Stack.Screen name="MembershipPurchaseList" component={PurchaseHistoryScreen} />
    </Stack.Navigator>
  );
};
