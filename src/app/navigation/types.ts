/**
 * Navigation Types
 * Defines all navigation routes and their parameters
 */

export type RootStackParamList = {
  // Auth Stack
  Auth: undefined;
  
  // Main App Stack
  Main: undefined;
  
  // Modals
  WebView: { url: string; title?: string };
};

export type AuthStackParamList = {
  Startup: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OTP: { phone: string; type: 'signup' | 'reset' };
  ResetPassword: { phone: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Membership: undefined;
  Products: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeIndex: undefined;
  ProductList: { categoryId?: string; category?: string };
  ProductDetail: { productId: string };
  ServiceList: undefined;
  ServiceDetail: { serviceId: string };
  Notification: undefined;
  NotificationDetail: { notificationId: string };
  AIChat: undefined;
};

export type MembershipStackParamList = {
  MembershipIndex: undefined;
  MembershipList: undefined;
  MembershipDetail: { membershipId: string };
  MembershipPurchaseList: undefined;
  MembershipPurchaseConfirm: { membershipId: string; tier?: string };
  MembershipPurchaseSubmit: { orderId: string };
  MembershipCompletion: { orderId: string };
  // Additional screens for family/vehicles
  PolicyDetail: { policyId: string };
  FamilyMembers: undefined;
  AddEditFamilyMember: { memberId?: string };
  Vehicles: undefined;
  AddEditVehicle: { vehicleId?: string };
  Nominees: undefined;
  AddEditNominee: { nomineeId?: string };
  PurchaseHistory: undefined;
};

export type ProductStackParamList = {
  ProductIndex: undefined;
  ProductDetail: { productId: string };
};

export type VoucherStackParamList = {
  VoucherIndex: undefined;
  VoucherList: undefined;
  VoucherDetail: { voucherId: string };
  VoucherMy: undefined;
  VoucherRedeem: { voucherId: string };
  VoucherUse: { voucherId: string };
  RedeemVoucher: undefined;
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
  ChangePassword: undefined;
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
