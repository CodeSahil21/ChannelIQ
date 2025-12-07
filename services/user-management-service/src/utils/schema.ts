import { z } from "zod";

export const CreateUserProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    profilePic: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phoneNumber: z.string().optional(),
    workEmail: z.string().email("Invalid work email format").optional().or(z.literal('').transform(() => undefined)),
    bio: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    managerId: z.number().optional(),
    managerName: z.string().optional(),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
    githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal('')),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
    twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal('')),
});

export const UpdateUserProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required").optional(),
    profilePic: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phoneNumber: z.string().optional(),
    workEmail: z.string().email("Invalid work email format").optional().or(z.literal('').transform(() => undefined)),
    bio: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    managerId: z.number().optional(),
    managerName: z.string().optional(),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
    githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal('')),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
    twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal('')),
});

export const fetchUserProfileSchema = z.object({
    userId: z.number().min(1, "Invalid user ID")
});

export const sendConnectionRequestSchema = z.object({
    receiverId: z.number().int().positive('Receiver ID must be a positive integer'),
    message:z.string().optional()
});

export const connectionIdParamSchema = z.object({
    connectionId: z.string().regex(/^\d+$/, 'Connection ID must be a valid number').transform(Number)
});

export const userIdParamSchema = z.object({
    userId: z.string().regex(/^\d+$/, 'User ID must be a valid number').transform(Number)
});

export const searchUsersSchema = z.object({
    query: z.string().min(1, "Search query is required").max(100, "Query too long"),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional().default(10)
});
