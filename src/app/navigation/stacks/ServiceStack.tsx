/**
 * Service Stack Navigator
 * Navigation stack for service-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServiceStackParamList } from '../types';

// Import screens from service module
import {
  ServiceIndexScreen,
  ServiceDetailScreen,
} from '../../../modules/service/screens';

const Stack = createNativeStackNavigator<ServiceStackParamList>();

export const ServiceStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ServiceIndex" component={ServiceIndexScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
    </Stack.Navigator>
  );
};
