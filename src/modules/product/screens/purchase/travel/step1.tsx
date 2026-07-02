/**
 * Purchase Step 1 — Travel Insurance
 * Ported from happi-app-customer/src/views/purchase/travel/step_1.vue
 *
 * Layout (matches Vue):
 *   Search bar (top) → Trip Type → Coverage Type → Family counter →
 *   Destination & Date section → Add Ons → Declaration → Continue
 *
 * Logic:
 *   - Annual blocks Malaysia destination
 *   - Individual resets adult=1, child=0
 *   - optionalCovers: Single→Cruise, Annual→AnnualDomestic
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
import { TextInput } from '../../../../../shared/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Toast } from '../../../../../shared/components';
import { useToast } from '../../../../../shared/hooks/useToast';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import RadioCard from '../shared/RadioCard';
import RadioButton from '../shared/RadioButton';
import SimpleCalendarModal from '../shared/SimpleCalendarModal';
import ZONE_DATA from '../../../../../utils/chubb_zone.json';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep1'>;

// ─── Zone helpers ─────────────────────────────────────────────────────────────

const zone1Countries: string[] =
  (ZONE_DATA as any[]).find((z: any) => z.code === 'zone1')?.countries ?? [];
const zone2Countries: string[] =
  (ZONE_DATA as any[]).find((z: any) => z.code === 'zone2')?.countries ?? [];
const ALL_COUNTRIES: string[] = ['MALAYSIA', ...zone1Countries, ...zone2Countries];

function getZoneForCountry(country: string): string {
  if (country === 'MALAYSIA') return 'DDOM';
  if (zone1Countries.includes(country)) return 'DZ1';
  return 'DZ2';
}

function formatCountryDisplay(country: string): string {
  if (!country) return '';
  return country
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

const ANNUAL_ZONES = [
  { label: 'Domestic', value: 'DDOM' },
  { label: 'Zone 1', value: 'DZ1' },
  { label: 'Zone 2', value: 'DZ2' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const TravelStep1: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [tripType, setTripType] = useState(1);
  const [coverageType, setCoverageType] = useState(1);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [country, setCountry] = useState('');
  const [zone, setZone] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [departDate, setDepartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [addonChecked, setAddonChecked] = useState(false);
  const [malaysianChecked, setMalaysianChecked] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'depart' | 'return'>('depart');
  const familyOpacity = useRef(new Animated.Value(0)).current;

  const isAnnual = tripType === 2;
  const { toast, showToast, hideToast } = useToast();

  // Show all countries when keyword empty (Annual → zone options; Single → all countries)
  const filteredCountries = useMemo(() => {
    const kw = searchKeyword.toLowerCase().trim();
    if (isAnnual) {
      const zoneLabels = ANNUAL_ZONES.map(z => z.label);
      if (!kw) return zoneLabels;
      return zoneLabels.filter(l => l.toLowerCase().includes(kw));
    }
    if (!kw) return [];
    return ALL_COUNTRIES.filter(c => c.toLowerCase().includes(kw)).slice(0, 12);
  }, [searchKeyword, isAnnual]);

  const autoReturnDate = departDate ? dayjs(departDate).add(364, 'day').toDate() : null;

  const destinationDisplay = useMemo(() => {
    if (!country && !zone) return '';
    if (isAnnual) {
      const found = ANNUAL_ZONES.find(z => z.value === zone);
      return found ? found.label : zone;
    }
    if (country === 'MALAYSIA') return 'Malaysia (Domestic)';
    const zoneName = zone === 'DZ1' ? 'Zone 1' : 'Zone 2';
    return country ? `${formatCountryDisplay(country)}  ·  ${zoneName}` : '';
  }, [country, zone, isAnnual]);

  const dateDisplay = useMemo(() => {
    const d = departDate ? dayjs(departDate).format('DD MMM YYYY') : '—';
    const r = isAnnual && autoReturnDate
      ? dayjs(autoReturnDate).format('DD MMM YYYY')
      : (returnDate ? dayjs(returnDate).format('DD MMM YYYY') : '—');
    return `${d}  –  ${r}`;
  }, [departDate, returnDate, isAnnual, autoReturnDate]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const resetDestination = () => {
    setCountry('');
    setZone('');
    setSearchKeyword('');
    setShowSuggest(false);
  };

  const handleTripTypeChange = (v: number) => {
    setTripType(v);
    resetDestination();
    setDepartDate(null);
    setReturnDate(null);
    setAddonChecked(false);
    // Annual + Malaysia is blocked — clear if needed when switching to annual
    if (v === 2 && country.toUpperCase() === 'MALAYSIA') {
      resetDestination();
      showToast('Annual Multi Trip is not available for destinations in Malaysia.', 'warning');
    }
  };

  const handleCoverageTypeChange = (v: number) => {
    setCoverageType(v);
    if (v === 1) {
      // Individual — reset family counters
      setAdultCount(1);
      setChildCount(0);
    }
    // Animate family section in/out
    Animated.timing(familyOpacity, {
      toValue: v === 2 ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handlePickCountry = (c: string) => {
    if (isAnnual) {
      // In annual mode, suggest panel shows zone labels
      const found = ANNUAL_ZONES.find(z => z.label === c);
      if (found) {
        setZone(found.value);
        setCountry(found.label);
        setSearchKeyword(found.label);
      }
    } else {
      if (c.toUpperCase() === 'MALAYSIA' && isAnnual) {
        showToast('Annual Multi Trip is not available for destinations in Malaysia.', 'warning');
        return;
      }
      const z = getZoneForCountry(c);
      setCountry(c);
      setZone(z);
      setSearchKeyword(formatCountryDisplay(c));
    }
    setShowSuggest(false);
  };

  const handleCalendarSelect = (date: Date) => {
    if (calendarMode === 'depart') {
      setDepartDate(date);
      setReturnDate(null);
      if (!isAnnual) {
        setCalendarMode('return');
      } else {
        setShowCalendar(false);
      }
    } else {
      setReturnDate(date);
      setShowCalendar(false);
    }
  };

  const handleContinue = () => {
    if (isAnnual && !zone) {
      showToast('Please choose your destination.', 'warning');
      return;
    }
    if (!isAnnual && (!country || !zone)) {
      showToast('Please choose your destination.', 'warning');
      return;
    }
    if (isAnnual && country.toUpperCase() === 'MALAYSIA') {
      showToast('Annual Multi Trip is not available for destinations in Malaysia.', 'warning');
      return;
    }
    if (!departDate) {
      showToast('Please select a departure date.', 'warning');
      return;
    }
    if (!isAnnual && !returnDate) {
      showToast('Please select a return date.', 'warning');
      return;
    }
    if (!malaysianChecked) {
      showToast('Please accept the declaration to continue.', 'warning');
      return;
    }
    // Build optionalCovers code: Single→Cruise, Annual→AnnualDomestic
    const optionalCovers = addonChecked
      ? [{ Code: isAnnual ? 'AnnualDomestic' : 'Cruise' }]
      : [];
    navigation.navigate('TravelStep2', {
      productId,
      categoryCode,
      companyId,
      tripType,
      coverageType,
      adultCount: coverageType === 1 ? 1 : adultCount,
      childCount: coverageType === 1 ? 0 : childCount,
      country,
      zone,
      departDate: departDate!.toISOString(),
      returnDate: isAnnual
        ? dayjs(departDate).add(364, 'day').toDate().toISOString()
        : (returnDate ? returnDate.toISOString() : ''),
      addonChecked,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={sharedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={sharedStyles.headerSection}>
        <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
          <SafeAreaView edges={['top']}>
            <View style={sharedStyles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={sharedStyles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={config.backColor} />
                <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={sharedStyles.headerTextBlock}>
              <Text style={sharedStyles.headerTitle}>{config.title}</Text>
              {!!config.subTitle && (
                <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Search bar (top, matches Vue) ── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={searchKeyword}
              onChangeText={t => {
                setSearchKeyword(t);
                if (!isAnnual) { setCountry(''); setZone(''); }
                setShowSuggest(true);
              }}
              placeholder="Find your destination"
              placeholderTextColor="#AAAAAA"
              onFocus={() => setShowSuggest(true)}
              returnKeyType="done"
              onSubmitEditing={() => setShowSuggest(false)}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearchKeyword(''); if (!isAnnual) resetDestination(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#CCCCCC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggest dropdown */}
          {showSuggest && filteredCountries.length > 0 && (
            <View style={styles.suggestBox}>
              {filteredCountries.map(c => (
                <TouchableOpacity
                  key={c}
                  style={styles.suggestItem}
                  onPress={() => handlePickCountry(c)}
                >
                  <Text style={styles.suggestItemText}>
                    {isAnnual ? c : formatCountryDisplay(c)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Trip Type ── */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.questionText}>Type of Trip</Text>
          <RadioCard
            options={[
              { name: 'One Trip', value: 1 },
              { name: 'Annual Multi Trip', value: 2 },
            ]}
            value={tripType}
            onChange={handleTripTypeChange}
          />
        </View>

        {/* ── Coverage Type ── */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.questionText}>Coverage Type</Text>
          <RadioButton
            options={[
              { name: 'Individual', value: 1 },
              { name: 'Family', value: 2 },
            ]}
            value={coverageType}
            onChange={handleCoverageTypeChange}
          />
        </View>

        {/* ── Family counter (animated, shown only for Family) ── */}
        {coverageType === 2 && (
          <Animated.View style={[styles.familySection, { opacity: familyOpacity }]}>
            <View style={styles.familyRow}>
              <Text style={styles.familyLabel}>Adult</Text>
              <Text style={styles.familyHint}>(age 18 and above)</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setAdultCount(c => Math.max(1, c - 1))}>
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adultCount}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setAdultCount(c => Math.min(2, c + 1))}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.familyRow}>
              <Text style={styles.familyLabel}>Child</Text>
              <Text style={styles.familyHint}>(age 30 days – 17 years)</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setChildCount(c => Math.max(0, c - 1))}>
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{childCount}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setChildCount(c => c + 1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Destination & Date (combined section, matches Vue group_6) ── */}
        <View style={styles.destDateCard}>
          <Text style={styles.destDateTitle}>Destination &amp; Date</Text>

          {/* Destination row */}
          <View style={styles.destDateRow}>
            <Text style={styles.destDateLabel}>Destination</Text>
            {destinationDisplay ? (
              <View style={styles.destinationTag}>
                <Ionicons name="location-outline" size={13} color={Colors.primary} />
                <Text style={styles.destinationTagText}>{destinationDisplay}</Text>
              </View>
            ) : (
              <Text style={styles.destDatePlaceholder}>Not selected</Text>
            )}
          </View>

          {/* Annual zone pills (inline, for Annual mode) */}
          {isAnnual && (
            <View style={styles.zoneRow}>
              {ANNUAL_ZONES.map(z => (
                <TouchableOpacity
                  key={z.value}
                  style={[styles.zoneBtn, zone === z.value && styles.zoneBtnActive]}
                  onPress={() => { setZone(z.value); setCountry(z.label); setSearchKeyword(z.label); }}
                >
                  <Text style={[styles.zoneBtnText, zone === z.value && styles.zoneBtnTextActive]}>
                    {z.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.destDateDivider} />

          {/* Date row — opens calendar */}
          <TouchableOpacity
            style={styles.destDateRow}
            onPress={() => { setCalendarMode('depart'); setShowCalendar(true); }}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.destDateLabel}>
                {isAnnual ? 'Departure Date' : 'Depart and Return Date'}
              </Text>
            </View>
            <View style={styles.dateValueRow}>
              <Text style={[styles.dateValueText, (!departDate) && styles.datePlaceholder]}>
                {dateDisplay}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>

          {/* Return date separately when Single trip & depart selected */}
          {!isAnnual && departDate && !returnDate && (
            <TouchableOpacity
              style={[styles.destDateRow, { paddingTop: 0 }]}
              onPress={() => { setCalendarMode('return'); setShowCalendar(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.returnHint}>Tap to select return date</Text>
            </TouchableOpacity>
          )}

          <View style={styles.destDateDivider} />

          {/* Add Ons row */}
          <TouchableOpacity
            style={styles.addOnRow}
            onPress={() => setAddonChecked(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.destDateLabel}>Add Ons</Text>
            <View style={styles.addOnRight}>
              <Text style={styles.addOnLabel}>
                {isAnnual ? 'Domestic Annual' : 'Cruise'}
              </Text>
              <View style={[styles.checkbox, addonChecked && styles.checkboxActive]}>
                {addonChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Malaysian declaration ── */}
        <TouchableOpacity
          style={styles.declarationRow}
          onPress={() => setMalaysianChecked(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, malaysianChecked && styles.checkboxActive]}>
            {malaysianChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.declarationText}>
            I/We am/are a Malaysian / Malaysian Permanent Resident / holder of a valid
            working permit, dependent pass, long term social visit pass or student pass
            in Malaysia, and departing from Malaysia as a passenger. I/We am/are aware
            that the policy must be purchased before the commencement of journey and
            all trips must start and end in Malaysia.
          </Text>
        </TouchableOpacity>

        {/* Calendar modal */}
        <SimpleCalendarModal
          visible={showCalendar}
          mode={calendarMode}
          departDate={departDate}
          returnDate={returnDate}
          onSelect={handleCalendarSelect}
          onClose={() => setShowCalendar(false)}
        />

        {/* Continue */}
        <TouchableOpacity
          style={[sharedStyles.continueBtn, { marginTop: 28 }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        position={toast.position}
        onHide={hideToast}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  // ── Search bar (top) ──────────────────────────────────────────────────────
  searchSection: { width: '100%', marginBottom: 24, zIndex: 10 },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#343434',
  },
  suggestBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  suggestItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestItemText: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular },

  // ── Family counter ────────────────────────────────────────────────────────
  familySection: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  familyRow: { flexDirection: 'row', alignItems: 'center' },
  familyLabel: { fontSize: 15, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434', marginRight: 6 },
  familyHint: { flex: 1, fontSize: 12, color: '#808080', fontFamily: FontFamily.regular },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: { fontSize: 20, color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: '700', lineHeight: 22 },
  counterValue: { fontSize: 18, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434', minWidth: 28, textAlign: 'center' },

  // ── Destination & Date card ───────────────────────────────────────────────
  destDateCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  destDateTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginBottom: 12,
    textAlign: 'center',
  },
  destDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  destDateLabel: { fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  destDatePlaceholder: { fontSize: 14, color: '#AAAAAA', fontFamily: FontFamily.regular },
  destDateDivider: { height: 0.5, backgroundColor: 'rgba(128,128,128,0.3)', marginVertical: 2 },

  // Destination tag (pills)
  destinationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(253,184,19,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  destinationTagText: { fontSize: 13, color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: '700' },

  // Annual zone pills
  zoneRow: { flexDirection: 'row', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  zoneBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: Colors.primary },
  zoneBtnActive: { backgroundColor: Colors.primary },
  zoneBtnText: { fontSize: 14, color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: '700' },
  zoneBtnTextActive: { color: '#FFFFFF' },

  // Date value row inside dest+date card
  dateValueRow: { flexDirection: 'row', alignItems: 'center' },
  dateValueText: { fontSize: 13, color: '#343434', fontFamily: FontFamily.bold, fontWeight: '700', textAlign: 'right' },
  datePlaceholder: { color: '#AAAAAA', fontFamily: FontFamily.regular, fontWeight: '400' },
  returnHint: { fontSize: 12, color: Colors.primary, fontFamily: FontFamily.regular, paddingBottom: 8 },

  // Add Ons row
  addOnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  addOnRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addOnLabel: { fontSize: 13, color: '#808080', fontFamily: FontFamily.regular },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.primary },

  // Declaration
  declarationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%', marginBottom: 8 },
  declarationText: { flex: 1, fontSize: 13, color: '#808080', fontFamily: FontFamily.regular, lineHeight: 20 },
});

export default TravelStep1;
