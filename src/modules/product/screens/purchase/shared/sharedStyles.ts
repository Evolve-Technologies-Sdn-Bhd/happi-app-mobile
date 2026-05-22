import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export { SCREEN_WIDTH };

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },

  // Header
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: { height: 210 },
  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700' },
  headerTextBlock: { marginHorizontal: 24, marginTop: 16 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  headerSubTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 167,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 30, paddingHorizontal: 24, alignItems: 'center' },

  // Section
  section: { width: '100%', alignItems: 'center', marginBottom: 24 },
  questionText: {
    alignSelf: 'stretch',
    color: '#343434',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 18,
  },

  // Continue button
  continueBtn: {
    marginTop: 32,
    width: 200,
    height: 36,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});
