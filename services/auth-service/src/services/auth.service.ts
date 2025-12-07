import { hashPassword } from "../utils/auth";
import  prisma from '../db/db';
import { CreateUser } from "../utils/types";
import nodemailer from 'nodemailer';
import {eventPublisher} from '../kafka/publisher'

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const CreateUserService = async ({email,password}: CreateUser): Promise<{ id: number; email: string }> => {
    return await prisma.$transaction(async (tx) => {
        // Check if user exists
        const isUserExists = await tx.user.findUnique({
            where: { email: email }
        });

        if(isUserExists){
            throw new Error("User already exists");
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
            },
            select:{
                id: true,
                email: true,
            }
        });

        // Publish event - if this fails, transaction automatically rolls back
        try {
            await eventPublisher.publishUserRegistered({
                userId: user.id,
                email: user.email,
            });
        } catch (eventError) {
            console.error(`❌ Failed to publish event for ${email}:`, eventError);
            // Just throw - transaction will automatically rollback user creation
            throw new Error("Service temporarily unavailable. Please try again later.");
        }

        console.log(`✅ User registered successfully: ${user.email}`);
        return user;
    });
}


// ...existing code...

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    try {
        const mailOptions = {
            from: {
                name: 'Corporate Chat',
                address: process.env.EMAIL_USER || 'sahil.s39026@gmail.com'
            },
            to: email,
            subject: 'Password Reset OTP - Corporate Chat',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb;">Corporate Chat</h1>
                    </div>
                    <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                        <p style="color: #666; margin-bottom: 20px;">You requested to reset your password. Use the following OTP to proceed:</p>
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                            <h1 style="color: white; font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h1>
                        </div>
                        <p style="color: #e74c3c; font-weight: bold;">⏰ This OTP will expire in 10 minutes.</p>
                        <p style="color: #666; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 14px;">This is an automated email, please do not reply.</p>
                    </div>
                </div>
            `
        };
        
        // Actually send the email
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully:', result.messageId);
        
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

export const deleteUserById = async (userId: number): Promise<void> => {
    await prisma.user.delete({
        where: { id: userId }
    });
};