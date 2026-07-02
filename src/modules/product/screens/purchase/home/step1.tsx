/**
 * Purchase Step 1 — Home Content Insurance
 * Ported from happi-app-customer/src/views/purchase/home/step_1.vue
 *
 * Question: Have you suffered any losses including flood damages for the past 3 years?
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
import { TextInput } from '../../../../../shared/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import RadioButton from '../shared/RadioButton';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep1'>;

const HomeStep1: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { categoryCode, productId, companyId } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [isDamage, setIsDamage] = useState<number | null>(null);
  const [damageDetail, setDamageDetail] = useState('');

  const handleContinue = () => {
    if (isDamage === null) {
      Alert.alert('', 'Please select an option');
      return;
    }
    if (isDamage === 1 && !damageDetail.trim()) {
      Alert.alert('', 'Please provide details of the damage');
      return;
    }
    navigation.navigate('HomeStep2', {
      productId,
      categoryCode,
      companyId,
      isDamage,
      damageDetail,
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.questionText}>
            Have you suffered any losses including flood damages for the past 3 years?
          </Text>
          <RadioButton
            options={[
              { name: 'Yes', value: 1 },
              { name: 'No', value: 0 },
            ]}
            value={isDamage}
            onChange={setIsDamage}
          />
          {isDamage === 1 && (
            <View style={styles.damageDetailWrapper}>
              <Text style={styles.damageDetailLabel}>Kindly provide the details</Text>
              <TextInput
                style={styles.damageDetailInput}
                value={damageDetail}
                onChangeText={setDamageDetail}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{damageDetail.length}/300</Text>
            </View>
          )}
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

const styles = StyleSheet.create({
  damageDetailWrapper: { alignSelf: 'stretch', marginTop: 24 },
  damageDetailLabel: {
    color: '#343434',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    marginBottom: 12,
  },
  damageDetailInput: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    minHeight: 120,
    padding: 12,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#343434',
  },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: '#808080', marginTop: 4 },
});

export default HomeStep1;
