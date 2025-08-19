import { hashPassword } from "../utils/auth";
import  prisma from '../db/db';
import { CreateUser } from "../utils/types";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const CreateUserService = async ({email,password,fullName}: CreateUser) => {
   
    //Check if user already exists
    const isUserExists = await prisma.user.findUnique({
        where:{
            email: email
        }
    });

    if(isUserExists){
        throw new Error("User already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    //configuration for avatar
    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    //Create user in the database
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            profilePic: randomAvatar
        },
        select:{
            id: true,
            email: true,
            fullName: true,
            profilePic: true
        }
    });

    return user;
}


export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - LetsChat',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested to reset your password. Use the following OTP to proceed:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
                </div>
                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};