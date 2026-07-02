/**
 * Service Detail Screen
 * Ported from happi-app-customer/src/views/service/detail.vue
 * Shows detailed information about a service provider
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { Image } from 'expo-image';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ServiceStackParamList } from '../../../app/navigation/types';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { getOssImg, getServiceDetail, recordServiceUsage } from '../../../api';
import { Header } from '../../../shared/components';

// Import service icons as SVG components
import CallIcon from '../../../../assets/svg/call_service.svg';
import EmailIcon from '../../../../assets/svg/email_service.svg';
import UrlIcon from '../../../../assets/svg/url_service.svg';
import LocationIcon from '../../../../assets/svg/location_service.svg';

type ServiceDetailRouteProp = RouteProp<ServiceStackParamList, 'ServiceDetail'>;

interface ServiceDetail {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  provider?: {
    id?: string;
    companyLogo?: string;
    website?: string;
    address?: string;
    email?: string;
    mobileNumber?: string;
  };
  providerId?: string;
  website?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

export const ServiceDetailScreen: React.FC = () => {
  const route = useRoute<ServiceDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { serviceId } = route.params;

  // State
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [imageError, setImageError] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const animatedHeights = useRef<{[key: number]: Animated.Value}>({}).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const faqRefs = useRef<{[key: number]: View | null}>({}).current;

  useEffect(() => {
    fetchServiceDetail();
  }, [serviceId]);

  const fetchServiceDetail = async () => {
    try {
      setLoading(true);
      const response = await getServiceDetail(serviceId);
      if (response.success && response.data) {
        setServiceDetail(response.data as any);
      } else {
        Alert.alert('Error', response.msg || 'Failed to load service details');
      }
    } catch (error) {
      console.error('Failed to load service detail:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNow = async () => {
    if (!serviceDetail) return;

    const phoneNumber =
      serviceDetail.provider?.mobileNumber || serviceDetail.phoneNumber;

    if (!phoneNumber || phoneNumber === 'Not available') {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    // Track service usage before opening WhatsApp
    try {
      await recordServiceUsage({
        serviceId: serviceId,
        actionType: 'CALL_NOW',
        providerId: serviceDetail.provider?.id || serviceDetail.providerId,
        categoryId: serviceDetail.categoryId,
      });
      console.log('Service usage recorded successfully');
    } catch (error) {
      console.error('Failed to record service usage:', error);
    }

    // Open WhatsApp
    const cleanNumber = phoneNumber.replace(/[\s\-]/g, '');
    const url = `https://wa.me/${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open WhatsApp');
      }
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleOpenWebsite = async () => {
    if (!serviceDetail) return;

    const website = serviceDetail.provider?.website || serviceDetail.website;

    if (!website || website === 'Not available') {
      Alert.alert('Error', 'Website not available');
      return;
    }

    // Ensure URL has protocol
    let url = website;
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open website');
      }
    } catch (error) {
      console.error('Failed to open website:', error);
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const displayWebsite = (): string => {
    if (!serviceDetail) return '';
    const website = serviceDetail.provider?.website || serviceDetail.website;
    if (!website || website === 'Not available') {
      return 'Not available';
    }
    // Remove https://, http://, and www. from the display
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '');
  };

  const toggleFaq = (index: number) => {
    const isExpanding = expandedFaq !== index;
    
    if (!animatedHeights[index]) {
      animatedHeights[index] = new Animated.Value(0);
    }
    
    // Start expansion animation
    Animated.timing(animatedHeights[index], {
      toValue: isExpanding ? 1 : 0,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
    
    // Scroll simultaneously with expansion
    if (isExpanding && faqRefs[index] && scrollViewRef.current) {
      setTimeout(() => {
        faqRefs[index]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 80),
              animated: true,
            });
          },
          () => {}
        );
      }, 50);
    }
    
    setExpandedFaq(isExpanding ? index : null);
  };

  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&reg;/g, '\u00ae')
      .replace(/&trade;/g, '\u2122')
      .replace(/&copy;/g, '\u00a9')
      .replace(/&ndash;/g, '\u2013')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ldquo;/g, '\u201c')
      .replace(/&rdquo;/g, '\u201d')
      .replace(/&hellip;/g, '\u2026')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .trim();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Service Details" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!serviceDetail) {
    return (
      <View style={styles.container}>
        <Header title="Service Details" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Service not found</Text>
        </View>
      </View>
    );
  }

  const website = serviceDetail.provider?.website || serviceDetail.website;
  const address = serviceDetail.provider?.address || serviceDetail.address;
  const email = serviceDetail.provider?.email || serviceDetail.email;
  const phoneNumber = serviceDetail.provider?.mobileNumber || serviceDetail.phoneNumber;

  return (
    <View style={styles.container}>
      <Header
        title={serviceDetail.name || 'Service Details'}
        showBack
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Image */}
        <View style={styles.imageContainer}>
          {!imageError && serviceDetail.provider?.companyLogo ? (
            <Image
              source={{ uri: getOssImg(serviceDetail.provider.companyLogo) }}
              style={styles.serviceImage}
              onError={() => setImageError(true)}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#ccc" />
            </View>
          )}
        </View>

        {/* Service Information */}
        <View style={styles.infoContainer}>
          {/* Website */}
          {website && website !== 'Not available' && website.trim() !== '' && (
            <TouchableOpacity
              style={styles.infoItem}
              onPress={handleOpenWebsite}
            >
              <UrlIcon width={24} height={24} />
              <Text style={[styles.infoValue, styles.clickable]}>
                {displayWebsite()}
              </Text>
            </TouchableOpacity>
          )}

          {/* Address */}
          {address && address !== 'Not available' && address.trim() !== '' && (
            <View style={styles.infoItem}>
              <LocationIcon width={24} height={24} />
              <Text style={styles.infoValue}>{address}</Text>
            </View>
          )}

          {/* Email */}
          {email && email !== 'Not available' && email.trim() !== '' && (
            <View style={styles.infoItem}>
              <EmailIcon width={24} height={24} />
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          )}

          {/* Phone */}
          {phoneNumber && phoneNumber !== 'Not available' && phoneNumber.trim() !== '' && (
            <View style={styles.infoItem}>
              <CallIcon width={24} height={24} />
              <Text style={styles.infoValue}>{phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* FAQs Section */}
        {serviceDetail.faqs && serviceDetail.faqs.length > 0 && (
          <View style={styles.faqsSection}>
            {serviceDetail.faqs.map((faq, index) => {
              if (!animatedHeights[index]) {
                animatedHeights[index] = new Animated.Value(0);
              }
              
              const maxHeight = animatedHeights[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000],
              });
              
              const opacity = animatedHeights[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });
              
              return (
                <View 
                  key={index} 
                  style={styles.faqCard}
                  ref={(ref) => { faqRefs[index] = ref; }}
                >
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <Animated.View 
                    style={[
                      styles.faqContent,
                      {
                        maxHeight: maxHeight,
                        opacity: opacity,
                        overflow: 'hidden',
                      }
                    ]}
                  >
                    <Text style={styles.faqAnswer}>
                      {stripHtml(faq.answer)}
                    </Text>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Call Now Button */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallNow}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Typography.size.md,
    color: '#999',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  serviceImage: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.lg,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
  },
  infoContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  infoValue: {
    flex: 1,
    fontSize: Typography.size.md,
    fontWeight: '600',
    color: Colors.textDark,
    lineHeight: 22,
  },
  clickable: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  faqsSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  faqCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.primary,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.size.md,
    fontWeight: '600',
    color: Colors.textDark,
    marginRight: Spacing.sm,
  },
  faqContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  faqAnswer: {
    fontSize: Typography.size.md,
    fontWeight: '500' as any,
    color: Colors.textDark,
    lineHeight: 22,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  callButton: {
    width: '80%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.background,
    lineHeight: 15,
  },
});
