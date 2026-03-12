/**
 * Startup Screen
 * Ported from happi-app-customer/src/views/startup.vue
 * Shows privacy notice on first launch, splash screen if already agreed
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography } from '../../../shared/constants/styles';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '../../../store';
import { useUserStore } from '../../../store';
import { Config } from '../../../api/client';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Startup'>;

// Animated Splash Screen Component
const AnimatedSplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Logo entrance animation: Fade in + Scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After entrance, start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Background subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0.7,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      {/* Background Image with pulse animation */}
      <Animated.Image
        source={require('../../../../assets/images/sign-in-background.png')}
        style={[
          styles.splashBackground,
          {
            opacity: backgroundOpacity,
          },
        ]}
        resizeMode="cover"
      />
      
      {/* Gradient overlay for depth */}
      <LinearGradient
        colors={['rgba(254, 247, 219, 0.1)', 'rgba(254, 218, 131, 0.2)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        <Image
          source={require('../../../../assets/images/happi-white.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        
        {/* Loading indicator dots */}
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Loading Dot Component
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [delay]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

export const StartupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const agreed = useCommonStore((state) => state.agreed);
  const setAgreed = useCommonStore((state) => state.setAgreed);
  const token = useUserStore((state) => state.token);
  
  const [versionCode, setVersionCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasNavigatedToOnboarding, setHasNavigatedToOnboarding] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Get version code
    const version = Constants.expoConfig?.version || Config.VERSION_CODE;
    setVersionCode(version);
    
    // Only auto-navigate if already agreed on app start (not after clicking Agree)
    if (agreed && !hasNavigatedToOnboarding) {
      // Navigate to main after splash delay - give time for logo animation
      timeoutId = setTimeout(() => {
        if (token) {
          // Navigate to main app (TabNavigator)
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'SignIn' }], // This should go to Main, but we need to handle auth state
            })
          );
        } else {
          navigation.navigate('SignIn', { fromSplash: true });
        }
      }, 2800); // Increased delay for better transition timing
    } else if (!agreed) {
      setIsLoading(false);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);  // Only run on mount

  const handleAgree = async () => {
    await setAgreed(true);
    setHasNavigatedToOnboarding(true);
    // Navigate to onboarding flow
    navigation.navigate('Onboarding');
  };

  const handleDisagree = () => {
    Alert.alert(
      'We Respect Your Privacy',
      'To use this app, you must accept our Privacy & Cookie Notice. If you do not agree, unfortunately, we will not be able to provide access to our services.',
      [{ text: 'OK' }]
    );
  };

  const handleViewPrivacyPolicy = () => {
    Linking.openURL('https://happi.com.my/privacy-policy-happi/');
  };

  // Show splash screen if already agreed
  if (agreed || isLoading) {
    return <AnimatedSplashScreen />;
  }

  // Show privacy notice if not agreed
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoPlaceholder, styles.logoPlaceholderPrimary]}>
            <Text style={styles.logoTextPrimary}>HAPPI</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Privacy & Cookie Notice</Text>

        {/* Privacy Content */}
        <View style={styles.privacyContent}>
          <Text style={styles.privacyText}>Welcome to HAPPI</Text>
          
          <Text style={styles.privacyText}>
            To provide you with a secure and personalized app experience, we may collect and use your personal information, including data related to your usage, preferences, and transactions.
          </Text>
          
          <Text style={styles.privacyText}>
            We also use cookies and similar technologies to improve the performance of our app and tailor our services to your needs.
          </Text>
          
          <Text style={styles.privacyText}>
            By tapping "Agree", you consent to our use of data and cookies as explained in our Privacy Policy. You may review or update your privacy preferences in the app settings at any time.
          </Text>
          
          <TouchableOpacity onPress={handleViewPrivacyPolicy}>
            <Text style={styles.policyLink}>View Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title="Agree"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleAgree}
            style={styles.agreeButton}
          />
          <Button
            title="Disagree"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleDisagree}
            style={styles.disagreeButton}
          />
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Version {versionCode}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Splash screen styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  splashBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  splashLogo: {
    width: 150,
    height: 80,
  },
  
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoPlaceholderPrimary: {
    backgroundColor: Colors.primary + '20',
  },
  
  logoTextWhite: {
    fontSize: 32,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textWhite,
  },
  
  logoTextPrimary: {
    fontSize: 28,
    fontWeight: Typography.weight.bold as any,
    color: Colors.primary,
  },
  
  // Privacy notice styles
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  
  privacyContent: {
    flex: 1,
  },
  
  privacyText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  
  policyLink: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold as any,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  
  buttonsContainer: {
    marginTop: 'auto',
    gap: Spacing.md,
  },
  
  agreeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  
  disagreeButton: {
    borderRadius: 25,
    borderColor: Colors.primary,
  },
  
  versionText: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
