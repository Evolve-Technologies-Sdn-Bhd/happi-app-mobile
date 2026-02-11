/**
 * Voucher Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VoucherStackParamList } from '../types';

// Import screens from voucher module
import {
  VoucherIndexScreen,
  VoucherDetailScreen,
  RedeemVoucherScreen,
} from '../../../modules/voucher/screens';

const Stack = createNativeStackNavigator<VoucherStackParamList>();

export const VoucherStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="VoucherIndex" component={VoucherIndexScreen} />
      <Stack.Screen name="VoucherList" component={VoucherIndexScreen} />
      <Stack.Screen name="VoucherDetail" component={VoucherDetailScreen} />
      <Stack.Screen name="VoucherRedeem" component={RedeemVoucherScreen} />
      <Stack.Screen name="VoucherMy" component={VoucherIndexScreen} />
    </Stack.Navigator>
  );
};
