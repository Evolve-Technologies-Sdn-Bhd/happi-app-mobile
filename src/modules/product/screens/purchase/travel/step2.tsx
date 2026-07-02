/**
 * Purchase Travel Step 2 — Travellers
 * Ported from happi-app-customer/src/views/purchase/travel/step_2.vue
 *
 * Shows user (Traveller 1 - Self) + added family members.
 * Family coverage: "Select Family Member" button → TravelFamilySelect.
 * T&C checkbox → Continue → TravelStep3 (quote loading)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import customerApi from '../../../../../api/customer';
import { FamilyMember } from '../../../../../api/family';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'TravelStep2'>;

interface UserTraveller {
  name: string;
  idNumber: string;
  passportNumber: string;
  foreignerState: number;
}

// ─── CollapsibleCard ──────────────────────────────────────────────────────────

const CollapsibleCard: React.FC<{
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onRemove?: () => void;
}> = ({ title, expanded, onToggle, children, onRemove }) => (
  <View style={cardStyles.card}>
    <TouchableOpacity style={cardStyles.header} onPress={onToggle} activeOpacity={0.8}>
      <Text style={cardStyles.headerText} numberOfLines={1}>{title}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primary} />
    </TouchableOpacity>
    {expanded && (
      <View style={cardStyles.body}>
        {children}
        {onRemove && (
          <TouchableOpacity style={cardStyles.removeBtn} onPress={onRemove} activeOpacity={0.8}>
            <Text style={cardStyles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginRight: 8,
  },
  body: { paddingHorizontal: 16, paddingBottom: 14 },
  removeBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  removeBtnText: { color: Colors.primary, fontSize: 13, fontFamily: FontFamily.regular },
});

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value || '—'}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.2)' },
  label: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular },
  value: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, textAlign: 'right', flex: 1, marginLeft: 16 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const TravelStep2: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const params = route.params;
  const {
    productId, categoryCode, companyId,
    tripType, coverageType, adultCount, childCount,
    country, zone, departDate, returnDate, addonChecked,
  } = params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const isFamily = coverageType === 2;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserTraveller | null>(null);
  const [families, setFamilies] = useState<FamilyMember[]>(() => {
    try { return params.families ? JSON.parse(params.families) : []; } catch { return []; }
  });
  const [tncChecked, setTncChecked] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await customerApi.getCustomerInfo();
        const info = (res as any)?.data ?? (res as any);
        if (info) {
          setUser({
            name: info.realname ?? '',
            idNumber: info.idNumber ?? '',
            passportNumber: info.passportNumber ?? '',
            foreignerState: info.foreignerState ?? 0,
          });
        }
      } catch (e) { console.warn('Failed to load user', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Receive added family member back from TravelFamilySelect
  useFocusEffect(useCallback(() => {
    const addedFamily = (route.params as any)?.addedFamily;
    if (addedFamily) {
      try {
        const member: FamilyMember = JSON.parse(addedFamily);
        setFamilies(prev => {
          if (prev.some(f => f.id === member.id)) return prev;
          return [...prev, member];
        });
      } catch {}
      navigation.setParams({ addedFamily: undefined } as any);
    }
  }, [route.params]));

  const handleRemoveFamily = (index: number) => {
    Alert.alert('', 'Remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setFamilies(prev => prev.filter((_, i) => i !== index)) },
    ]);
  };

  const handleContinue = () => {
    if (!tncChecked) {
      Alert.alert('', 'Please accept the terms and conditions to proceed.');
      return;
    }
    if (isFamily) {
      const isAdult = (birthday?: string) => {
        if (!birthday) return false;
        return dayjs().diff(dayjs(birthday), 'year') >= 18;
      };
      const minorCount = families.filter(f => !isAdult(f.birthday)).length;
      const adultFamilyCount = families.filter(f => isAdult(f.birthday)).length;
      if (minorCount < 1) {
        Alert.alert('', 'Family type requires at least one minor.');
        return;
      }
      if (adultFamilyCount + 1 > 2) {
        Alert.alert('', 'Family type supports up to two adults including yourself.');
        return;
      }
    }
    navigation.navigate('TravelStep3', {
      productId, categoryCode, companyId,
      tripType, coverageType, adultCount, childCount,
      country, zone, departDate, returnDate, addonChecked,
      families: JSON.stringify(families),
    });
  };

  const renderHeader = () => (
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
            {!!config.subTitle && <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  if (loading) {
    return (
      <View style={sharedStyles.container}>
        {renderHeader()}
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      {renderHeader()}
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User (Traveller 1 – Self) */}
        {user && (
          <CollapsibleCard
            title={`Traveller 1 - Self (${user.name})`}
            expanded={expandedIndex === -1}
            onToggle={() => setExpandedIndex(v => v === -1 ? null : -1)}
          >
            <InfoRow label="Name" value={user.name} />
            {user.foreignerState === 0
              ? <InfoRow label="NRIC Number" value={user.idNumber} />
              : <InfoRow label="Passport" value={user.passportNumber} />
            }
          </CollapsibleCard>
        )}

        {/* Family members */}
        {families.map((f, i) => (
          <CollapsibleCard
            key={f.id}
            title={`Traveller ${i + 2} - ${f.relationship || 'Family'} (${f.name})`}
            expanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(v => v === i ? null : i)}
            onRemove={() => handleRemoveFamily(i)}
          >
            <InfoRow label="Name" value={f.name} />
            {(f.foreignerState ?? 0) === 0
              ? <InfoRow label="NRIC Number" value={f.idNumber ?? ''} />
              : <InfoRow label="Passport" value={f.passportNumber ?? ''} />
            }
          </CollapsibleCard>
        ))}

        {/* Add family member button (Family coverage only) */}
        {isFamily && (
          <TouchableOpacity
            style={styles.addFamilyBtn}
            onPress={() => navigation.navigate('TravelFamilySelect', {
              productId, categoryCode, companyId,
              tripType, coverageType, adultCount, childCount,
              country, zone, departDate, returnDate, addonChecked,
              families: JSON.stringify(families),
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.addFamilyBtnText}>Select Family Member</Text>
          </TouchableOpacity>
        )}

        {/* T&C */}
        <TouchableOpacity style={styles.tncRow} onPress={() => setTncChecked(v => !v)} activeOpacity={0.8}>
          <View style={[styles.checkbox, tncChecked && styles.checkboxActive]}>
            {tncChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.tncText}>
            I have read and agree to the Terms and Conditions for insurance purchase.
          </Text>
        </TouchableOpacity>

        {/* Continue */}
        <TouchableOpacity style={sharedStyles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  addFamilyBtn: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 20,
  },
  addFamilyBtnText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  tncRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 28,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.primary },
  tncText: {
    flex: 1,
    fontSize: 13,
    color: '#808080',
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
});

export default TravelStep2;
