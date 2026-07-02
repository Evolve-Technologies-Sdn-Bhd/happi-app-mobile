/**
 * PIN New Screen — enter new 4-digit PIN
 * Mirrors happi-app-customer/src/views/profile/privacy-security/password/pin/new.vue
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const PIN_LENGTH = 4;

export const PinNewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');

  const onContinue = () => {
    if (pin.length !== PIN_LENGTH) {
      Alert.alert('', 'Please enter your new 4-digit PIN'); return;
    }
    navigation.navigate('PinConfirm', { newPin: pin });
  };

  return (
    <View style={styles.container}>
      <Header title="Change 4-digit PIN" showBack />

      <TouchableOpacity
        style={styles.body}
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        <Text style={styles.title}>Create New PIN</Text>
        <Text style={styles.subtitle}>Enter your new 4-digit PIN.</Text>

        {/* PIN boxes */}
        <View style={styles.pinRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.pinBox, pin.length > i && styles.pinBoxFilled]}
            >
              <Text style={styles.pinDot}>{pin[i] ? '●' : ''}</Text>
            </View>
          ))}
        </View>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, PIN_LENGTH))}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          caretHidden
          autoFocus
          underlineColorAndroid="transparent"
        />
      </TouchableOpacity>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, pin.length < PIN_LENGTH && styles.btnDisabled]}
          onPress={onContinue}
          disabled={pin.length < PIN_LENGTH}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },

  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#010101',
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 14,
    color: '#808080',
  },

  pinRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },

  pinBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D3D4D6',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pinBoxFilled: {
    borderColor: '#FDB813',
  },

  pinDot: {
    fontSize: 22,
    color: '#010101',
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#fdfdfd',
  },

  continueBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },

  continueBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#ffffff',
  },

  btnDisabled: { opacity: 0.5 },
});
