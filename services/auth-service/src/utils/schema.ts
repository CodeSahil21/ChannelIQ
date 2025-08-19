import z from 'zod';

export const CreateUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    fullName: z.string().min(1, "Full name is required"),
});

export const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format")
});

export const VerifyOTPSchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits")
});

export const ResetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
        
});