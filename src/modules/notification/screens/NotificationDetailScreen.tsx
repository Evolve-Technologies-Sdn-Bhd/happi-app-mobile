/**
 * Notification Detail Screen
 * Ported from happi-app-customer/src/views/public/notification/detail.vue
 * Header + card layout matches MembershipDetailScreen
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../app/navigation/types';

type NotificationDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationDetail'>;
type NotificationDetailRouteProp = RouteProp<RootStackParamList, 'NotificationDetail'>;

interface IProps {
  navigation: NotificationDetailNavigationProp;
  route: NotificationDetailRouteProp;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_W = SCREEN_WIDTH - 48;
const CARD_H = Math.round(CARD_W * (220 / 382));

const imgGeneral = require('../../../../assets/images/notifications/Notification_General.png');
const imgCoin = require('../../../../assets/images/notifications/Notification_HAPPIcoin.png');
const imgMembership = require('../../../../assets/images/notifications/Notification_membership.png');
const imgHome = require('../../../../assets/images/notifications/Notification_Home.png');
const imgCyber = require('../../../../assets/images/notifications/Notification_Cyber.png');
const imgTravel = require('../../../../assets/images/notifications/Notification_Travel.png');
const imgRedemption = require('../../../../assets/images/notifications/Notification_Redemption.png');

const productKeywords: { keywords: string[]; image: ImageSourcePropType }[] = [
  { keywords: ['home, vehicle, travel'], image: imgGeneral },
  { keywords: ['cyber'], image: imgCyber },
  { keywords: ['home', 'house', 'property'], image: imgHome },
  { keywords: ['travel', 'trip', 'flight', 'overseas'], image: imgTravel },
];

function getNotificationImage(
  notificationType: string | undefined,
  title: string,
  description: string,
): ImageSourcePropType {
  const type = (notificationType || '').toLowerCase();
  if (type === 'happicoin') return imgCoin;
  if (type === 'membership') return imgMembership;
  if (type === 'voucher') return imgRedemption;
  if (type === 'product') {
    const text = `${title} ${description}`.toLowerCase();
    for (const entry of productKeywords) {
      if (entry.keywords.some((kw) => text.includes(kw))) {
        return entry.image;
      }
    }
    return imgGeneral;
  }
  return imgGeneral;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}

const NotificationDetailScreen: React.FC<IProps> = ({ navigation, route }) => {
  const { title, description, createTime, notificationType } = route.params;
  const notificationImage = getNotificationImage(notificationType, title, description);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── GROUP SECTION: header-bg image + back button, rounded bottom ── */}
      <View style={styles.groupSection}>
        <ImageBackground
          source={require('../../../../assets/products/header-bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── CARD: sibling of groupSection, overlaps rounded bottom ── */}
      <View style={styles.cardWrapper}>
        <View style={[styles.cardContainer, { width: CARD_W }]}>
          <Image
            source={notificationImage}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailWrapper}>
          <Text style={styles.detailTime}>{formatTime(createTime)}</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{title}</Text>
            <Text style={styles.detailDesc}>{description}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },

  // ── Group Section: rounded bottom, bg image behind navbar only ──
  groupSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingBottom: 175,
  },

  headerContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    padding: 4,
  },

  // ── Card: overlaps groupSection with negative marginTop ──
  cardWrapper: {
    marginTop: -120,
    marginHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    borderRadius: 20,
  },

  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },

  // ── Content scroll ──
  contentScroll: {
    flex: 1,
    marginTop: 24,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  detailWrapper: {
    alignItems: 'center',
    gap: 12,
  },

  detailTime: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },

  detailContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },

  detailTitle: {
    color: '#343434',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },

  detailDesc: {
    color: '#4A3F35',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default NotificationDetailScreen;
