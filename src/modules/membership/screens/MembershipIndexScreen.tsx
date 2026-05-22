/**
 * Membership Index Screen
 * Ported from happi-app-customer/src/views/membership/index.vue
 * Main membership page with promotional cards and membership card carousel
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { useUserStore, useMembershipStore } from '../../../store';
import { getOssImg } from '../../../api';
import { MembershipCardStack } from '../components/MembershipCardStack';

type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipIndex'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = 460;

export const MembershipIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  // Store state
  const userInfo = useUserStore((state) => state.info);
  const token = useUserStore((state) => state.token);
  const membershipList = useMembershipStore((state: any) => state.membershipList);
  const getMembershipListAction = useMembershipStore((state: any) => state.getMembershipListAction);
  
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const carouselInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Promotional images
  const promoImages = [
    getOssImg('happi/public/membership/membership-top-1.png'),
    getOssImg('happi/public/membership/membership-top-2.png'),
    getOssImg('happi/public/membership/membership-top-3.png'),
  ];
  
  // Display name logic (matching Vue)
  const displayName = React.useMemo(() => {
    const isLoggedIn = !!(token && userInfo?.id);
    if (!isLoggedIn) return 'YOUR NAME HERE';
    
    let name = userInfo?.realname || '';
    name = String(name);
    if (!name) return 'YOUR NAME HERE';
    
    const maxLength = 26;
    if (name.length <= maxLength) return name.toUpperCase();
    
    const splitPatterns = [
      { pattern: /\s+bin\s+/i, replacement: '\nBIN ' },
      { pattern: /\s+binti\s+/i, replacement: '\nBINTI ' },
      { pattern: /\s+a\/l\s+/i, replacement: '\nA/L ' },
      { pattern: /\s+a\/p\s+/i, replacement: '\nA/P ' },
    ];
    
    for (const { pattern, replacement } of splitPatterns) {
      if (pattern.test(name)) {
        return name.replace(pattern, replacement).toUpperCase();
      }
    }
    
    let breakPoint = name.lastIndexOf(' ', maxLength);
    if (breakPoint === -1 || breakPoint < 10) {
      breakPoint = maxLength;
    }
    
    const line1 = name.substring(0, breakPoint).trim();
    const line2 = name.substring(breakPoint).trim();
    return `${line1}\n${line2}`.toUpperCase();
  }, [userInfo, token]);
  
  const displayMemberId = React.useMemo(() => {
    const isLoggedIn = !!(token && userInfo?.id);
    if (!isLoggedIn) return '----';
    return userInfo?.uniqueId || '----';
  }, [userInfo, token]);
  
  // Load membership data
  useEffect(() => {
    getMembershipListAction();
  }, [getMembershipListAction]);
  
  // Auto-scroll promo carousel
  useEffect(() => {
    carouselInterval.current = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, 4000);
    
    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current);
      }
    };
  }, [promoImages.length]);
  
  const handleCardPress = (card: any) => {
    navigation.navigate('MembershipDetail', { membershipId: card.id });
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
        <ImageBackground
          source={require('../../../../assets/products/header-bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Membership</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
      
      {/* Promotional Cards Carousel */}
      <View style={styles.promoSection}>
        <ScrollView
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const contentOffsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffsetX / (SCREEN_WIDTH - 64 + 12));
            setCurrentPromoIndex(index);
          }}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH - 64 + 12}
          snapToAlignment="start"
          contentContainerStyle={styles.promoScrollContent}
        >
            {promoImages.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promoCard}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.promoImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Promo Indicators */}
          <View style={styles.promoIndicators}>
            {promoImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.promoIndicator,
                  currentPromoIndex === index && styles.promoIndicatorActive,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Membership Cards Stack — kept OUTSIDE the ScrollView so vertical
          swipe gestures don't conflict with the outer ScrollView on Android */}
      <View style={styles.cardsSection}>
        <MembershipCardStack
          cards={membershipList}
          displayName={displayName}
          displayMemberId={displayMemberId}
          onCardPress={handleCardPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  
  scrollView: {
    flexShrink: 0,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  
  // Header Section
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  
  headerBackground: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  
  headerSafeArea: {
    flex: 1,
  },
  
  headerContent: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    lineHeight: 32,
  },
  
  // Promotional Section
  promoSection: {
    marginTop: -130,
    paddingHorizontal: 32,
    height: 250,
    zIndex: 10,
  },
  
  promoScrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  
  promoCard: {
    width: SCREEN_WIDTH - 64,
    height: 200,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  promoImage: {
    width: '100%',
    height: '100%',
  },
  
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  
  promoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
  },
  
  promoIndicatorActive: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDB813',
  },
  
  // Cards Section
  cardsSection: {
    paddingHorizontal: 24,
    // paddingVertical: 60,
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
