/**
 * Sign In Screen
 * Ported from happi-app-customer/src/views/public/sign-in/index.vue
 * User login with phone and password, with sliding panel design
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography } from '../../../shared/constants/styles';
import { useUserStore } from '../../../store';
import { useAuthStore } from '../../../store/authStore';
import { Config } from '../../../api/client';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  // Store actions
  const loginAction = useUserStore((state) => state.loginAction);
  const isLoading = useUserStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  
  // Country code
  const [countryCode] = useState('60');
  
  // Animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  useEffect(() => {
    // Animate panel sliding up on mount
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAction({
        username: username,
        password: password,
      });
      
      if (res.success && res.data) {
        // Set auth state - this will trigger navigation to Main
        const { accessToken, id, realname, mobile, email, avatar, membershipTier, coins } = res.data;
        await setAuth(
          {
            id: id,
            name: realname,
            phone: mobile,
            email: email,
            avatar: avatar,
            membershipTier: membershipTier,
            coins: coins,
          },
          accessToken
        );
        // Navigation will automatically switch to Main due to isAuthenticated change
      } else {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);
        
        if (newFailCount >= 3) {
          Alert.alert(
            'Forgot Password?',
            'You have entered the wrong password 3 times. Confirm to Reset Password?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'OK', 
                onPress: () => {
                  setFailCount(0);
                  navigation.navigate('ForgotPassword');
                }
              },
            ]
          );
        } else {
          Alert.alert('Error', res.message || 'Login failed. Please try again.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Yellow Background */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.background}
      >
        {/* Logo */}
        <View style={[styles.logoContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>HAPPI</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sliding White Panel */}
      <Animated.View 
        style={[
          styles.panel,
          { 
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 20,
          }
        ]}
      >
        {/* Panel Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formContainer}
        >
          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCode}>+{countryCode}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              value={username}
              onChangeText={setUsername}
              maxLength={15}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              maxLength={64}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={Colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity onPress={handleSignUp} style={styles.linkContainer}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Reset Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.linkContainer}>
            <Text style={styles.linkTextSecondary}>First Login / Reset password</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  
  background: {
    flex: 1,
  },
  
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  logoPlaceholder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoText: {
    fontSize: 32,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textWhite,
  },
  
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: SCREEN_HEIGHT * 0.6,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  
  formContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 25,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  
  countryCodeContainer: {
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: Spacing.sm,
  },
  
  countryCode: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  
  passwordInput: {
    paddingRight: 40,
  },
  
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    padding: Spacing.xs,
  },
  
  buttonContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 60,
    minWidth: 200,
    alignItems: 'center',
  },
  
  signInButtonDisabled: {
    opacity: 0.7,
  },
  
  signInButtonText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textWhite,
  },
  
  linkContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  
  linkText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
  },
  
  linkTextSecondary: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});
