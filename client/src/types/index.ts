export interface User {
  id: number;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends AuthFormData {}

export interface LoginFormData extends AuthFormData {}

export interface ForgotPasswordFormData {
  email: string;
}

export interface VerifyOtpFormData {
  email: string;
  otp: string;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export * from './user.types';
export * from './connection.types';