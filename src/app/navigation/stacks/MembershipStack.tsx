/**
 * Membership Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MembershipStackParamList } from '../types';

// Import screens from membership module
import {
  MembershipIndexScreen,
  MembershipDetailScreen,
  MembershipPurchaseConfirmScreen,
  MembershipPurchaseSubmitScreen,
  PolicyDetailScreen,
  FamilyMembersScreen,
  VehiclesScreen,
  NomineesScreen,
  PurchaseHistoryScreen,
  MyMembershipListScreen,
} from '../../../modules/membership/screens';

// FamilyMembersScreen is used for nominee selection from confirm screen

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
      <Stack.Screen name="MembershipDetail" component={MembershipDetailScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="MembershipList" component={PurchaseHistoryScreen} />
      <Stack.Screen name="MembershipPurchaseConfirm" component={MembershipPurchaseConfirmScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="MembershipPurchaseSubmit" component={MembershipPurchaseSubmitScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
    </Stack.Navigator>
  );
};
