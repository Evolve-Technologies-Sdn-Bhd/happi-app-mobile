/**
 * Membership Card Stack Component
 * Displays membership cards in a stacked 3D layout with drag gestures
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { getOssImg } from '../../../api';
import { Typography } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Match MembershipDetailScreen exactly: full width minus 24px each side, Vue ratio 382×220
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (220 / 382));
const CARD_SPACING = 50;

interface MembershipCardStackProps {
  cards: any[];
  displayName: string;
  displayMemberId: string;
  onCardPress: (card: any) => void;
}

export const MembershipCardStack: React.FC<MembershipCardStackProps> = ({
  cards,
  displayName,
  displayMemberId,
  onCardPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const cardsRef = useRef(cards);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  // Keep fresh index + callback refs for gestures (created once in useMemo)
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  const onCardPressRef = useRef(onCardPress);
  useEffect(() => { onCardPressRef.current = onCardPress; }, [onCardPress]);

  // Reset currentIndex if it's out of bounds when cards change
  useEffect(() => {
    if (cards && cards.length > 0 && currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards, currentIndex]);

  // Compute visible cards - simply reorder without modifying original objects
  const visibleCards = useMemo(() => {
    if (!cards || cards.length === 0) return [];
    const total = cards.length;
    const result = [];
    for (let step = 0; step < total; step++) {
      const idx = (currentIndex + step) % total;
      const card = cards[idx];
      if (card) result.push(card);
    }
    return result;
  }, [cards, currentIndex]);

  // Use RNGH Gesture.Pan — runs at native layer on Android, no JS responder conflicts.
  // activeOffsetY: pan only activates after 10px vertical movement, so
  // short taps (<10px) fall through to TouchableOpacity normally.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetY([-10, 10])
        .onBegin(() => {
          dragY.stopAnimation();
          dragY.setValue(0);
        })
        .onStart(() => {
          isDragging.current = true;
        })
        .onUpdate(({ translationY }) => {
          dragY.setValue(translationY);
        })
        .onEnd(({ translationY, velocityY }) => {
          const total = cardsRef.current?.length ?? 0;
          const threshold = CARD_SPACING * 0.35;
          if (total > 1) {
            if (translationY < -threshold || velocityY < -0.4) {
              setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
            } else if (translationY > threshold || velocityY > 0.4) {
              setCurrentIndex((prev) => (prev + 1) % total);
            }
          }
          Animated.timing(dragY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => { isDragging.current = false; });
        })
        .onFinalize(() => {
          Animated.timing(dragY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => { isDragging.current = false; });
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Tap gesture for front-card press — fires only if pan didn't activate (no 10px movement)
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          const frontCard = cardsRef.current?.[currentIndexRef.current];
          if (frontCard) onCardPressRef.current(frontCard);
        }),
    []
  );

  // Race: first gesture to activate wins. Pan wins on swipe (after 10px), tap wins on quick tap.
  const composed = useMemo(() => Gesture.Race(pan, tap), [pan, tap]);

  if (!cards || cards.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No memberships available</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.cardStack}>
      {visibleCards.map((card: any, index: number) => {
        // Safety check for undefined card
        if (!card) return null;
        
        // Base positions for each card in the stack
        const baseOffset = -index * CARD_SPACING;
        const baseScale = 1 - index * 0.05;
        const baseOpacity = Math.max(0.6, 1 - index * 0.1);
        
        // Get image URL - simple validation
        const imageUrl = card?.cardImgUrl ? getOssImg(card.cardImgUrl) : '';

        // CASCADING CARD MOVEMENT - Each card moves at different speed
        // Card 0: 100%, Card 1: 65%, Card 2: 35%, Card 3+: 15%
        const dragMultiplier = Math.max(0.15, 1 - index * 0.35);
        
        // Smooth cascading movement with optimized range
        const animatedOffset = dragY.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: [
            baseOffset - (CARD_SPACING * dragMultiplier),
            baseOffset,
            baseOffset + (CARD_SPACING * dragMultiplier),
          ],
          extrapolate: 'clamp',
        });

        // Scale - next card grows as it comes forward
        const animatedScale = dragY.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: [
            index === 1 ? Math.min(1, baseScale + 0.05) : baseScale,
            baseScale,
            index === 1 ? Math.min(1, baseScale + 0.05) : baseScale,
          ],
          extrapolate: 'clamp',
        });

        // Opacity - next card becomes visible
        const animatedOpacity = dragY.interpolate({
          inputRange: [-80, 0, 80],
          outputRange: [
            index === 1 ? Math.min(1, baseOpacity + 0.4) : baseOpacity,
            baseOpacity,
            index === 1 ? Math.min(1, baseOpacity + 0.4) : baseOpacity,
          ],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={card?.id || card?.membershipId || card?.memberId || `card-${index}`}
            style={[
              styles.membershipCard,
              {
                transform: [
                  { translateY: animatedOffset },
                  { scale: animatedScale },
                ],
                opacity: animatedOpacity,
                zIndex: 10 - index,
              },
            ]}
          >
            <View style={styles.cardTouchable}>
              <View style={[styles.cardContainer, !imageUrl && styles.cardPlaceholder]}>
                {!!imageUrl && (
                  <Image
                    source={{ uri: imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    pointerEvents="none"
                  />
                )}
                <Text
                  style={[
                    styles.cardName,
                    {
                      top: Math.round(CARD_HEIGHT * (80 / 220)),
                      left: Math.round(CARD_WIDTH * (28 / 382)),
                    },
                  ]}
                >
                  {displayName}
                </Text>
                <View
                  style={[
                    styles.memberIdWrapper,
                    {
                      bottom: Math.round(CARD_HEIGHT * (30 / 220)),
                      left: Math.round(CARD_WIDTH * (28 / 382)),
                    },
                  ]}
                >
                  <Text style={styles.memberIdLabel}>Member ID</Text>
                  <Text style={styles.memberIdValue}>{displayMemberId}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
      })}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + CARD_SPACING * 2 + 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: CARD_SPACING,
  },

  membershipCard: {
    position: 'absolute',
    top: CARD_SPACING,
  },

  cardTouchable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },

  cardPlaceholder: {
    backgroundColor: '#333355',
  },

  cardName: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },

  memberIdWrapper: {
    position: 'absolute',
    flexDirection: 'column',
    gap: 2,
  },

  memberIdLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.5,
  },

  memberIdValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 16,
    color: '#808080',
  },
});
