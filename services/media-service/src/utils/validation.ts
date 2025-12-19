import { z } from 'zod';

export const deleteProfileImageSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
});

export const deleteGroupProfileImageSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
});