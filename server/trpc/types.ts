import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  photoURL: z.string(),
  totalScore: z.number(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileBasicSchema = z.object({
  id: z.string(),
  username: z.string(),
  photoURL: z.string(),
});
export type ProfileBasic = z.infer<typeof ProfileBasicSchema>;
