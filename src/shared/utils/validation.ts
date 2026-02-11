/**
 * Validation Utilities
 * Common validation functions and Zod schemas
 */

import { z } from 'zod';

// Phone number validation (Malaysian)
export const phoneRegex = /^(?:\+?60)?(?:1[0-46-9]\d{7,8}|[3-9]\d{7})$/;

// IC number validation (Malaysian)
export const icRegex = /^\d{6}-?\d{2}-?\d{4}$/;

// Email validation
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Validation functions
 */
export const validators = {
  isPhone: (value: string): boolean => phoneRegex.test(value.replace(/\D/g, '')),
  isIC: (value: string): boolean => icRegex.test(value),
  isEmail: (value: string): boolean => emailRegex.test(value),
  isPassword: (value: string): boolean => passwordRegex.test(value),
  isNotEmpty: (value: string): boolean => value.trim().length > 0,
  minLength: (value: string, min: number): boolean => value.length >= min,
  maxLength: (value: string, max: number): boolean => value.length <= max,
};

/**
 * Zod Schemas for form validation
 */

// Phone number schema
export const phoneSchema = z
  .string()
  .min(9, 'Phone number is too short')
  .max(15, 'Phone number is too long')
  .regex(phoneRegex, 'Invalid phone number format');

// Email schema
export const emailSchema = z
  .string()
  .email('Invalid email address');

// Password schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// IC number schema
export const icSchema = z
  .string()
  .length(12, 'IC number must be 12 digits')
  .regex(/^\d+$/, 'IC number must contain only numbers');

// Name schema
export const nameSchema = z
  .string()
  .min(2, 'Name is too short')
  .max(100, 'Name is too long');

// Login form schema
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register form schema
export const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// OTP schema
export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional(),
  icNumber: icSchema.optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

// Alias for profile schema
export const profileSchema = profileUpdateSchema;

// Family member schema
export const familyMemberSchema = z.object({
  name: nameSchema,
  relationship: z.string().min(1, 'Relationship is required'),
  icNumber: icSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().optional(),
});

// Vehicle schema
export const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type FamilyMemberFormData = z.infer<typeof familyMemberSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;
