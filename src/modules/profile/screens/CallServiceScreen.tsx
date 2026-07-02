/**
 * Call Service Screen
 * Matches happi-app-customer/src/views/profile/support/phone.vue
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Linking,
  Platform,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import { FontFamily } from '../../../shared/constants/fonts';

const imgPhoneIcon = require('../../../../assets/images/support/call-phone-icon.png');
const imgInfoBg    = require('../../../../assets/images/support/call-info-bg.png');
const imgButtonBg  = require('../../../../assets/images/support/call-button-bg.png');

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'CallService'>;

const PHONE_NUMBER = '+60126502766';

export const CallServiceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const onMakeCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  return (
    <View style={styles.page}>
      <Header title="Call service" showBack />

      <View style={styles.group}>
        {/* Phone icon */}
        <View style={styles.imageWrapper}>
          <Image source={imgPhoneIcon} style={styles.image4} />
        </View>

        <View style={styles.mt33}>
          {/* Phone number */}
          <Text style={styles.text3}>{PHONE_NUMBER}</Text>

          {/* Info card with background image */}
          <ImageBackground source={imgInfoBg} style={styles.section2} resizeMode="stretch">
            <Text style={[styles.font, styles.text4]}>･ Available Mon-Fri, 9AM-6PM</Text>
            <View style={styles.mt14}>
              <Text style={styles.font}>･ For urgent matters, claims &</Text>
              <Text style={[styles.font, styles.mt3]}>account help</Text>
            </View>
            <View style={styles.mt14}>
              <Text style={styles.font}>･ Standard mobile call charges</Text>
              <Text style={[styles.font, styles.mt3]}>may apply</Text>
            </View>
          </ImageBackground>

          {/* Call Now button with background image */}
          <TouchableOpacity onPress={onMakeCall} activeOpacity={0.85}>
            <ImageBackground source={imgButtonBg} style={styles.textWrapper} resizeMode="stretch">
              <Text style={styles.text5}>Call Now</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingBottom: 50,
    backgroundColor: '#fdfdfd',
  },

  group: {
    marginTop: 100,
    paddingHorizontal: 80,
    alignItems: 'center',
  },

  imageWrapper: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: '#fff1d0',
    borderRadius: 50,
    width: 77,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  image4: {
    width: 43,
    height: 44,
    resizeMode: 'contain',
  },

  mt33: {
    marginTop: 33,
    width: '100%',
    alignItems: 'center',
  },

  text3: {
    color: '#343434',
    fontSize: 25,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 32,
  },

  section2: {
    marginTop: 18,
    paddingTop: 24,
    paddingBottom: 16,
    paddingLeft: 18,
    paddingRight: 14,
    width: '100%',
  },

  font: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    lineHeight: 20,
  },

  text4: {
    lineHeight: 18,
  },

  mt14: {
    marginTop: 14,
  },

  mt3: {
    marginTop: 3,
  },

  textWrapper: {
    marginTop: 24,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  text5: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    lineHeight: 20,
  },
});
