/**
 * Sign Up Screen
 * Ported from happi-app-customer/src/views/public/sign-up/index.vue
 * New user registration with Malaysian/Non-Malaysian options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Colors } from '../../../shared/constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { FontFamily } from '../../../shared/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const setGuestMode = useAuthStore((state) => state.setGuestMode);
  
  // Form state
  const [isMalaysian, setIsMalaysian] = useState(true);
  const [fullName, setFullName] = useState('');
  const [nric, setNric] = useState('');
  const [nationality, setNationality] = useState('');
  const [passport, setPassport] = useState('');
  const [workPermit, setWorkPermit] = useState('');
  const [workPermitExpiry, setWorkPermitExpiry] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [countryCode, setCountryCode] = useState('60');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    
    if (isMalaysian && !nric.trim()) {
      Alert.alert('Error', 'Please enter your NRIC');
      return;
    }
    
    if (!isMalaysian) {
      if (!nationality.trim()) {
        Alert.alert('Error', 'Please select your nationality');
        return;
      }
      if (!passport.trim()) {
        Alert.alert('Error', 'Please enter your passport number');
        return;
      }
      if (!workPermit.trim()) {
        Alert.alert('Error', 'Please enter your work permit number');
        return;
      }
      if (!workPermitExpiry) {
        Alert.alert('Error', 'Please select work permit expiry date');
        return;
      }
    }
    
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }
    
    if (!dateOfBirth) {
      Alert.alert('Error', 'Please select your date of birth');
      return;
    }
    
    if (!mobile.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // TODO: Navigate to OTP screen
    Alert.alert('Success', 'OTP sent to your mobile number');
  };

  const handleSkip = () => {
    setGuestMode(true);
  };

  const handleContactUs = () => {
    // TODO: Navigate to contact us screen
    Alert.alert('Contact Us', 'Support feature coming soon');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../assets/images/sign-up-header.png')}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
        resizeMode="cover"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fill in your details below.</Text>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Malaysian / Non-Malaysian Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isMalaysian && styles.toggleButtonActive,
              ]}
              onPress={() => setIsMalaysian(true)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  isMalaysian && styles.toggleButtonTextActive,
                ]}
              >
                Malaysian
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !isMalaysian && styles.toggleButtonActive,
              ]}
              onPress={() => setIsMalaysian(false)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  !isMalaysian && styles.toggleButtonTextActive,
                ]}
              >
                Non-Malaysian
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder=" "
                placeholderTextColor="#808080"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Malaysian Fields */}
          {isMalaysian ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                NRIC <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={nric}
                  onChangeText={setNric}
                  placeholder=" "
                  placeholderTextColor="#808080"
                  maxLength={14}
                />
              </View>
            </View>
          ) : (
            <>
              {/* Nationality */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Nationality <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={nationality}
                    onChangeText={setNationality}
                    placeholder=" "
                    placeholderTextColor="#808080"
                    editable={false}
                  />
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#808080"
                    style={styles.inputIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Passport */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Passport <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={passport}
                    onChangeText={setPassport}
                    placeholder=" "
                    placeholderTextColor="#808080"
                    maxLength={14}
                  />
                </View>
              </View>

              {/* Work Permit No. */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Work Permit No. <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={workPermit}
                    onChangeText={setWorkPermit}
                    placeholder=" "
                    placeholderTextColor="#808080"
                    maxLength={16}
                  />
                </View>
              </View>

              {/* Work Permit Expiry Date */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Work Permit Expiry Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={workPermitExpiry}
                    placeholder=" "
                    placeholderTextColor="#808080"
                    editable={false}
                  />
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#808080"
                    style={styles.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Gender */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={gender}
                placeholder=" "
                placeholderTextColor="#808080"
                editable={false}
              />
              <Ionicons
                name="chevron-down"
                size={20}
                color="#808080"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                placeholder=" "
                placeholderTextColor="#808080"
                editable={false}
              />
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#808080"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Mobile Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Mobile Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <View style={styles.mobileInputContainer}>
                <Text style={styles.countryCode}>+{countryCode}</Text>
                <TextInput
                  style={[styles.input, styles.mobileInput]}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder=" "
                  placeholderTextColor="#808080"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder=" "
                placeholderTextColor="#808080"
                secureTextEntry={!showPassword}
                maxLength={20}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#808080"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder=" "
                placeholderTextColor="#808080"
                secureTextEntry={!showConfirmPassword}
                maxLength={20}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#808080"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Code */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Referral Code</Text>
              <TouchableOpacity>
                <Ionicons name="information-circle-outline" size={20} color="#FDB813" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <View style={styles.referralContainer}>
                <TextInput
                  style={[styles.input, styles.referralInput]}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder=" "
                  placeholderTextColor="#808080"
                  maxLength={20}
                />
                <TouchableOpacity style={styles.qrButton}>
                  <Ionicons name="scan" size={24} color="#FDB813" />
                </TouchableOpacity>
              </View>
              <Text style={styles.charCounter}>{referralCode.length}/20</Text>
            </View>
          </View>

          {/* Sign Up Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Skip Link */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipContainer}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Contact Us */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>Have questions? </Text>
            <TouchableOpacity onPress={handleContactUs}>
              <Text style={styles.contactLink}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  
  header: {
    paddingHorizontal: 12,
    paddingBottom: 26,
    paddingTop: 56,
  },
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    marginLeft: 4,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  
  toggleContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  
  toggleButton: {
    flex: 1,
    height: 46,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  toggleButtonActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  
  toggleButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
  },
  
  toggleButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  
  fieldContainer: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#343434',
    marginBottom: 10,
    marginLeft: 6,
  },
  
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 6,
  },
  
  required: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  
  inputWrapper: {
    position: 'relative',
  },
  
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
  },
  
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
  },
  
  countryCode: {
    fontSize: 17,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#FDB813',
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#DDDDDD',
    paddingRight: 12,
  },
  
  mobileInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    height: 'auto',
  },
  
  passwordInput: {
    paddingRight: 50,
  },
  
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 14,
    padding: 5,
  },
  
  referralContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  
  referralInput: {
    flex: 1,
  },
  
  qrButton: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#FDB813',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  
  charCounter: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 5,
  },
  
  buttonContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  
  signUpButton: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 15,
    width: 250,
    alignItems: 'center',
  },
  
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  
  skipContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  
  skipText: {
    fontSize: 15,
    color: '#FDB813',
    fontFamily: FontFamily.medium,
    fontWeight: '500',
  },
  
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  contactText: {
    fontSize: 15,
    color: '#808080',
  },
  
  contactLink: {
    fontSize: 15,
    color: '#FDB813',
    fontFamily: FontFamily.medium,
    fontWeight: '500',
  },
});
