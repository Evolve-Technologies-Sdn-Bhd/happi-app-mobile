/**
 * Sign In Screen
 * Ported from happi-app-customer/src/views/public/sign-in/index.vue
 * User login with phone and password, with sliding panel design
 * Supports slide-down gesture to skip to home (guest mode)
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
  PanResponder,
  Image,
  ImageBackground,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
type RoutePropType = RouteProp<AuthStackParamList, 'SignIn'>;

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const fromSplash = route.params?.fromSplash || false;
  const { t } = useTranslation();
  
  // Store actions
  const loginAction = useUserStore((state) => state.loginAction);
  const isLoading = useUserStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setGuestMode = useAuthStore((state) => state.setGuestMode);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  
  // Country code
  const [countryCode] = useState('60');
  
  // Animation for panel slide up/down
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  // Seamless transition animations - logo moves from splash position to sign-in position
  const logoTranslateY = useRef(new Animated.Value(fromSplash ? SCREEN_HEIGHT / 2 - 150 : SCREEN_HEIGHT / 2 - 200)).current; // Start at center, move to top
  const logoScale = useRef(new Animated.Value(fromSplash ? 1 : 2)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(fromSplash ? 1 : 0)).current; // Already visible if from splash
  
  // Splash gradient overlay fades out to reveal sign-in background
  const splashOpacity = useRef(new Animated.Value(fromSplash ? 1 : 0)).current;
  
  // Slide gesture tracking
  const slideThreshold = 100; // Distance to trigger skip to home
  const maxSlideDistance = 250;
  
  useEffect(() => {
    if (fromSplash) {
      // Seamless transition: Logo moves from splash center to sign-in top position
      // Splash gradient fades out, revealing sign-in background underneath
      Animated.sequence([
        // Small delay to ensure screen is rendered
        Animated.delay(50),
        
        // Logo moves up from center to final position while splash gradient fades
        Animated.parallel([
          Animated.spring(logoTranslateY, {
            toValue: 0, // Move to natural position (with marginTop styling providing spacing)\n            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }),
          
          // Splash gradient fades out (sign-in bg already visible underneath)
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          
          // Panel slides up immediately with logo animation (no delay)
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Direct navigation (not from splash) - smooth entrance without rotation
      Animated.sequence([
        Animated.delay(50),
        
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          
          Animated.spring(logoTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }),
          
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }),
          
          // Panel slides up immediately (no rotation animation)
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [fromSplash]);
  
  // Handle skip to home (guest mode)
  const handleSkipToHome = () => {
    console.log('Sliding down - navigating to home without login');
    
    // Animate panel sliding down
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Set guest mode to allow browsing without login
      setGuestMode(true);
      // Navigation will automatically switch to Main due to guest mode
    });
  };
  
  // Logo press to skip to home (auto-navigate without confirmation)
  const handleLogoPress = () => {
    handleSkipToHome();
  };
  
  // Pan responder for slide-down gesture on the panel handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          // Apply resistance for smooth feel
          let resistance;
          if (gestureState.dy < 80) {
            resistance = gestureState.dy * 0.9;
          } else if (gestureState.dy < 150) {
            resistance = 80 * 0.9 + (gestureState.dy - 80) * 0.6;
          } else {
            resistance = 80 * 0.9 + 70 * 0.6 + (gestureState.dy - 150) * 0.3;
          }
          
          panY.setValue(Math.min(resistance, maxSlideDistance));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check if user dragged past threshold
        if (gestureState.dy > slideThreshold) {
          handleSkipToHome();
        } else {
          // Snap back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

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
      
      console.log('Login response:', res);
      
      if (res.success && res.data) {
        // Set auth state - this will trigger navigation to Main
        const { accessToken, id, realname, mobile, email, avatar, membershipTier, coins } = res.data;
        
        console.log('Setting auth with token:', accessToken);
        console.log('User data:', { id, realname, mobile });
        
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
        
        console.log('Auth set successfully, navigation should switch automatically');
        // Navigation will automatically switch to Main due to isAuthenticated change
      } else {
        console.error('Login failed:', res);
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
          Alert.alert('Error', res.msg || res.message || 'Login failed. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
      
      {/* Splash gradient background - visible when transitioning from splash */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: splashOpacity }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['#FEF7DB', '#FEDA83']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      {/* Sign-in background with image (matching sign-in Vue) */}
      <Animated.View style={styles.backgroundWrapper}>
        <ImageBackground
          source={require('../../../../assets/images/sign-in-background.png')}
          style={styles.background}
          resizeMode="cover"
        >
          {/* Logo - moves from splash center to sign-in top position */}
          <TouchableOpacity 
            onPress={handleLogoPress}
            style={[styles.logoContainer, { paddingTop: insets.top + 20 }]}
            activeOpacity={0.8}
          >
            <Animated.Image
              source={require('../../../../assets/images/happi-white.png')}
              style={[
                styles.logoImage,
                {
                  opacity: logoOpacity,
                  transform: [
                    { translateY: logoTranslateY },
                    { scale: logoScale },
                    { 
                      rotate: logoRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ImageBackground>
      </Animated.View>

      {/* Sliding White Panel with pan gesture */}
      <Animated.View 
        style={[
          styles.panel,
          { 
            transform: [
              { translateY: Animated.add(slideAnim, panY) }
            ],
            paddingBottom: insets.bottom + 20,
          }
        ]}
      >
        {/* Panel Handle - drag down to skip login */}
        <View 
          style={styles.handleContainer}
          {...panResponder.panHandlers}
        >
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
              placeholderTextColor="#808080"
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
              placeholderTextColor="#808080"
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
                color="#808080"
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
          <TouchableOpacity onPress={handleForgotPassword} style={styles.linkContainerSecondary}>
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
    backgroundColor: '#FEF7DB',
  },
  
  backgroundWrapper: {
    flex: 1,
  },
  
  background: {
    flex: 1,
  },
  
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 80,
  },
  
  logoImage: {
    width: 170,
    height: 120,
  },
  
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    minHeight: SCREEN_HEIGHT * 0.6,
    paddingHorizontal: 32,
    paddingTop: 18,
  },
  
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xxl,
  },
  
  handle: {
    width: 49,
    height: 5,
    backgroundColor: '#B3B3B3',
    borderRadius: 3,
  },
  
  formContainer: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 46,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 64,
    backgroundColor: '#F5F5F5',
    borderWidth: 0,
  },
  
  countryCodeContainer: {
    paddingRight: 12,
    borderRightWidth: 0,
    marginRight: 12,
  },
  
  countryCode: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FDB813',
  },
  
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#808080',
    paddingVertical: 0,
    marginHorizontal: 12,
  },
  
  passwordInput: {
    paddingRight: 40,
  },
  
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  buttonContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 0,
    width: 250,
    alignItems: 'center',
  },
  
  signInButtonDisabled: {
    opacity: 0.7,
  },
  
  signInButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  linkContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  
  linkContainerSecondary: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  
  linkText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FDB813',
  },
  
  linkTextSecondary: {
    fontSize: 18,
    fontWeight: '500',
    color: '#808080',
  },
});
