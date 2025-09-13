import { z } from "zod";

export const CreateUserProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    profilePic: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phoneNumber: z.string().optional(),
    workEmail: z.string().email("Invalid work email format").optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    managerId: z.number().optional(),
    managerName: z.string().optional(),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
    githubUrl: z.string().url("Invalid GitHub URL").optional(),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
    twitterUrl: z.string().url("Invalid Twitter URL").optional(),
});

export const UpdateUserProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    profilePic: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phoneNumber: z.string().optional(),
    workEmail: z.string().email("Invalid work email format").optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    managerId: z.number().optional(),
    managerName: z.string().optional(),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
    githubUrl: z.string().url("Invalid GitHub URL").optional(),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
    twitterUrl: z.string().url("Invalid Twitter URL").optional(),
});

export const fetchUserProfileSchema = z.object({
    userId: z.number().min(1, "Invalid user ID")
});