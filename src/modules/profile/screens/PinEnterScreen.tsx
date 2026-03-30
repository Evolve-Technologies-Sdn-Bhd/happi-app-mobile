/**
 * PIN Enter Screen — verify current 4-digit PIN before changing
 * Mirrors happi-app-customer/src/views/profile/privacy-security/password/pin/enter.vue
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import authApi from '../../../api/auth';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const PIN_LENGTH = 4;

export const PinEnterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePress = () => inputRef.current?.focus();

  const onVerify = async () => {
    if (pin.length !== PIN_LENGTH) {
      Alert.alert('', 'Please enter your 4-digit PIN'); return;
    }
    setLoading(true);
    try {
      const res = await authApi.pinVerify({ pin });
      if ((res as any)?.success) {
        navigation.navigate('PinNew');
      } else {
        Alert.alert('', (res as any)?.msg || 'Invalid PIN');
        setPin('');
      }
    } catch {
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Change 4-digit PIN" showBack />

      <TouchableOpacity
        style={styles.body}
        activeOpacity={1}
        onPress={handlePress}
      >
        <Text style={styles.title}>Enter Current PIN</Text>
        <Text style={styles.subtitle}>For your security,</Text>
        <Text style={styles.subtitle}>please enter your current 4-digit PIN.</Text>

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

        <TouchableOpacity onPress={() => Alert.alert('Forgot PIN', 'Please contact support to reset your PIN.')}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.verifyBtn, (pin.length < PIN_LENGTH || loading) && styles.btnDisabled]}
          onPress={onVerify}
          disabled={pin.length < PIN_LENGTH || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={styles.verifyBtnText}>Verify Now</Text>
          }
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
    fontWeight: '700',
    color: '#010101',
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 14,
    color: '#808080',
    lineHeight: 22,
  },

  pinRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    marginBottom: 20,
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

  forgotText: {
    fontSize: 14,
    color: '#FDB813',
    marginTop: 8,
    fontWeight: '500',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#fdfdfd',
  },

  verifyBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },

  verifyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  btnDisabled: { opacity: 0.5 },
});
