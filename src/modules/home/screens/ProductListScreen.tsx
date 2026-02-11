/**
 * Product List Screen
 * Browse and filter products
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList } from '../../../app/navigation/types';
import { Header, Card, Loading } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductList'>;
type RouteProps = RouteProp<HomeStackParamList, 'ProductList'>;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
}

// Mock data - replace with API
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Personal Accident Protection',
    description: 'Comprehensive personal accident coverage',
    price: 99,
    category: 'personal',
    icon: 'person-outline',
  },
  {
    id: '2',
    name: 'Vehicle Protection',
    description: 'Coverage for your vehicles',
    price: 199,
    category: 'vehicle',
    icon: 'car-outline',
  },
  {
    id: '3',
    name: 'Home Protection',
    description: 'Protect your home and belongings',
    price: 149,
    category: 'home',
    icon: 'home-outline',
  },
  {
    id: '4',
    name: 'Travel Protection',
    description: 'Travel worry-free',
    price: 79,
    category: 'travel',
    icon: 'airplane-outline',
  },
  {
    id: '5',
    name: 'Family Protection',
    description: 'Coverage for the whole family',
    price: 299,
    category: 'family',
    icon: 'people-outline',
  },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'home', label: 'Home' },
  { id: 'travel', label: 'Travel' },
  { id: 'family', label: 'Family' },
];

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.productContent}>
        <View style={styles.productIcon}>
          <Ionicons name={item.icon as any} size={28} color={Colors.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDesc}>{item.description}</Text>
          <Text style={styles.productPrice}>
            From RM {item.price}/year
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title={t('product.list')} showBack />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product List */}
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGrey,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  categoryContainer: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.sm,
  },

  categoryList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },

  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundGrey,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  categoryChipText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },

  categoryChipTextActive: {
    color: Colors.textWhite,
  },

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  productCard: {
    marginBottom: Spacing.sm,
  },

  productContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },

  productDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  productPrice: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },

  emptyText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.textLight,
  },
});
