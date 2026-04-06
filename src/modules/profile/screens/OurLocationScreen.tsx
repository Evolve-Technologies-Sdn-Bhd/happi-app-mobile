/**
 * Our Location Screen
 * Matches happi-app-customer/src/views/profile/support/location.vue
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';

const imgLocation = require('../../../../assets/images/support/location-office-image.jpg');

const ADDRESS =
  'E-04-01, Block E, Komersial Southkey Mozek, Persiaran Southkey 1, Kota Southkey, 80150 Johor Bahru, Johor, Malaysia.';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'OurLocation'>;

export const OurLocationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const onCopyAddress = () => {
    Clipboard.setString(ADDRESS);
    Alert.alert('', 'Address copied!');
  };

  return (
    <View style={styles.page}>
      <Header title="Our Location" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.group}>
          {/* Office image */}
          <View style={styles.imageContainer}>
            <Image source={imgLocation} style={styles.locationImage} />
          </View>

          {/* Company name */}
          <Text style={styles.companyName}>HAPPISAFE AI SDN. BHD.</Text>

          {/* Info card */}
          <View style={styles.infoCard}>
            {/* Address row */}
            <TouchableOpacity style={styles.infoRow} onPress={onCopyAddress} activeOpacity={0.7}>
              <Text style={styles.dot}>･</Text>
              <Text style={styles.infoText}>{ADDRESS}</Text>
              {/* Copy icon */}
              <View style={styles.copyIconBox}>
                <View style={[styles.copyPage, styles.copyPageBack]} />
                <View style={[styles.copyPage, styles.copyPageFront]} />
              </View>
            </TouchableOpacity>

            {/* Hours */}
            <View style={styles.infoRowMt}>
              <View style={styles.timeRow}>
                <Text style={styles.dot}>･</Text>
                <Text style={styles.infoText}>Weekday : 9:00 am - 6:00 pm</Text>
              </View>
              <View style={[styles.timeRow, styles.mt4]}>
                <Text style={styles.dot}>･</Text>
                <Text style={styles.infoText}>Weekend : Closed</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  scroll: {
    paddingBottom: 50,
  },

  group: {
    marginTop: 40,
    paddingHorizontal: 24,
  },

  imageContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  locationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },

  companyName: {
    marginTop: 24,
    color: '#343434',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },

  infoCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  infoRowMt: {
    marginTop: 16,
  },

  dot: {
    fontSize: 14,
    color: '#343434',
    marginRight: 6,
    flexShrink: 0,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    color: '#343434',
    textAlign: 'justify',
    marginRight: 12,
  },

  copyIconBox: {
    position: 'relative',
    width: 18,
    height: 20,
    flexShrink: 0,
    marginTop: 2,
  },

  copyPage: {
    position: 'absolute',
    width: 12,
    height: 14,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  copyPageBack: {
    top: 0,
    right: 0,
  },

  copyPageFront: {
    bottom: 0,
    left: 0,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  mt4: {
    marginTop: 4,
  },
});
