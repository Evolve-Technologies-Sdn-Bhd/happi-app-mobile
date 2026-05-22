import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ProductStackParamList } from '../../../app/navigation/types';
import CyberStep3 from './purchase/cyber/step3';

type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep3'>;

export const PurchaseStep3Screen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { categoryCode } = route.params;

  if (categoryCode === 'HAPPI_CYBER') return <CyberStep3 />;

  // Other categories to be added
  return <CyberStep3 />;
};

export default PurchaseStep3Screen;
