/**
 * Onboarding Screen
 * Modern multi-page onboarding with smooth scroll animations
 * Uses native ScrollView paging for smooth transitions
 * Supports skip to home (guest mode)
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { useAuthStore } from '../../../store/authStore';
import { useAppStore } from '../../../store/appStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Onboarding data
const ONBOARDING_PAGES = [
  {
    id: 1,
    title: ['All Your Insurance,', 'One App'],
    subtitle: 'Simple, paperless, and always with you.',
    image: require('../../../../assets/onboarding/1.png'),
  },
  {
    id: 2,
    title: ['Choose What You Need', ''],
    subtitle: 'Cyber, Home, Travel & more\n- protection made simple.',
    image: require('../../../../assets/onboarding/2.png'),
  },
  {
    id: 3,
    title: ['Earn HAPPICoins with', 'every insurance plan'],
    subtitle: 'Stay protected, earn HAPPIcoins,\nenjoy real-life perks.',
    image: require('../../../../assets/onboarding/3.png'),
  },
  {
    id: 4,
    title: ['Redeem at Your', 'Favourite Merchants'],
    subtitle: 'Use HAPPIcoins at cafes, spas,\ncar services & more.',
    image: require('../../../../assets/onboarding/4.png'),
  },
];

// Animated Page Indicator with smooth transitions
const AnimatedIndicator: React.FC<{
  scrollX: Animated.Value;
  total: number;
  onPress: (index: number) => void;
}> = ({ scrollX, total, onPress }) => {
  return (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: total }, (_, index) => {
        // Animate indicator based on scroll position
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [1, 1.2, 1],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

        return (
          <TouchableOpacity
            key={index}
            onPress={() => onPress(index)}
            activeOpacity={0.7}
          >
            <Animated.Image
              source={require('../../../../assets/onboarding/indicator-active.png')}
              style={[
                styles.indicatorDot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Individual page component with parallax effects
const OnboardingPage: React.FC<{
  data: typeof ONBOARDING_PAGES[0];
  index: number;
  scrollX: Animated.Value;
  insets: { top: number; bottom: number };
}> = ({ data, index, scrollX, insets }) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  // Parallax effect for image - moves slower than scroll
  const imageTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
    extrapolate: 'clamp',
  });

  // Title comes in from further away for depth effect
  const titleTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [SCREEN_WIDTH * 0.5, 0, -SCREEN_WIDTH * 0.5],
    extrapolate: 'clamp',
  });

  // Subtitle has slight delay effect
  const subtitleTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [SCREEN_WIDTH * 0.4, 0, -SCREEN_WIDTH * 0.4],
    extrapolate: 'clamp',
  });

  // Fade in/out
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // Scale effect for image
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });

  // Rotate effect for subtle 3D feel
  const imageRotate = scrollX.interpolate({
    inputRange,
    outputRange: ['5deg', '0deg', '-5deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      {/* Title with parallax */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            transform: [{ translateX: titleTranslateX }],
            opacity,
          },
        ]}
      >
        <Text style={styles.title}>{data.title[0]}</Text>
        {data.title[1] ? <Text style={styles.title}>{data.title[1]}</Text> : null}
      </Animated.View>

      {/* Image with parallax and scale */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [
              { translateX: imageTranslateX },
              { scale: imageScale },
              { rotate: imageRotate },
            ],
            opacity,
          },
        ]}
      >
        <Image source={data.image} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* Subtitle with parallax */}
      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            transform: [{ translateX: subtitleTranslateX }],
            opacity,
          },
        ]}
      >
        <Text style={styles.subtitle}>{data.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(0);
  const setGuestMode = useAuthStore((state) => state.setGuestMode);
  const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);

  const handleClose = useCallback(async () => {
    // Mark onboarding as done so it is never shown again (even after logout)
    await setOnboardingCompleted(true);
    setGuestMode(true);
  }, [setGuestMode, setOnboardingCompleted]);

  const handleIndicatorPress = useCallback((index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
      
      // Clamp to valid page range
      const clampedIndex = Math.max(0, Math.min(pageIndex, ONBOARDING_PAGES.length - 1));
      setCurrentPage(clampedIndex);
    },
    []
  );

  // Close button fade based on scroll
  const closeButtonOpacity = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.5],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  return (
    <LinearGradient
      colors={['#fef7db', '#feda83']}
      start={{ x: 0.217, y: 0 }}
      end={{ x: 0.733, y: 1 }}
      style={styles.container}
    >
      {/* Close Button */}
      <Animated.View
        style={[
          styles.closeButton,
          { top: insets.top + 20, opacity: closeButtonOpacity },
        ]}
      >
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Scrollable pages */}
      <Animated.ScrollView
        ref={scrollViewRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ONBOARDING_PAGES.map((page, index) => (
          <OnboardingPage
            key={page.id}
            data={page}
            index={index}
            scrollX={scrollX}
            insets={insets}
          />
        ))}
      </Animated.ScrollView>

      {/* Animated Indicator */}
      <View style={[styles.indicatorWrapper, { bottom: insets.bottom + 40 }]}>
        <AnimatedIndicator
          scrollX={scrollX}
          total={ONBOARDING_PAGES.length}
          onPress={handleIndicatorPress}
        />
      </View>

      {/* Get Started button on last page */}
      <Animated.View
        style={[
          styles.getStartedContainer,
          {
            bottom: insets.bottom + 90,
            opacity: scrollX.interpolate({
              inputRange: [
                (ONBOARDING_PAGES.length - 2) * SCREEN_WIDTH,
                (ONBOARDING_PAGES.length - 1) * SCREEN_WIDTH,
              ],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: scrollX.interpolate({
                  inputRange: [
                    (ONBOARDING_PAGES.length - 2) * SCREEN_WIDTH,
                    (ONBOARDING_PAGES.length - 1) * SCREEN_WIDTH,
                  ],
                  outputRange: [30, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    zIndex: 20,
  },
  closeText: {
    fontSize: 28,
    fontFamily: FontFamily.light,
    fontWeight: '300',
    color: '#2d3436',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 10,
    minHeight: 80,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#343434',
    textAlign: 'center',
    lineHeight: 36,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  image: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.38,
  },
  subtitleContainer: {
    marginBottom: 120,
    minHeight: 60,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#343434',
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  indicatorDot: {
    width: 38.5,
    height: 7.5,
  },
  getStartedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
