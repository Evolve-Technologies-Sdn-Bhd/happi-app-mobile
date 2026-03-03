/**
 * Product Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductStackParamList } from '../types';

// Import screens from product module
import { ProductIndexScreen } from '../../../modules/product/screens';
// Import detail screen from home module (can be moved later)
import { ProductDetailScreen } from '../../../modules/home/screens';

const Stack = createNativeStackNavigator<ProductStackParamList>();

export const ProductStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProductIndex" component={ProductIndexScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
};
