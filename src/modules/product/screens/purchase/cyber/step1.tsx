/**
 * Purchase Step 1 — Cyber Insurance
 * Ported from happi-app-customer/src/views/purchase/cyber/step_1.vue
 *
 * Question: Employment & Residence Location (Malaysia / Overseas)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import RadioCard from '../shared/RadioCard';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep1'>;

const CyberStep1: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { categoryCode, productId, companyId } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [employmentLocation, setEmploymentLocation] = useState<number | null>(1);

  const handleContinue = () => {
    navigation.navigate('PurchaseStep2', {
      productId,
      categoryCode,
      companyId,
      employmentLocation: employmentLocation ?? 1,
    });
  };

  return (
    <KeyboardAvoidingView
      style={sharedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={sharedStyles.headerSection}>
        <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={sharedStyles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={sharedStyles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={config.backColor} />
                <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={sharedStyles.headerTextBlock}>
              <Text style={sharedStyles.headerTitle}>{config.title}</Text>
              {!!config.subTitle && (
                <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={sharedStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.questionText}>Employment &amp; Residence Location</Text>
          <RadioCard
            options={[
              { name: 'Malaysia', value: 1 },
              { name: 'Overseas', value: 2 },
            ]}
            value={employmentLocation}
            onChange={setEmploymentLocation}
          />
        </View>

        <TouchableOpacity
          style={sharedStyles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CyberStep1;
