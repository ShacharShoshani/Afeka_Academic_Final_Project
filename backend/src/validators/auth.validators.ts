import { z } from 'zod';

const userRoles = ['owner', 'caretaker', 'admin'] as const;
const careTypes = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'] as const;
const availabilities = ['mornings', 'afternoons', 'evenings', 'weekends'] as const;

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  residence: z.string().min(1),
  role: z.enum(userRoles),
  bio: z.string(),
  dateOfBirth: z.string().min(1),
  careTypes: z.array(z.enum(careTypes)),
  availability: z.array(z.enum(availabilities)),
  profilePhoto: z.string().default(''),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
