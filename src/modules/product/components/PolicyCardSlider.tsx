/**
 * Policy Card Slider Component
 * Displays insurance policy cards in a horizontal swiper
 * Matches Vue reference design exactly
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 32;
// Cap at 400 so the card doesn't stretch across a wide web viewport
const CARD_WIDTH = Math.min(SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2, 400);
const CARD_HEIGHT = 200;
const CARD_SPACING = 12;

interface Policy {
  id: string;
  productName: string;
  year: string;
  customerName: string;
  policyNumber: string;
  companyLogo?: string;
}

interface PolicyCardSliderProps {
  policies: Policy[];
  onCardPress?: (policy: Policy) => void;
}

// ─── Mock Card (empty state) ──────────────────────────────────────────────────

const MockCard: React.FC = () => (
  <View style={styles.cardItem}>
    <ImageBackground
      source={require('../../../../assets/products/card-bg.png')}
      style={styles.cardBackground}
      imageStyle={styles.cardBackgroundImage}
      resizeMode="cover"
    >
      <View style={styles.cardContent}>
        {/* Left content */}
        <View style={styles.cardLeftContent}>
          <Text style={styles.productType}>Welcome New User</Text>
          <Text style={styles.cardYear}>----</Text>
          <Text style={styles.customerName}>Please Buy One of The Card</Text>
          <View style={styles.policySection}>
            <Text style={styles.policyLabel}>Policy No</Text>
            <Text style={styles.policyNumber}>--</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  </View>
);

// ─── Policy Card ──────────────────────────────────────────────────────────────

const PolicyCard: React.FC<{
  policy: Policy;
  onPress?: () => void;
}> = ({ policy, onPress }) => {
  /**
   * Mirrors Vue's formatDisplayName logic exactly:
   * - <= 25 chars → uppercase, no split
   * - bin / binti / a/l / a/p → split at that word
   * - fallback → split near the middle
   * Returns an array of lines so RN can render them without dangerouslySetInnerHTML
   */
  const formatDisplayName = (name: string): string[] => {
    if (!name) return [''];
    const maxLength = 25;

    if (name.length <= maxLength) {
      return [name.toUpperCase()];
    }

    const splitPatterns = [
      { pattern: /\s+bin\s+/i, label: 'BIN' },
      { pattern: /\s+binti\s+/i, label: 'BINTI' },
      { pattern: /\s+a\/l\s+/i, label: 'A/L' },
      { pattern: /\s+a\/p\s+/i, label: 'A/P' },
    ];

    for (const { pattern, label } of splitPatterns) {
      const match = name.match(pattern);
      if (match && match.index !== undefined) {
        const before = name.substring(0, match.index).trim().toUpperCase();
        const after = name.substring(match.index + match[0].length).trim().toUpperCase();
        return [before, `${label} ${after}`];
      }
    }

    // Fallback: split near middle
    const midPoint = Math.floor(name.length / 2);
    let breakPoint = name.lastIndexOf(' ', midPoint);
    if (breakPoint === -1 || breakPoint < 10) {
      breakPoint = maxLength;
    }
    const line1 = name.substring(0, breakPoint).trim().toUpperCase();
    const line2 = name.substring(breakPoint).trim().toUpperCase();
    return [line1, line2];
  };

  const nameLines = formatDisplayName(policy.customerName);

  return (
    <TouchableOpacity style={styles.cardItem} onPress={onPress} activeOpacity={0.95}>
      <ImageBackground
        source={require('../../../../assets/products/card-bg.png')}
        style={styles.cardBackground}
        imageStyle={styles.cardBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.cardContent}>
          {/* Left content */}
          <View style={styles.cardLeftContent}>
            <Text style={styles.productType} numberOfLines={1}>
              {policy.productName}
            </Text>

            <Text style={styles.cardYear}>{policy.year}</Text>

            {/* Multi-line name rendered without dangerouslySetInnerHTML */}
            <View style={styles.customerNameWrapper}>
              {nameLines.map((line, i) => (
                <Text key={i} style={styles.customerName}>
                  {line}
                </Text>
              ))}
            </View>

            <View style={styles.policySection}>
              <Text style={styles.policyLabel}>Policy No</Text>
              <Text style={styles.policyNumber}>{policy.policyNumber || '--'}</Text>
            </View>
          </View>
        </View>

        {/* Company logo — bottom-right absolute, same as Vue */}
        {policy.companyLogo ? (
          <View style={styles.companyLogoWrapper}>
            <Image
              source={{ uri: policy.companyLogo }}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          </View>
        ) : null}
      </ImageBackground>
    </TouchableOpacity>
  );
};

