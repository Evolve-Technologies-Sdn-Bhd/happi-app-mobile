/**
 * Navigation Types
 * Defines all navigation routes and their parameters
 */

export type RootStackParamList = {
  // Auth Stack
  Auth: undefined;
  
  // Main App Stack
  Main: undefined;
  
  // Modal screens (overlay tab bar)
  Notification: undefined;
  NotificationDetail: {
    notificationId: string;
    title: string;
    description: string;
    createTime: number;
    notificationType?: string;
  };
  AIChat: undefined;
  MembershipPurchaseList: undefined;
  
  // Modals
  WebView: { url: string; title?: string };
  
  // Voucher (full-screen stack)
  Voucher: { screen?: string } | undefined;

  // Profile (accessed from Home, not a tab)
  Profile: undefined;
};

export type AuthStackParamList = {
  Startup: undefined;
  Onboarding: undefined;
  SignIn: { fromSplash?: boolean } | undefined;
  SignUp: undefined;
  OTP: { phone: string; type: 'signup' | 'reset'; countryCode?: string };
  ResetPassword: { phone: string; countryCode?: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Membership: undefined;
  Products: undefined;
  Service: undefined;
};

export type HomeStackParamList = {
  HomeIndex: undefined;
  ProductList: { categoryId?: string; category?: string };
  ProductDetail: { productId: string };
  ServiceList: undefined;
  ServiceDetail: { serviceId: string };
  NotificationDetail: { notificationId: string };
};

export type MembershipStackParamList = {
  MembershipIndex: undefined;
  MembershipList: undefined;
  MembershipDetail: { membershipId: string };
  MembershipPurchaseConfirm: { membershipId: string; tier?: string; addedNominee?: any };
  MembershipPurchaseSubmit: { membershipId: string; nominees?: any[] };
  MembershipCompletion: { orderId: string };
  // Additional screens for family/vehicles
  PolicyDetail: { policyId: string };
  FamilyMembers: { fromNominee?: boolean; membershipId?: string } | undefined;
  AddEditFamilyMember: { memberId?: string };
  Vehicles: undefined;
  AddEditVehicle: { vehicleId?: string };
  Nominees: undefined;
  AddEditNominee: { nomineeId?: string };
  PurchaseHistory: undefined;
};

export type ProductStackParamList = {
  ProductIndex: { goToPlans?: boolean } | undefined;
  ProductDetail: { productId: string };
  PurchaseDetail: { productId: string; categoryCode: string; companyId: string };
  PurchaseStep1: { productId: string; categoryCode: string; companyId: string };
  PurchaseStep2: { productId: string; categoryCode: string; companyId: string; employmentLocation: number };
  PurchaseStep3: { productId: string; categoryCode: string; companyId: string; employmentLocation: number };
  HomeStep2: { productId: string; categoryCode: string; companyId: string; isDamage: number; damageDetail: string };
  HomeStep3: { productId: string; categoryCode: string; companyId: string; isDamage: number; damageDetail: string; articles: string };
  HomeSelect: { productId: string; categoryCode: string; companyId: string; isDamage: number; damageDetail: string; articles: string };
  HomeStep4: { productId: string; categoryCode: string; companyId: string; isDamage: number; damageDetail: string; articles: string; targetHome: string };
  HomeStep5: { productId: string; categoryCode: string; companyId: string; isDamage: number; damageDetail: string; articles: string; targetHome: string };
  // Travel
  TravelStep2: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families?: string; addedFamily?: string };
  TravelFamilySelect: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families: string };
  TravelStep3: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families: string };
  TravelPlanSelect: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families: string; offers: string; quoteId: string; quoteStartDate: string; quoteEndDate: string; quoteRegionCode: string };
  TravelStep4: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families: string; offers: string; quoteId: string; quoteStartDate: string; quoteEndDate: string; quoteRegionCode: string; planCode: string; quoteData: string };
  TravelStep5: { productId: string; categoryCode: string; companyId: string; tripType: number; coverageType: number; adultCount: number; childCount: number; country: string; zone: string; departDate: string; returnDate: string; addonChecked: boolean; families: string; offers: string; quoteId: string; quoteStartDate: string; quoteEndDate: string; quoteRegionCode: string; planCode: string; quoteData: string };
  InsurancePlans: { tabCode?: number; categoryId?: string };
  PolicyDetail: { policyId: string };
};

export type ServiceStackParamList = {
  ServiceIndex: undefined;
  ServiceDetail: { serviceId: string };
};

export type VoucherStackParamList = {
  VoucherIndex: undefined;
  VoucherMy: undefined;
  VoucherDetail: { voucherItemId: string };
  CoinHistory: undefined;
  VoucherCountdown: {
    voucherItemId: string;
    mode: number;
    voucherCode: string;
    voucherName: string;
    countdownTime: number;
    remainingSeconds: number;
    merchantId?: string;
  };
  VoucherRedeem: { voucherId: string };
  RedeemSuccess: { voucherId: string; voucherItemId: string };
};

export type ProfileStackParamList = {
  ProfileIndex: undefined;
  PersonalInfo: undefined;
  PersonalInfoEdit: undefined;
  EditProfile: undefined;
  FamilyAssets: undefined;
  FamilyList: undefined;
  FamilyEdit: { memberId?: string };
  VehicleList: undefined;
  VehicleEdit: { vehicleId?: string };
  HomeAssetList: undefined;
  HomeAssetEdit: { homeId?: string };
  PrivacySecurity: undefined;
  PasswordSettings: undefined;
  ChangePassword: undefined;
  PinEnter: undefined;
  PinNew: undefined;
  PinConfirm: { newPin: string };
  Support: undefined;
  QRCode: undefined;
  Coins: undefined;
  Referral: undefined;
  About: undefined;
  NotificationSettings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  CallService: undefined;
  OurLocation: undefined;
};

export type PaymentStackParamList = {
  PaymentIndex: { orderId: string; amount: number };
  PaymentSuccess: { orderId: string };
  PaymentFail: { orderId: string; reason?: string };
  AddCard: undefined;
};

// Combine all params for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
