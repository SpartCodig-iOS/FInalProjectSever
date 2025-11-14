import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).nullable().optional(),
  avatarURL: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
