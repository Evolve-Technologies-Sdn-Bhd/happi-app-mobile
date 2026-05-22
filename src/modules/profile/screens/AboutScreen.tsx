/**
 * About Screen
 * App information and credits
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Header, Card } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';

export const AboutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const links = [
    { icon: 'globe-outline', label: 'Website', url: 'https://happisafe.com' },
    { icon: 'logo-facebook', label: 'Facebook', url: 'https://facebook.com/happisafe' },
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/happisafe' },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('profile.about')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo & Info */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>HappiSafe</Text>
          <Text style={styles.appTagline}>{t('about.tagline')}</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* About Text */}
        <Card style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>{t('about.aboutUs')}</Text>
          <Text style={styles.aboutText}>{t('about.description')}</Text>
        </Card>

        {/* Social Links */}
        <Card style={styles.linksCard}>
          <Text style={styles.linksTitle}>{t('about.connectWithUs')}</Text>
          {links.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkItem}
              onPress={() => openLink(link.url)}
            >
              <View style={styles.linkIcon}>
                <Ionicons name={link.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="open-outline" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Legal Links */}
        <Card style={styles.legalCard}>
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>{t('profile.privacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>{t('profile.termsOfService')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2024 HappiSafe. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  scrollContent: {
    padding: Spacing.base,
  },

  logoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },

  appName: {
    fontSize: Typography.size.xxl,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },

  appTagline: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  appVersion: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },

  aboutCard: {
    marginBottom: Spacing.base,
  },

  aboutTitle: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  aboutText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  linksCard: {
    marginBottom: Spacing.base,
  },

  linksTitle: {
    fontSize: Typography.size.base,
    fontFamily: FontFamily.medium, fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },

  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  linkLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },

  legalCard: {
    marginBottom: Spacing.base,
    padding: 0,
  },

  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },

  legalText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  copyright: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
});
