/**
 * Family & Assets Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/index.vue
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';

const imgPerson  = require('../../../../assets/images/profile/family-person-icon.png');
const imgVehicle = require('../../../../assets/images/profile/family-vehicle-icon.png');
const imgHome    = require('../../../../assets/images/profile/family-home-icon.png');

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const FamilyAssetsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title="My Family & Assets" showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>

          {/* ── My Family – full-width card ── */}
          <TouchableOpacity
            style={styles.familyCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FamilyList')}
          >
            <View style={styles.familyLeft}>
              <Text style={styles.cardTitle}>My Family</Text>
              <View style={styles.selectBtn}>
                <Text style={styles.selectBtnText}>Select</Text>
              </View>
            </View>

            {/* Stacked person images — exact images from Vue */}
            <View style={styles.familyIcons}>
              <Image source={imgPerson} style={[styles.personImg, styles.personImg3]} />
              <Image source={imgPerson} style={[styles.personImg, styles.personImg2]} />
              <Image source={imgPerson} style={[styles.personImg, styles.personImg1]} />
            </View>
          </TouchableOpacity>

          {/* ── My Vehicle + My Housing – side-by-side cards ── */}
          <View style={styles.bottomRow}>

            {/* My Vehicle */}
            <TouchableOpacity
              style={styles.assetCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VehicleList')}
            >
              <Text style={styles.cardTitle}>My Vehicle</Text>
              <Image source={imgVehicle} style={styles.assetIcon} />
              <View style={styles.selectBtn}>
                <Text style={styles.selectBtnText}>Select</Text>
              </View>
            </TouchableOpacity>

            {/* My Housing */}
            <TouchableOpacity
              style={styles.assetCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('HomeAssetList')}
            >
              <Text style={styles.cardTitle}>My Housing</Text>
              <Image source={imgHome} style={styles.assetIcon} />
              <View style={styles.selectBtn}>
                <Text style={styles.selectBtnText}>Select</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  group: {
    paddingHorizontal: 44,
    paddingTop: 28,
    gap: 20,
  },

  // ── My Family card ──────────────────────────────────────────────────────────
  familyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  familyLeft: {
    alignItems: 'flex-start',
    gap: 18,
  },

  // Stacked person images from Vue
  familyIcons: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 80,
    height: 42,
    position: 'relative',
  },

  personImg: {
    width: 32,
    height: 42,
    resizeMode: 'contain',
    position: 'absolute',
  },

  personImg1: { left: 0, zIndex: 3 },
  personImg2: { left: 27, zIndex: 2, top: 20 },
  personImg3: { left: 54, zIndex: 1 },

  // ── Bottom row cards ────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    gap: 28,
  },

  assetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 12,
    height: 202,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  assetIcon: {
    width: 91.5,
    height: 51.5,
    resizeMode: 'contain',
    marginTop: 14,
  },

  // ── Shared ──────────────────────────────────────────────────────────────────
  cardTitle: {
    fontSize: 21,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#FDB813',
    lineHeight: 24,
    alignSelf: 'center',
  },

  selectBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 14,
  },

  selectBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 14,
  },
});
