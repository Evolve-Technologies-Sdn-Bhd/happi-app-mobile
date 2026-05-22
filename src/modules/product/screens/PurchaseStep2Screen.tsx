import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ProductStackParamList } from '../../../app/navigation/types';
import CyberStep2 from './purchase/cyber/step2';

type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep2'>;

export const PurchaseStep2Screen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { categoryCode } = route.params;

  if (categoryCode === 'HAPPI_CYBER') return <CyberStep2 />;

  // Other categories to be added
  return <CyberStep2 />;
};

export default PurchaseStep2Screen;
