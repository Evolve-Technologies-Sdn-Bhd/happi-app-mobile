/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { Colors } from '../../shared/constants/colors';
import { Typography } from '../../shared/constants/styles';

// Import tab stacks
import { HomeStack, MembershipStack, ProductStack, ServiceStack } from './stacks';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'home', default: 'home-outline' },
  Membership: { focused: 'card', default: 'card-outline' },
  Products: { focused: 'grid', default: 'grid-outline' },
  Service: { focused: 'briefcase', default: 'briefcase-outline' },
};

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = tabIcons[route.name];
          return (
            <Ionicons
              name={focused ? icon.focused : icon.default}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontWeight: Typography.weight.medium,
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderLight,
          paddingTop: 4,
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Membership"
        component={MembershipStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          // Hide tab bar on MembershipDetail, PurchaseConfirm and PurchaseSubmit
          const hideTabBar = routeName === 'MembershipDetail' ||
            routeName === 'MembershipPurchaseConfirm' ||
            routeName === 'MembershipPurchaseSubmit';
          return {
            tabBarLabel: 'Membership',
            tabBarStyle: hideTabBar ? { display: 'none' } : {
              backgroundColor: Colors.background,
              borderTopColor: Colors.borderLight,
              paddingTop: 4,
              height: 60,
              paddingBottom: 8,
            },
          };
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductStack}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const state = navigation.getState();
            navigation.dispatch(
              CommonActions.reset({
                ...state,
                // Strip the nested state from the Profile route so it resets to ProfileIndex
                routes: state.routes.map((route) =>
                  route.name === 'Profile'
                    ? { name: 'Profile', key: route.key }
                    : route
                ),
                index: state.routes.findIndex((r) => r.name === 'Profile'),
              })
            );
          },
        })}
      />
    </Tab.Navigator>
  );
};
