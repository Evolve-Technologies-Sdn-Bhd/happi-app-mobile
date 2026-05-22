/**
 * Purchase Home Step 2 — Declare Articles Valued Over RM2,000
 * Ported from happi-app-customer/src/views/purchase/home/step_2.vue + step_2_1.vue
 *
 * Shows the list of declared articles, allows add/edit/remove via modal.
 * On Continue → navigate to HomeStep3 passing articles as JSON.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import { getProductListByCategoryIdAndCompanyId, Product } from '../../../../../api/product';
import { useCategoryStore } from '../../../../../store';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'HomeStep2'>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeArticle {
  _id: string; // local-only id for list key / edit tracking
  name: string;
  serial: string;
  sumInsured: number; // RM value as entered by user
}

const EMPTY_ARTICLE: Omit<HomeArticle, '_id'> = { name: '', serial: '', sumInsured: 0 };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fmtRM = (n: number) => `RM ${Number(n).toFixed(2)}`;

// ─── Screen ───────────────────────────────────────────────────────────────────

const HomeStep2: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, isDamage, damageDetail } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;
  const { getCategoryByCode } = useCategoryStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [articles, setArticles] = useState<HomeArticle[]>([]);

  // Article modal state
  const [modal, setModal] = useState({
    visible: false,
    isAdd: true,
    editId: '',
    name: '',
    serial: '',
    sumInsuredText: '',
  });
  const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);

  // ── Load product for sumInsured display ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const category = getCategoryByCode(categoryCode);
        const res = await getProductListByCategoryIdAndCompanyId(
          category?.id ?? categoryCode,
          companyId,
        );
        const list: Product[] = (res as any)?.data ?? [];
        setProduct(list.find(p => p.id === productId) ?? null);
      } catch (e) {
        console.warn('Failed to load product', e);
      }
    })();
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────
  const totalDeclare = articles.reduce((s, a) => s + a.sumInsured, 0);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () =>
    setModal({ visible: true, isAdd: true, editId: '', ...EMPTY_ARTICLE, sumInsuredText: '' });

  const openEdit = (a: HomeArticle) =>
    setModal({
      visible: true, isAdd: false, editId: a._id,
      name: a.name, serial: a.serial, sumInsuredText: String(a.sumInsured),
    });

  const closeModal = () =>
    setModal(m => ({ ...m, visible: false }));

  const saveArticle = () => {
    const name = modal.name.trim();
    const serial = modal.serial.trim();
    const sumInsured = parseFloat(modal.sumInsuredText);

    if (!name) { Alert.alert('', 'Description of Article is required'); return; }
    if (!serial) { Alert.alert('', 'Serial/Receipt/Valuation No. is required'); return; }
    if (!modal.sumInsuredText || isNaN(sumInsured) || sumInsured <= 0) {
      Alert.alert('', 'Sum Insured (RM) is required'); return;
    }

    if (modal.isAdd) {
      setArticles(prev => [
        ...prev,
        { _id: uid(), name, serial, sumInsured },
      ]);
    } else {
      setArticles(prev =>
        prev.map(a =>
          a._id === modal.editId ? { ...a, name, serial, sumInsured } : a
        )
      );
    }
    closeModal();
  };

  const removeArticle = () => {
    setArticles(prev => prev.filter(a => a._id !== modal.editId));
    setRemoveConfirmVisible(false);
    closeModal();
  };

  // ── Continue ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    navigation.navigate('HomeStep3', {
      productId, categoryCode, companyId,
      isDamage, damageDetail,
      articles: JSON.stringify(
        articles.map(({ _id: _ignored, ...rest }) => rest)
      ),
    });
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
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
  );

  return (
    <KeyboardAvoidingView
      style={sharedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section intro ── */}
        <Text style={styles.sectionTitle}>Declare Articles Valued Over RM2,000 Each</Text>
        <Text style={styles.infoText}>
          If any selected item exceeds RM2,000 in value, please declare it below. Receipts or
          valuation reports will be required when submitting a claim.
        </Text>

        {/* ── Sum Insured card ── */}
        <View style={styles.sumCard}>
          <Text style={styles.sumLabel}>Sum Insured</Text>
          <Text style={styles.sumValue}>
            {product?.sumInsured != null ? fmtRM(product.sumInsured) : '—'}
          </Text>
          <View style={styles.totalDeclareRow}>
            <Text style={styles.totalDeclareLabel}>Total Declared: </Text>
            <Text style={styles.totalDeclareValue}>{fmtRM(totalDeclare)}</Text>
          </View>
        </View>

        {/* ── Articles table ── */}
        <View style={styles.tableCard}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.cellDesc, styles.tableHeaderText]}>
              Description of Articles
            </Text>
            <Text style={[styles.tableCell, styles.cellSerial, styles.tableHeaderText]}>
              Serial/Receipt/Valuation No.
            </Text>
            <Text style={[styles.tableCell, styles.cellSum, styles.tableHeaderText]}>
              Sum Insured (RM)
            </Text>
          </View>

          {articles.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No articles declared yet.</Text>
            </View>
          )}

          {articles.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.tableRow, styles.tableDataRow]}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tableCell, styles.cellDesc, styles.tableCellText]}>
                {item.name}
              </Text>
              <Text style={[styles.tableCell, styles.cellSerial, styles.tableCellText]}>
                {item.serial}
              </Text>
              <Text style={[styles.tableCell, styles.cellSum, styles.tableCellText]}>
                {fmtRM(item.sumInsured)}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add item */}
          <TouchableOpacity style={styles.addItemRow} onPress={openAdd} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.addItemText}>Add item</Text>
          </TouchableOpacity>
        </View>

        {/* ── Continue ── */}
        <TouchableOpacity
          style={sharedStyles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={sharedStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add / Edit Article Modal ── */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={closeModal}
        />
        {/* Sheet pinned to bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <TouchableOpacity activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {modal.isAdd ? 'Add Article' : 'Edit Article'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color="#010101" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Description */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Description of Articles</Text>
                <TextInput
                  style={styles.fieldTextarea}
                  value={modal.name}
                  onChangeText={v => setModal(m => ({ ...m, name: v }))}
                  multiline
                  maxLength={255}
                  textAlignVertical="top"
                  placeholder="e.g. Laptop, Watch, Camera..."
                  placeholderTextColor="#D3D4D6"
                  underlineColorAndroid="transparent"
                />
                <Text style={styles.charCount}>{modal.name.length}/255</Text>
              </View>

              {/* Serial */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Serial/Receipt/Valuation No.</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={modal.serial}
                  onChangeText={v => setModal(m => ({ ...m, serial: v }))}
                  maxLength={50}
                  placeholder="e.g. SN123456789"
                  placeholderTextColor="#D3D4D6"
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Sum Insured */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Sum Insured (RM)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={modal.sumInsuredText}
                  onChangeText={v => setModal(m => ({ ...m, sumInsuredText: v }))}
                  keyboardType="numeric"
                  placeholder="e.g. 3000"
                  placeholderTextColor="#D3D4D6"
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Buttons */}
              <View style={styles.sheetBtnRow}>
                {!modal.isAdd && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setRemoveConfirmVisible(true)}
                  >
                    <Text style={styles.removeBtnText}>Remove Article</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveBtn} onPress={saveArticle}>
                  <Text style={styles.saveBtnText}>Save Article</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Remove Confirm Modal ── */}
      <Modal
        visible={removeConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Reminder</Text>
            <Text style={styles.confirmMsg}>Confirm to remove this article?</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setRemoveConfirmVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmOkBtn} onPress={removeArticle}>
                <Text style={styles.confirmOkText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  sectionTitle: {
    color: '#343434',
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  infoText: {
    color: '#808080',
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginBottom: 20,
  },

  sumCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sumLabel: {
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  sumValue: {
    fontSize: 22,
    color: '#343434',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  totalDeclareRow: { flexDirection: 'row', alignItems: 'center' },
  totalDeclareLabel: { fontSize: 14, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  totalDeclareValue: { fontSize: 14, fontFamily: FontFamily.regular, color: '#808080' },

  tableCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableHeaderRow: {
    backgroundColor: '#FFF8E8',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.3)',
    paddingVertical: 10,
  },
  tableDataRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    paddingVertical: 10,
  },
  tableCell: { paddingHorizontal: 10 },
  cellDesc: { flex: 2 },
  cellSerial: { flex: 2 },
  cellSum: { flex: 1.5 },
  tableHeaderText: { fontSize: 11, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  tableCellText: { fontSize: 12, fontFamily: FontFamily.regular, color: '#808080' },

  emptyRow: {
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  emptyText: { fontSize: 13, color: '#CCCCCC', fontFamily: FontFamily.regular },

  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  addItemText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  // Bottom sheet
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(59,64,86,0.2)',
  },
  sheetTitle: { fontSize: 17, fontFamily: FontFamily.bold, fontWeight: '700', color: '#010101' },
  sheetScroll: { paddingHorizontal: 20, paddingTop: 16 },
  fieldWrapper: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    fontFamily: FontFamily.regular,
  },
  fieldTextarea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    fontFamily: FontFamily.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: '#AAAAAA', marginTop: 4 },

  sheetBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  removeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 14,
  },

  // Confirm dialog
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  confirmTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmMsg: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#808080',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmBtnRow: { flexDirection: 'row', gap: 12 },
  confirmCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular },
  confirmOkBtn: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmOkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});

export default HomeStep2;
