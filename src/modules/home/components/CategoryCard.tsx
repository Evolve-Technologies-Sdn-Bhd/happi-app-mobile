/**
 * Category Card Component
 * Swipeable category icons matching the Vue version
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../app/navigation/types';
import { useUserStore } from '../../../store';

// Import SVG icons as components
import CyberIcon from '../../../../assets/images/categoryicon/Homepage_Cyber.svg';
import CyberUnlockedIcon from '../../../../assets/images/categoryicon/Homepage_Cyber unclock new.svg';
import HomeIcon from '../../../../assets/images/categoryicon/Homepage_Home.svg';
import HomeUnlockedIcon from '../../../../assets/images/categoryicon/Homepage_Home unclock new.svg';
import TravelIcon from '../../../../assets/images/categoryicon/Homepage_Travel.svg';
import TravelUnlockedIcon from '../../../../assets/images/categoryicon/Homepage_Travel unloock new.svg';
import AutoIcon from '../../../../assets/images/categoryicon/Homepage_Auto.svg';
import AutoUnlockedIcon from '../../../../assets/images/categoryicon/Homepage_Auto unlock new.svg';
import CriticalIllnessIcon from '../../../../assets/images/categoryicon/Critical Illeness homepage.svg';
import CriticalIllnessUnlockedIcon from '../../../../assets/images/categoryicon/Critical Illeness homepage unlock new.svg';
import ComingSoonIcon from '../../../../assets/images/categoryicon/Coming_Soon.svg';

const CARD_WIDTH = 248;

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeIndex'>;

interface CategoryItem {
  code: string;
  Icon: React.FC<any>;
  IconUnlocked: React.FC<any>;
  comingSoon?: boolean;
  size?: number;
}

const categories: CategoryItem[][] = [
  // Page 1
  [
    {
      code: 'HAPPI_CYBER',
      Icon: CyberIcon,
      IconUnlocked: CyberUnlockedIcon,
    },
    {
      code: 'HAPPI_HOME',
      Icon: HomeIcon,
      IconUnlocked: HomeUnlockedIcon,
    },
    {
      code: 'HAPPI_TRAVEL',
      Icon: TravelIcon,
      IconUnlocked: TravelUnlockedIcon,
      comingSoon: true,
    },
    {
      code: 'HAPPI_AUTO',
      Icon: AutoIcon,
      IconUnlocked: AutoUnlockedIcon,
      comingSoon: true,
    },
  ],
  // Page 2
  [
    {
      code: 'HAPPI_CI',
      Icon: CriticalIllnessIcon,
      IconUnlocked: CriticalIllnessUnlockedIcon,
      comingSoon: true,
      size: 33,
    },
    {
      code: 'COMING_SOON',
      Icon: ComingSoonIcon,
      IconUnlocked: ComingSoonIcon,
      comingSoon: true,
      size: 33,
    },
    {
      code: 'COMING_SOON_2',
      Icon: ComingSoonIcon,
      IconUnlocked: ComingSoonIcon,
      comingSoon: true,
      size: 33,
    },
    {
      code: 'COMING_SOON_3',
      Icon: ComingSoonIcon,
      IconUnlocked: ComingSoonIcon,
      comingSoon: true,
      size: 33,
    },
  ],
];

interface CategoryCardProps {
  onComingSoon?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ onComingSoon }) => {
  const navigation = useNavigation<NavigationProp>();
  const token = useUserStore((state) => state.token);
  const [currentPage, setCurrentPage] = useState(0);
  const [purchasedCategories, setPurchasedCategories] = useState<Set<string>>(new Set());

  const handleCategoryPress = (category: CategoryItem) => {
    if (category.comingSoon) {
      if (onComingSoon) {
        onComingSoon();
      } else {
        Alert.alert('Coming Soon', 'This feature is coming soon!');
      }
      return;
    }

    // Navigate based on category code
    switch (category.code) {
      case 'HAPPI_CYBER':
        navigation.navigate('ProductList', { category: 'HAPPI_CYBER' });
        break;
      case 'HAPPI_HOME':
        navigation.navigate('ProductList', { category: 'HAPPI_HOME' });
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is coming soon!');
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentPage(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderPage = ({ item }: { item: CategoryItem[] }) => (
    <View style={styles.pageContainer}>
      {item.map((category, index) => {
        const isPurchased = purchasedCategories.has(category.code);
        const IconComponent = isPurchased ? category.IconUnlocked : category.Icon;
        const iconSize = category.size || 44;
        
        return (
          <TouchableOpacity
            key={`${category.code}-${index}`}
            style={styles.categoryIcon}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
          >
            <IconComponent width={iconSize} height={iconSize} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderPage}
        keyExtractor={(item, index) => `page-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      />
      
      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {categories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    overflow: 'hidden',
    width: CARD_WIDTH,
    height: 70,
    position: 'relative',
  },
  
  pageContainer: {
    width: CARD_WIDTH,
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  
  categoryIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  pagination: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  
  dotInactive: {
    backgroundColor: 'rgba(253, 184, 19, 0.3)',
  },
  
  dotActive: {
    backgroundColor: '#FDB813',
  },
});
