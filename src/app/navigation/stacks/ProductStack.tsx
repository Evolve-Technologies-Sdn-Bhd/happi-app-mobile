/**
 * Product Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductStackParamList } from '../types';

// Import screens from product module
import { ProductIndexScreen, InsurancePlansScreen, PolicyDetailScreen, ProductDetailScreen, PurchaseDetailScreen, PurchaseStep1Screen, PurchaseStep2Screen, PurchaseStep3Screen, HomeStep2Screen, HomeStep3Screen, HomeStep4Screen, HomeStep5Screen, HomeSelectScreen, TravelStep2Screen, TravelStep3Screen, TravelPlanSelectScreen, TravelStep4Screen, TravelStep5Screen, TravelFamilySelectScreen } from '../../../modules/product/screens';

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
      <Stack.Screen name="InsurancePlans" component={InsurancePlansScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
      <Stack.Screen name="PurchaseStep1" component={PurchaseStep1Screen} />
      <Stack.Screen name="PurchaseStep2" component={PurchaseStep2Screen} />
      <Stack.Screen name="PurchaseStep3" component={PurchaseStep3Screen} />
      <Stack.Screen name="HomeStep2" component={HomeStep2Screen} />
      <Stack.Screen name="HomeStep3" component={HomeStep3Screen} />
      <Stack.Screen name="HomeSelect" component={HomeSelectScreen} />
      <Stack.Screen name="HomeStep4" component={HomeStep4Screen} />
      <Stack.Screen name="HomeStep5" component={HomeStep5Screen} />
      <Stack.Screen name="TravelStep2" component={TravelStep2Screen} />
      <Stack.Screen name="TravelFamilySelect" component={TravelFamilySelectScreen} />
      <Stack.Screen name="TravelStep3" component={TravelStep3Screen} />
      <Stack.Screen name="TravelPlanSelect" component={TravelPlanSelectScreen} />
      <Stack.Screen name="TravelStep4" component={TravelStep4Screen} />
      <Stack.Screen name="TravelStep5" component={TravelStep5Screen} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
    </Stack.Navigator>
  );
};
