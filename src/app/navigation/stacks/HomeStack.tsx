/**
 * Home Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

// Import screens from home module
import { 
  HomeIndexScreen, 
  ProductListScreen, 
  ProductDetailScreen 
} from '../../../modules/home/screens';

// Import notification screen from notification module
import NotificationScreen from '../../../modules/notification/screens/NotificationScreen';

// Import AI chat screen from chat module
import AIChatScreen from '../../../modules/chat/screens/AIChatScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeIndex" component={HomeIndexScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen 
        name="Notification" 
        component={NotificationScreen}
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="AIChat" 
        component={AIChatScreen}
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};
