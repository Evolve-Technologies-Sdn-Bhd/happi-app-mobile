/**
 * Travel Family Select Screen
 * Lists user's family members. "Add" button navigates back to TravelStep2 with addedFamily param.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../screens/purchase/shared/categoryConfig';
import { sharedStyles } from '../screens/purchase/shared/sharedStyles';
import { getFamilyMemberList, FamilyMember } from '../../../api/family';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelFamilySelect'>;

const TravelFamilySelectScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const params = route.params;
  const { categoryCode } = params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const currentFamilies: FamilyMember[] = (() => {
    try { return params.families ? JSON.parse(params.families) : []; } catch { return []; }
  })();

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const res = await getFamilyMemberList();
        const list: FamilyMember[] = (res as any)?.data ?? [];
        setMembers(list);
      } catch (e) {
        console.warn('Failed to load family members', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []));

  const handleSelect = (item: FamilyMember) => {
    navigation.navigate('TravelStep2', {
      ...params,
      families: params.families,
      addedFamily: JSON.stringify(item),
    });
  };

  const isAlreadyAdded = (id: string) => currentFamilies.some(f => f.id === id);

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.headerSection}>
        <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={sharedStyles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={config.backColor} />
                <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={sharedStyles.headerTextBlock}>
              <Text style={sharedStyles.headerTitle}>{config.title}</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          style={sharedStyles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Select Family Member</Text>

          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No family members found.</Text>
              <Text style={styles.emptySubText}>
                Add family members in Profile → Family & Assets → My Family.
              </Text>
            </View>
          ) : (
            members.map(item => {
              const added = isAlreadyAdded(item.id);
              return (
                <View key={item.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberRelation}>{item.relationship}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.selectBtn, added && styles.selectBtnAdded]}
                    onPress={() => !added && handleSelect(item)}
                    activeOpacity={added ? 1 : 0.8}
                    disabled={added}
                  >
                    <Text style={[styles.selectBtnText, added && styles.selectBtnTextAdded]}>
                      {added ? 'Added' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40 },

  pageTitle: {
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginBottom: 20,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  memberInfo: { flex: 1, marginRight: 12 },
  memberName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginBottom: 4,
  },
  memberRelation: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#808080',
  },
  selectBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  selectBtnAdded: {
    backgroundColor: '#E5E5E5',
  },
  selectBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectBtnTextAdded: { color: '#808080' },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#808080',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});

export { TravelFamilySelectScreen };
export default TravelFamilySelectScreen;