// ─── Slider ───────────────────────────────────────────────────────────────────

export const PolicyCardSlider: React.FC<PolicyCardSliderProps> = ({
  policies,
  onCardPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    setActiveIndex(Math.max(0, Math.min(index, policies.length - 1)));
  };

  // Empty state — mirror Vue's <template v-else>
  if (!policies || policies.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.swiperContainer}>
          <MockCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {policies.map((policy, index) => (
          <PolicyCard
            key={policy.id ?? index}
            policy={policy}
            onPress={() => onCardPress?.(policy)}
          />
        ))}
      </ScrollView>

      {/* Dot indicators — only shown when >1 card, mirrors Vue indicator-dots */}
      {policies.length > 1 && (
        <View style={styles.indicatorContainer}>
          {policies.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === activeIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Outer container ──────────────────────────────────────────────────────
  container: {
    marginTop: -130,          // Same as Vue: margin-top: -130px
    paddingHorizontal: CARD_HORIZONTAL_PADDING, // Same as Vue: padding: 0 32px
    height: 250,              // Same as Vue: height: 250px
    zIndex: 10,
  },
  swiperContainer: {
    height: '100%',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },

  // ── Card shell ────────────────────────────────────────────────────────────
  cardItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,      // 200px — same as Vue
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: CARD_SPACING,
    elevation: 5,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
  },
  cardBackgroundImage: {
    borderRadius: 16,
    width: '100%',
    height: '100%',
  },

  // ── Card layout ───────────────────────────────────────────────────────────
  cardContent: {
    flex: 1,
    flexDirection: 'row',
  },

  /**
   * KEY FIX:
   * Removed `justifyContent: 'space-between'` from here.
   * Vue uses explicit margins on each child + `margin-bottom: auto`
   * on customerName (= flex: 1 in RN) to push Policy section down.
   */
  cardLeftContent: {
    flex: 1,
    padding: 20,
    // No justifyContent — children control their own spacing
  },

  // ── Card text elements ────────────────────────────────────────────────────
  productType: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#343434',
    fontFamily: FontFamily.bold,
    lineHeight: 19,
    marginBottom: 8,          // explicit, same as Vue
  },
  cardYear: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#666666',
    fontFamily: FontFamily.medium,
    marginBottom: 16,         // explicit, same as Vue
  },

  /**
   * customerNameWrapper takes all remaining vertical space
   * (flex: 1 = margin-bottom: auto in Vue), which naturally
   * pushes the policySection to the bottom of the card.
   */
  customerNameWrapper: {
    flex: 1,                  // pushes policy section to bottom
    justifyContent: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    fontFamily: FontFamily.bold,
    lineHeight: 19.5,
  },

  // ── Policy number block ───────────────────────────────────────────────────
  policySection: {
    // sits at the bottom naturally because customerNameWrapper has flex: 1
  },
  policyLabel: {
    fontSize: 12,
    color: '#999999',
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  policyNumber: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#666666',
    fontFamily: FontFamily.medium,
  },

  // ── Company logo ──────────────────────────────────────────────────────────
  companyLogoWrapper: {
    position: 'absolute',
    right: 17,
    bottom: 15,
    zIndex: 3,                // above background, same as Vue z-index: 3
  },
  companyLogo: {
    width: 80,
    height: 50,
    borderRadius: 4,
  },

  // ── Dot indicators ────────────────────────────────────────────────────────
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 20,                // elongated pill — same as Vue active dot
    backgroundColor: Colors.primary, // matches Vue: indicator-active-color="#FDB813"
  },
});

export default PolicyCardSlider;