/**
 * Voucher Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VoucherStackParamList } from '../types';

import {
  VoucherIndexScreen,
  MyVoucherScreen,
  VoucherDetailScreen,
  CountdownScreen,
  RedeemVoucherScreen,
  RedeemSuccessScreen,
  CoinHistoryScreen,
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
      <Stack.Screen name="VoucherMy" component={MyVoucherScreen} />
      <Stack.Screen name="VoucherDetail" component={VoucherDetailScreen} />
      <Stack.Screen name="VoucherCountdown" component={CountdownScreen} options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="VoucherRedeem" component={RedeemVoucherScreen} />
      <Stack.Screen name="RedeemSuccess" component={RedeemSuccessScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="CoinHistory" component={CoinHistoryScreen} />
    </Stack.Navigator>
  );
};
