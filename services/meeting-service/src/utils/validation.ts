import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime(),
  passwordEnabled: z.boolean().optional().default(false),
  password: z.string().min(4).max(50).optional(),
  inviteExpiresAt: z.string().datetime().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const joinMeetingSchema = z.object({
  inviteToken: z.string().optional(),
  password: z.string().optional(),
}).refine(data => data.inviteToken || data.password, {
  message: "Either inviteToken or password must be provided"
});

export const passwordSchema = z.object({
  password: z.string().min(4).max(50),
});

export const roleChangeSchema = z.object({
  userId: z.number().int().positive(),
});

export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)),
});