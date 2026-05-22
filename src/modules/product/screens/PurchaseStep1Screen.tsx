/**
 * Purchase Step 1 — Dispatcher
 *
 * Routes to the correct category-specific step 1 screen based on categoryCode.
 * Each category screen lives in its own folder mirroring the Vue source structure:
 *   purchase/cyber/step1.tsx   ← happi-app-customer/src/views/purchase/cyber/step_1.vue
 *   purchase/home/step1.tsx    ← happi-app-customer/src/views/purchase/home/step_1.vue
 *   purchase/travel/step1.tsx  ← happi-app-customer/src/views/purchase/travel/step_1.vue
 */

import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ProductStackParamList } from '../../../app/navigation/types';
import CyberStep1 from './purchase/cyber/step1';
import HomeStep1 from './purchase/home/step1';
import TravelStep1 from './purchase/travel/step1';

type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep1'>;

export const PurchaseStep1Screen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { categoryCode } = route.params;

  if (categoryCode === 'HAPPI_CYBER') return <CyberStep1 />;
  if (categoryCode === 'HAPPI_HOME') return <HomeStep1 />;
  if (categoryCode === 'HAPPI_TRAVEL') return <TravelStep1 />;

  // Fallback — default to cyber
  return <CyberStep1 />;
};

export default PurchaseStep1Screen;
