/**
 * Insurance Policy Card Component
 * Displays individual policy card with all details
 * Includes animations for smooth transitions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
  Animated,
} from 'react-native';
import { FontFamily } from '../../../shared/constants/fonts';
import { Policy } from '../../../api/policy';
import { getOssImg } from '../../../api/client';

interface PolicyCardProps {
  policy: Policy;
  onPress: () => void;
  index?: number;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onPress, index = 0 }) => {
  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Fade in animation on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100, // Stagger animation
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  // Press animation handlers
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Format year from insured start date
   */
  const formatYear = (): string => {
    if (policy.insuredStartDate) {
      return new Date(policy.insuredStartDate).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  /**
   * Format display name with line breaks for long names
   * Mirrors Vue's formatDisplayName logic exactly
   */
  const formatDisplayName = (name: string): string[] => {
    if (!name) return [''];
    const maxLength = 25;

    // If name is 25 characters or less, just return it in uppercase (no split)
    if (name.length <= maxLength) {
      return [name.toUpperCase()];
    }

    // If name exceeds 25 characters, check for split patterns
    const splitPatterns = [
      { pattern: /\s+bin\s+/i, label: 'BIN' },
      { pattern: /\s+binti\s+/i, label: 'BINTI' },
      { pattern: /\s+a\/l\s+/i, label: 'A/L' },
      { pattern: /\s+a\/p\s+/i, label: 'A/P' },
    ];

    for (const { pattern, label } of splitPatterns) {
      const match = name.match(pattern);
      if (match && match.index !== undefined) {
        const before = name.substring(0, match.index).trim();
        const after = name.substring(match.index + match[0].length).trim();
        return [
          `${before} ${label}`.toUpperCase(),
          after.toUpperCase(),
        ];
      }
    }

    // If no pattern found but still exceeds 25 characters, split at a good break point
    const midPoint = Math.floor(name.length / 2);
    let breakPoint = name.lastIndexOf(' ', midPoint);

    // If no space found near middle, just break at 25
    if (breakPoint === -1 || breakPoint < 10) {
      breakPoint = maxLength;
    }

    const line1 = name.substring(0, breakPoint).trim().toUpperCase();
    const line2 = name.substring(breakPoint).trim().toUpperCase();
    return [line1, line2];
  };

  const displayNameLines = formatDisplayName(policy.customer.realname);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>
          {/* Background Image */}
          <ImageBackground
            source={require('../../../../assets/products/card-bg.png')}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
            <View style={styles.cardContent}>
              {/* Product Name */}
              <Text style={styles.productName} numberOfLines={2}>
                {policy.product.name}
              </Text>

              {/* Year */}
              <Text style={styles.year}>{formatYear()}</Text>

              {/* Customer Name (with line breaks if needed) */}
              <View style={styles.customerNameContainer}>
                {displayNameLines.map((line, idx) => (
                  <Text key={idx} style={styles.customerName}>
                    {line}
                  </Text>
                ))}
              </View>

              {/* Policy Number */}
              <Text style={styles.policyLabel}>Policy No</Text>
              <Text style={styles.policyNumber}>
                {policy.policyNumber || '--'}
              </Text>

              {/* Company Logo */}
              <View style={styles.companyLogoContainer}>
                {policy.company.logoUrl ? (
                  <Image
                    source={{ uri: getOssImg(policy.company.logoUrl) }}
                    style={styles.companyLogo}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            </View>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 30,
  },
  card: {
    position: 'relative',
  },
  cardBackground: {
    width: '100%',
    height: 210,
    borderRadius: 30,
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    borderRadius: 30,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    paddingLeft: 24,
    paddingBottom: 24,
  },
  productName: {
    color: '#343434',
    fontFamily: FontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    maxWidth: 220,
    zIndex: 10,
  },
  year: {
    color: '#343434',
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 8,
    zIndex: 10,
  },
  customerNameContainer: {
    marginTop: 26,
    zIndex: 10,
  },
  customerName: {
    color: '#343434',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  policyLabel: {
    color: '#999999',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
    zIndex: 10,
  },
  policyNumber: {
    color: '#666666',
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '600',
    zIndex: 10,
  },
  companyLogoContainer: {
    position: 'absolute',
    right: 17,
    bottom: 15,
    zIndex: 10,
  },
  companyLogo: {
    width: 80,
    height: 50,
    borderRadius: 4,
  },
});
