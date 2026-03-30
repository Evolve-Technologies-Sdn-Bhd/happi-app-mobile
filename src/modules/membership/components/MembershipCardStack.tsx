/**
 * Membership Card Stack Component
 * Displays membership cards in a stacked 3D layout with drag gestures
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { getOssImg } from '../../../api';
import { Typography } from '../../../shared/constants/styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 330;
const CARD_HEIGHT = 190;
const CARD_SPACING = 50; // Distance between stacked cards

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

  // Keep a ref to always have fresh cards length inside PanResponder callbacks
  // (PanResponder is created once in useRef so its closure would be stale otherwise)
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

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
    
    // Reorder cards based on currentIndex
    for (let step = 0; step < total; step++) {
      const idx = (currentIndex + step) % total;
      const card = cards[idx];
      if (card) { // Safety check for undefined cards
        result.push(card);
      }
    }
    
    return result;
  }, [cards, currentIndex]);

  // Pan responder for drag gestures.
  // NOTE: do NOT use onStartShouldSetPanResponderCapture — that steals every
  // touch before children (TouchableOpacity) can receive it, breaking taps.
  // Instead only claim the responder once the user actually starts dragging.
  const panResponder = useRef(
    PanResponder.create({
      // Let children (TouchableOpacity) handle taps; only intercept on move
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      
      onPanResponderGrant: () => {
        isDragging.current = true;
        dragY.stopAnimation();
        dragY.setValue(0);
      },
      
      onPanResponderMove: (_, gestureState) => {
        // Direct 1:1 movement - no damping for instant response
        dragY.setValue(gestureState.dy);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const distance = gestureState.dy;
        const total = cardsRef.current?.length ?? 0;
        
        // Lower threshold for easier card changes
        const threshold = CARD_SPACING * 0.35;
        
        if (total > 1) {
          if (distance < -threshold || velocity < -0.4) {
            // Dragged up = previous card
            setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
          } else if (distance > threshold || velocity > 0.4) {
            // Dragged down = next card
            setCurrentIndex((prev) => (prev + 1) % total);
          }
        }
        
        // Use timing with easeOut for buttery smooth animation
        Animated.timing(dragY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
      
      onPanResponderTerminate: () => {
        Animated.timing(dragY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;

  const handleCardPress = (card: any, index: number) => {
    // Only navigate when tapping the front card and not in the middle of a drag
    if (isDragging.current) return;
    if (index === 0) {
      onCardPress(card);
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No memberships available</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardStack} {...panResponder.panHandlers}>
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

        // Rotation - front card tilts smoothly
        const rotateX = dragY.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: [
            index === 0 ? '20deg' : '0deg',
            '0deg',
            index === 0 ? '-20deg' : '0deg',
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
                  { perspective: 1000 },
                  { rotateX: rotateX },
                  { scale: animatedScale },
                ],
                opacity: animatedOpacity,
                zIndex: 10 - index,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.cardTouchable}
              onPress={() => handleCardPress(card, index)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={imageUrl ? { uri: imageUrl } : undefined}
                style={[styles.cardBackground, !imageUrl && styles.placeholderCard]}
                imageStyle={styles.cardBackgroundImage}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{displayName}</Text>
                  <View style={styles.memberIdSection}>
                    <Text style={styles.memberIdLabel}>Member ID</Text>
                    <Text style={styles.memberIdValue}>{displayMemberId}</Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cardStack: {
    width: CARD_WIDTH,
    height: 300,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },

  membershipCard: {
    position: 'absolute',
    top: 60,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },

  cardTouchable: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  cardBackground: {
    width: '100%',
    height: '100%',
  },

  cardBackgroundImage: {
    borderRadius: 16,
  },

  placeholderCard: {
    backgroundColor: '#6B46C1',
    borderRadius: 16,
  },

  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },

  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },

  memberIdSection: {
    marginTop: 'auto',
  },

  memberIdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  memberIdValue: {
    fontSize: 14,
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
