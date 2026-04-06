/**
 * PIN Confirm Screen — re-enter new PIN to confirm, then call pinSet API
 * Mirrors happi-app-customer/src/views/profile/privacy-security/password/pin/confirm.vue
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import authApi from '../../../api/auth';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
type RoutePropType = RouteProp<ProfileStackParamList, 'PinConfirm'>;

const PIN_LENGTH = 4;

export const PinConfirmScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const newPin = route.params.newPin;

  const onConfirm = async () => {
    if (pin.length !== PIN_LENGTH) {
      Alert.alert('', 'Please re-enter your 4-digit PIN'); return;
    }
    if (pin !== newPin) {
      Alert.alert('', 'PIN does not match. Please try again.');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.pinSet({ pin });
      if ((res as any)?.success) {
        Alert.alert('PIN Changed', 'Your PIN has been changed successfully.', [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      } else {
        Alert.alert('', (res as any)?.msg || 'Failed to update PIN');
      }
    } catch {
      Alert.alert('Error', 'Failed to update PIN. Please try again.');
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
        onPress={() => inputRef.current?.focus()}
      >
        <Text style={styles.title}>Confirm New PIN</Text>
        <Text style={styles.subtitle}>Re-enter your new PIN to confirm.</Text>

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
          style={[styles.confirmBtn, (pin.length < PIN_LENGTH || loading) && styles.btnDisabled]}
          onPress={onConfirm}
          disabled={pin.length < PIN_LENGTH || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={styles.confirmBtnText}>Confirm</Text>
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

  confirmBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },

  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  btnDisabled: { opacity: 0.5 },
});
