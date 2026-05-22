/**
 * My Membership List Screen
 * Ported from happi-app-customer/src/views/membership/purchase/list.vue
 * Shows user's purchased membership cards and level progress
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../app/navigation/types';
import { Toast } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { FontFamily } from '../../../shared/constants/fonts';
import { useUserStore } from '../../../store';
import { 
  getOssImg,
  MembershipItem,
  MembershipMultiplier
} from '../../../api';
import membershipApi from '../../../api/membership';
import { useToast } from '../../../shared/hooks/useToast';
import { Platform } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MembershipPurchaseList'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export const MyMembershipListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  // Store state
  const userInfo = useUserStore((state) => state.info);
  const token = useUserStore((state) => state.token);
  const purchaseMembershipList = useUserStore((state) => state.purchaseMembershipList);
  const getUserPurchaseMembershipListAction = useUserStore((state) => state.getUserPurchaseMembershipListAction);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [membershipMultiplierMap, setMembershipMultiplierMap] = useState<Map<string, number>>(new Map());
  const [membershipGroupList, setMembershipGroupList] = useState<any[]>([]);
  const [sumInsuredModalVisible, setSumInsuredModalVisible] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  // Display name with truncation (matching Vue logic)
  const displayName = React.useMemo(() => {
    let name = userInfo?.realname || (userInfo as any)?.name || '';
    name = String(name);
    if (!name) return '';
    const maxLength = 26;
    if (name.length <= maxLength) return name.toUpperCase();
    
    const cutPatterns = [/\s+bin\s+/i, /\s+binti\s+/i, /\s+a\/l\s+/i, /\s+a\/p\s+/i];
    let cutIndex = -1;
    for (const pattern of cutPatterns) {
      const match = name.match(pattern);
      if (match?.index !== undefined) {
        if (cutIndex === -1 || match.index < cutIndex) {
          cutIndex = match.index;
        }
      }
    }
    if (cutIndex !== -1) {
      name = name.substring(0, cutIndex).trim();
    }
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    return name;
  }, [userInfo]);

  // Header display name (without uppercase)
  const headerDisplayName = React.useMemo(() => {
    let name = userInfo?.realname || (userInfo as any)?.name || '';
    name = String(name);
    if (!name) return '';
    const maxLength = 26;
    if (name.length <= maxLength) return name;
    
    const cutPatterns = [/\s+bin\s+/i, /\s+binti\s+/i, /\s+a\/l\s+/i, /\s+a\/p\s+/i];
    let cutIndex = -1;
    for (const pattern of cutPatterns) {
      const match = name.match(pattern);
      if (match?.index !== undefined) {
        if (cutIndex === -1 || match.index < cutIndex) {
          cutIndex = match.index;
        }
      }
    }
    if (cutIndex !== -1) {
      name = name.substring(0, cutIndex).trim();
    }
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    return name;
  }, [userInfo]);
  
  // Calculate target levels (matching Vue logic)
  const targetLevels = React.useMemo(() => {
    let levels = memberships.map((item) => ({
      id: item.id,
      tier: parseInt(item.tier, 10) || 0,
      name: item.name,
      active: false,
    }));
    
    levels.sort((a, b) => a.tier - b.tier);
    
    levels = [
      { id: '0', tier: 0, name: 'Non-Member', active: true },
      ...levels,
    ];
    
    const targetLevels = levels.map((level) => ({
      ...level,
      active: purchaseMembershipList?.some((membership: any) => {
        if (level.tier === 1) {
          return membership.tier === 1 || membership.isSpecial === 1;
        }
        return membership.tier == level.tier;
      }) || false,
    }));
    
    targetLevels[0].active = true;
    
    const lastActiveIndex = targetLevels.map((item) => item.active).lastIndexOf(true);
    for (let i = 0; i <= lastActiveIndex; i++) {
      targetLevels[i].active = true;
    }
    
    return targetLevels;
  }, [memberships, purchaseMembershipList]);
  
  // Filter non-special memberships
  const nonSpecialMemberships = React.useMemo(() => {
    if (!purchaseMembershipList) return [];
    return purchaseMembershipList.filter((item: any) => item.isSpecial === 0);
  }, [purchaseMembershipList]);
  
  // Displayed purchase memberships (up to 4 cards)
  const displayedPurchaseMemberships = React.useMemo(() => {
    const today = new Date();
    const nonSpecialCards = purchaseMembershipList
      ?.filter((item: any) => item.isSpecial === 0)
      .sort((a: any, b: any) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
      .slice(0, 4) || [];
    
    const result = nonSpecialCards.map((item: any, idx: number) => {
      if (!item.expiryDate) return item;
      const expiry = new Date(item.expiryDate.replace(/-/g, '/'));
      if (expiry >= today) return item;
      return {
        isPlaceholder: true,
        id: `placeholder-${idx}`,
        name: '',
      };
    });
    
    while (result.length < 4) {
      result.push({
        isPlaceholder: true,
        id: `placeholder-${result.length}`,
        name: '',
      });
    }
    
    return result;
  }, [purchaseMembershipList]);
  
  // Purchase special memberships (Elite cards)
  const purchaseSpecialMemberships = React.useMemo(() => {
    const today = new Date();
    if (!purchaseMembershipList) return [];
    const specialCards = purchaseMembershipList.filter((item: any) => {
      if (item.isSpecial !== 1) return false;
      if (!item.expiryDate) return true;
      const expiry = new Date(item.expiryDate.replace(/-/g, '/'));
      return expiry >= today;
    });
    return specialCards;
  }, [purchaseMembershipList]);
  
  // Filtered membership group list
  const filteredMembershipGroupList = React.useMemo(() => {
    const today = new Date();
    const processedGroups = membershipGroupList.map((group: any) => {
      const filteredPurchaseItems = (group.purchaseItems || []).map((item: any, idx: number) => {
        if (!item.expiryDate) return item;
        const expiry = new Date(item.expiryDate.replace(/-/g, '/'));
        if (expiry >= today) return item;
        return {
          isPlaceholder: true,
          id: `placeholder-${idx}`,
          name: '',
        };
      });
      return {
        ...group,
        purchaseItems: filteredPurchaseItems,
      };
    });
    
    // Sort groups: Elite first, then by tier (4 > 3 > 2 > 1)
    return processedGroups.sort((a: any, b: any) => {
      const aIsElite = a.name && a.name.toLowerCase().includes('elite');
      const bIsElite = b.name && b.name.toLowerCase().includes('elite');
      
      if (aIsElite && !bIsElite) return -1;
      if (!aIsElite && bIsElite) return 1;
      
      const aTier = a.tier || 0;
      const bTier = b.tier || 0;
      return bTier - aTier;
    });
  }, [membershipGroupList]);
  
  // Calculate total PA sum insured
  const totalSumInsured = React.useMemo(() => {
    if (!purchaseMembershipList) return 0;
    return purchaseMembershipList.reduce((sum: number, item: any) => {
      return sum + (item.sumInsured || 0);
    }, 0);
  }, [purchaseMembershipList]);
  
  // Fetch membership list
  const getMembershipListData = useCallback(async () => {
    try {
      const res = await membershipApi.getMembershipList();
      if (res.success && res.data) {
        setMemberships(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch membership list:', error);
    }
  }, []);
  
  // Fetch membership multipliers
  const getMembershipMultiplierListData = useCallback(async () => {
    try {
      const res = await membershipApi.getMembershipMultiplierList();
      if (res.success && res.data) {
        const multiplierMap = new Map<string, number>();
        res.data.forEach((item: any) => {
          multiplierMap.set(item.membershipId, item.multiplier);
        });
        setMembershipMultiplierMap(multiplierMap);
      }
    } catch (error) {
      console.error('Failed to fetch membership multipliers:', error);
    }
  }, []);
  
  // Fetch membership group list
  const getMembershipGroupListData = useCallback(async () => {
    try {
      const res = await membershipApi.getMembershipGroupList();
      if (res.success && res.data) {
        setMembershipGroupList(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch membership group list:', error);
    }
  }, []);
  
  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        getUserPurchaseMembershipListAction(),
        getMembershipListData(),
        getMembershipGroupListData(),
        getMembershipMultiplierListData(),
      ]);
    } catch (error) {
      console.error('Failed to load membership data:', error);
    }
  }, [getUserPurchaseMembershipListAction, getMembershipListData, getMembershipGroupListData, getMembershipMultiplierListData]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const goToMembershipIndex = () => {
    // Navigate to membership tab/index
    // This screen is in the root stack, so navigate via 'Main' to reach the tab
    (navigation as any).navigate('Main', {
      screen: 'Membership',
      params: { screen: 'MembershipIndex' },
    });
  };
  
  const goToMembershipById = (id: string) => {
    // Navigate to membership detail in Membership stack
    (navigation as any).navigate('Main', {
      screen: 'Membership',
      params: { screen: 'MembershipDetail', params: { membershipId: id } },
    });
  };
  
  const handleBack = () => {
    // Navigate back to Home tab
    (navigation as any).navigate('Main', { screen: 'Home' });
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Background */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={require('../../../../assets/products/header-bg.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Memberships</Text>
                <View style={{ width: 24 }} />
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>
        {/* Fixed Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.userName}>{headerDisplayName.toUpperCase()}</Text>
          <Text style={styles.unlockText}>
            You've unlocked {nonSpecialMemberships.length} out of {memberships.length} HAPPI Memberships.
          </Text>
          
          {/* Progress Wrapper */}
          <View style={styles.progressWrapper}>
            {targetLevels.map((level, index) => {
              const multiplier = membershipMultiplierMap.get(level.id) || 0;
              return (
                <View key={level.id} style={styles.progressItem}>
                  {level.active && (
                    <Image
                      source={require('../../../../assets/images/progress-arrow-active.png')}
                      style={styles.progressIcon}
                      contentFit="contain"
                    />
                  )}
                  <Text style={[
                    styles.multiplierText,
                    level.active && styles.multiplierTextActive
                  ]}>
                    x{multiplier}
                  </Text>
                  <View style={[
                    styles.progressLine,
                    level.active && styles.progressLineActive
                  ]} />
                  <Text style={styles.levelDesc}>{level.name}</Text>
                </View>
              );
            })}
          </View>
          
          <Text style={styles.bottomTip}>
            Reach Platinum in any membership to unlock rewards up to x5 HAPPIcoins!
          </Text>
        </View>
        
        {/* Spacer for fixed header */}
        <View style={{ height: 100 }} />
        
        {/* Membership Cards Wrapper */}
        <View style={styles.membershipsWrapper}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membershipsContent}
          >
          {displayedPurchaseMemberships.map((item: any, index: number) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.membershipItem}
              onPress={() => {
                if (item.isPlaceholder) {
                  goToMembershipIndex();
                }
              }}
              activeOpacity={item.isPlaceholder ? 0.7 : 1}
            >
              <View style={styles.cardWrapper}>
                {!item.isPlaceholder ? (
                  <ImageBackground
                    source={{ uri: getOssImg(item.cardImgUrl) }}
                    style={styles.cardImage}
                    imageStyle={styles.cardImageStyle}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.customerName}>{displayName}</Text>
                      <View style={styles.bottomContent}>
                        <View style={styles.memberIdSection}>
                          <Text style={styles.memberIdLabel}>Member ID</Text>
                          <Text style={styles.policyNumber}>{userInfo?.uniqueId || ''}</Text>
                        </View>
                        {item.companyInfo?.logoUrl && (
                          <Image
                            source={{ uri: getOssImg(item.companyInfo.logoUrl) }}
                            style={styles.companyLogo}
                            contentFit="contain"
                          />
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={styles.placeholderCard}>
                    <Text style={styles.placeholderText}>+</Text>
                  </View>
                )}
              </View>
              {!item.isPlaceholder ? (
                <Text style={styles.cardDesc}>{item.name}</Text>
              ) : (
                <Text style={[styles.cardDesc, styles.placeholderDesc]}>Add Card</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>
        
        {/* Sum Insured Section */}
        <View style={styles.sumInsuredSection}>
          <View style={styles.sumInsuredRow}>
            <Text style={styles.sumInsuredLabel}>Total PA Sum Insured : </Text>
            <Text style={styles.sumInsuredValue}>
              RM{totalSumInsured.toLocaleString('en-MY', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }).replace(/,/g, ',')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setSumInsuredModalVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#808080" />
          </TouchableOpacity>
        </View>
        
        {/* Elite Card Section */}
        {purchaseSpecialMemberships.length > 0 && (
          <View style={styles.cardSection}>
            <MaskedView
              maskElement={<Text style={[styles.sectionTitle, { backgroundColor: 'transparent' }]}>Elite Card</Text>}
            >
              <LinearGradient
                colors={['#8B3DFF', '#611d86']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.sectionTitle, { opacity: 0 }]}>Elite Card</Text>
              </LinearGradient>
            </MaskedView>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizList}
              contentContainerStyle={styles.horizListContent}
            >
              {purchaseSpecialMemberships.map((item: any, index: number) => (
                <View 
                  key={index}
                  style={[styles.largeCard, index > 0 && { marginLeft: 10 }]}
                >
                  <ImageBackground
                    source={{ uri: getOssImg(item.cardImgUrl) }}
                    style={styles.largeCardImage}
                    imageStyle={styles.largeCardImageStyle}
                  >
                    <View style={styles.largeCardContent}>
                      <Text style={styles.largeCardCustomerName}>{displayName}</Text>
                      <View style={styles.largeCardBottomContent}>
                        <View style={styles.largeCardMemberIdSection}>
                          <Text style={styles.largeCardMemberIdLabel}>Member ID</Text>
                          <Text style={styles.largeCardPolicyNumber}>{userInfo?.uniqueId || ''}</Text>
                        </View>
                        {item.companyInfo?.logoUrl && (
                          <Image
                            source={{ uri: getOssImg(item.companyInfo.logoUrl) }}
                            style={styles.largeCardCompanyLogo}
                            contentFit="contain"
                          />
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Tier-based Card Sections */}
        {filteredMembershipGroupList.map((group: any, idx: number) => (
          <View 
            key={idx} 
            style={[
              styles.cardSection,
              idx === filteredMembershipGroupList.length - 1 && { marginBottom: 30 }
            ]}
          >
            {group.name.toLowerCase().includes('platinum') && (
              <MaskedView
                maskElement={<Text style={[styles.sectionTitle, { backgroundColor: 'transparent' }]}>{group.name}</Text>}
              >
                <LinearGradient
                  colors={['#c4c3c1', '#333333']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.sectionTitle, { opacity: 0 }]}>{group.name}</Text>
                </LinearGradient>
              </MaskedView>
            )}
            {group.name.toLowerCase().includes('gold') && (
              <MaskedView
                maskElement={<Text style={[styles.sectionTitle, { backgroundColor: 'transparent' }]}>{group.name}</Text>}
              >
                <LinearGradient
                  colors={['#ffd900', '#ff5e00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.sectionTitle, { opacity: 0 }]}>{group.name}</Text>
                </LinearGradient>
              </MaskedView>
            )}
            {group.name.toLowerCase().includes('silver') && (
              <MaskedView
                maskElement={<Text style={[styles.sectionTitle, { backgroundColor: 'transparent' }]}>{group.name}</Text>}
              >
                <LinearGradient
                  colors={['#C0C0C0', '#6f6e6e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.sectionTitle, { opacity: 0 }]}>{group.name}</Text>
                </LinearGradient>
              </MaskedView>
            )}
            {group.name.toLowerCase().includes('bronze') && (
              <MaskedView
                maskElement={<Text style={[styles.sectionTitle, { backgroundColor: 'transparent' }]}>{group.name}</Text>}
              >
                <LinearGradient
                  colors={['#CD7F32', '#653301']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.sectionTitle, { opacity: 0 }]}>{group.name}</Text>
                </LinearGradient>
              </MaskedView>
            )}
            {!group.name.toLowerCase().includes('platinum') && 
             !group.name.toLowerCase().includes('gold') && 
             !group.name.toLowerCase().includes('silver') && 
             !group.name.toLowerCase().includes('bronze') && (
              <Text style={styles.sectionTitle}>{group.name}</Text>
            )}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizList}
              contentContainerStyle={styles.horizListContent}
            >
              {/* Purchased Cards */}
              {group.purchaseItems?.map((card: any, index: number) => (
                !card.isPlaceholder && (
                  <View 
                    key={index}
                    style={[styles.largeCard, index > 0 && { marginLeft: 10 }]}
                  >
                    <ImageBackground
                      source={{ uri: getOssImg(group.cardImgUrl) }}
                      style={styles.largeCardImage}
                      imageStyle={styles.largeCardImageStyle}
                    >
                      <View style={styles.largeCardContent}>
                        <Text style={styles.largeCardCustomerName}>{displayName}</Text>
                        <View style={styles.largeCardBottomContent}>
                          <View style={styles.largeCardMemberIdSection}>
                            <Text style={styles.largeCardMemberIdLabel}>Member ID</Text>
                            <Text style={styles.largeCardPolicyNumber}>{userInfo?.uniqueId || ''}</Text>
                          </View>
                          {card.companyInfo?.logoUrl && (
                            <Image
                              source={{ uri: getOssImg(card.companyInfo.logoUrl) }}
                              style={styles.largeCardCompanyLogo}
                              contentFit="contain"
                            />
                          )}
                        </View>
                      </View>
                    </ImageBackground>
                  </View>
                )
              ))}
              
              {/* Add Card Placeholder */}
              {group.purchaseItems && group.purchaseItems.length < 4 && group.planItems?.map((card: any, index: number) => (
                index === 0 && (
                  <TouchableOpacity
                    key={`plan-${index}`}
                    style={[
                      styles.largeCard,
                      group.purchaseItems.length > 0 && { marginLeft: 10 }
                    ]}
                    onPress={() => goToMembershipById(card.id)}
                    activeOpacity={0.7}
                  >
                    <ImageBackground
                      source={{ uri: getOssImg(group.cardImgUrl) }}
                      style={styles.largeCardImage}
                      imageStyle={styles.largeCardImageStyle}
                    >
                      <View style={styles.addCardOverlay}>
                        <Image
                          source={require('../../../../assets/images/add-icon.png')}
                          style={styles.addCardIcon}
                          contentFit="contain"
                        />
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                )
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
      
      {/* Sum Insured Breakdown Modal */}
      <Modal
        visible={sumInsuredModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSumInsuredModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSumInsuredModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>PA Sum Insured Breakdown</Text>
                  <TouchableOpacity 
                    onPress={() => setSumInsuredModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#808080" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.sumInsuredList}>
                    {purchaseMembershipList.map((item: any, idx: number) => (
                      <View key={idx} style={styles.sumRow}>
                        <Text style={styles.sumName}>
                          {item.name || item.planName}
                        </Text>
                        <Text style={styles.sumAmount}>
                          PA RM{(item.sumInsured || 0).toLocaleString('en-MY', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        position={toast.position}
        onHide={hideToast}
      />
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  
  // Header Section
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '500',
    lineHeight: 32,
  },
  
  // Fixed Header Card (matching section_2 from Vue)
  headerCard: {
    position: 'absolute' as 'absolute',
    top: 120,
    left: 24,
    right: 24,
    zIndex: 1000,
    paddingTop: 30,
    paddingRight: 20,
    paddingBottom: 24,
    paddingLeft: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'hidden' as 'hidden',
    height: 220,
  },
  
  userName: {
    fontSize: 19,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#333333',
    lineHeight: 14,
  },
  
  unlockText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: FontFamily.regular, fontWeight: '400',
    color: '#343434',
    lineHeight: 14,
  },
  
  // Progress Wrapper
  progressWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  progressItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  
  progressIcon: {
    width: 12,
    height: 12,
    marginBottom: 2,
    marginTop: 4,
  },
  
  multiplierText: {
    fontSize: 16,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#FDB813',
    lineHeight: 15.5,
  },
  
  multiplierTextActive: {
    fontSize: 33,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#FDB813',
    lineHeight: 27,
  },
  
  progressLine: {
    marginTop: 8,
    alignSelf: 'stretch',
    height: 6,
    backgroundColor: 'rgba(253, 184, 19, 0.5)',
  },
  
  progressLineActive: {
    backgroundColor: '#FDB813',
  },
  
  levelDesc: {
    marginTop: 8,
    fontSize: 8,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#000000',
    lineHeight: 12,
    textAlign: 'center',
  },
  
  bottomTip: {
    marginTop: 15,
    fontSize: 10,
    fontFamily: FontFamily.regular, fontWeight: '400',
    color: '#808080',
    lineHeight: 12,
    textAlign: 'center',
  },
  
  // Memberships Wrapper (matching memberships-wrapper and equal-division from Vue)
  membershipsWrapper: {
    paddingHorizontal: 20,
    // marginTop: 40,
  },
  
  membershipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  membershipItem: {
    alignItems: 'center',
    flexShrink: 0,
  },
  
  cardWrapper: {
    position: 'relative',
  },
  
  cardImage: {
    width: 87,
    height: 51,
  },
  
  cardImageStyle: {
    borderRadius: 6,
  },
  
  cardContent: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  
  customerName: {
    fontSize: 4.5,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#F2F2F2',
    lineHeight: 4.5,
  },
  
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  
  memberIdSection: {
    flexDirection: 'column',
  },
  
  memberIdLabel: {
    fontSize: 2.5,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#F2F2F2',
    lineHeight: 2.5,
  },
  
  policyNumber: {
    fontSize: 3,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 3,
  },
  
  companyLogo: {
    width: 18,
    height: 6.5,
  },
  
  placeholderCard: {
    width: 87,
    height: 51,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D0D0',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  placeholderText: {
    fontSize: 24,
    fontWeight: '300' as any,
    color: '#D0D0D0',
  },
  
  cardDesc: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#000000',
    lineHeight: 9,
    textAlign: 'center',
  },
  
  placeholderDesc: {
    fontSize: 9,
    color: '#808080',
  },
  
  // Sum Insured Section (matching group_9 from Vue)
  sumInsuredSection: {
    marginTop: 30,
    paddingHorizontal: 74,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  sumInsuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    lineHeight: 17.5,
    height: 17.5,
  },
  
  sumInsuredLabel: {
    fontSize: 16,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#343434',
    lineHeight: 11.5,
  },
  
  sumInsuredValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#FDB813',
    lineHeight: 17.5,
  },
  
  infoButton: {
    padding: 4,
  },
  
  infoIcon: {
    width: 20,
    height: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
  },
  
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#343434',
  },
  
  closeButton: {
    padding: 4,
  },
  
  modalBody: {
    maxHeight: 400,
  },
  
  sumInsuredList: {
    paddingHorizontal: 12,
  },
  
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  
  sumName: {
    fontSize: 16,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: '#343434',
    flex: 1,
    paddingRight: 12,
  },
  
  sumAmount: {
    fontSize: 16,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: '#808080',
    textAlign: 'right',
    minWidth: 160,
  },
  
  // Card Sections (Elite, Platinum, Gold, Silver, Bronze)
  cardSection: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  
  sectionTitle: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    fontWeight: '900',
    marginBottom: 10,
  },
  
  horizList: {
    marginTop: 10,
  },
  
  horizListContent: {
    flexDirection: 'row',
    paddingRight: 24,
  },
  
  // Large Cards (186x107)
  largeCard: {
    width: 186,
    height: 107,
    flexShrink: 0,
  },
  
  largeCardImage: {
    width: 186,
    height: 107,
  },
  
  largeCardImageStyle: {
    borderRadius: 8,
  },
  
  largeCardContent: {
    flex: 1,
    padding: 12,
    paddingTop: 26,
    justifyContent: 'space-between',
  },
  
  largeCardCustomerName: {
    fontSize: 8,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#F2F2F2',
    lineHeight: 9,
  },
  
  largeCardBottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  
  largeCardMemberIdSection: {
    flexDirection: 'column',
  },
  
  largeCardMemberIdLabel: {
    fontSize: 4,
    fontFamily: FontFamily.medium, fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 4,
    letterSpacing: 0.5,
  },
  
  largeCardPolicyNumber: {
    fontSize: 6,
    fontFamily: FontFamily.bold, fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 6,
  },
  
  largeCardCompanyLogo: {
    width: 45,
    height: 35,
  },
  
  addCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  addCardIcon: {
    width: 40,
    height: 40,
  },
});
