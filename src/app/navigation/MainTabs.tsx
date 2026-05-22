/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { MainTabParamList } from './types';
import { Colors } from '../../shared/constants/colors';
import { Typography } from '../../shared/constants/styles';

// Import tab stacks
import { HomeStack, MembershipStack, ProductStack, ServiceStack, ProfileStack } from './stacks';

// Tab bar SVG icons
import HomeFill from '../../../assets/svg/tabbar/Home fill.svg';
import HomeStroke from '../../../assets/svg/tabbar/Home stroke.svg';
import MembershipFill from '../../../assets/svg/tabbar/Membership fill.svg';
import MembershipStroke from '../../../assets/svg/tabbar/Membership stroke.svg';
import ProductFill from '../../../assets/svg/tabbar/Product fill.svg';
import ProductStroke from '../../../assets/svg/tabbar/Product stroke.svg';
import ServiceFill from '../../../assets/svg/tabbar/Footer_Service fill.svg';
import ServiceStroke from '../../../assets/svg/tabbar/Footer_Service.svg';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_SIZE = 30;

const tabSvgIcons: Record<keyof MainTabParamList, { Fill: React.FC<any>; Stroke: React.FC<any> }> = {
  Home: { Fill: HomeFill, Stroke: HomeStroke },
  Membership: { Fill: MembershipFill, Stroke: MembershipStroke },
  Products: { Fill: ProductFill, Stroke: ProductStroke },
  Service: { Fill: ServiceFill, Stroke: ServiceStroke },
};

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = tabSvgIcons[route.name as keyof MainTabParamList];
          if (!icons) return null;
          const Icon = focused ? icons.Fill : icons.Stroke;
          return (
            <View style={{ opacity: focused ? 1 : 0.4 }}>
              <Icon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />
            </View>
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
        listeners={({ navigation }) => ({
          tabPress: () => {
            const state = navigation.getState();
            const productRoute = state.routes.find((r: any) => r.name === 'Products');
            const stackKey = productRoute?.state?.key;
            if (stackKey) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: stackKey,
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Service"
        component={ServiceStack}
        options={{ tabBarLabel: 'Service' }}
      />
    </Tab.Navigator>
  );
};
