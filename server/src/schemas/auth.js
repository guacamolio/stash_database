import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Ievadiet lietotājvārdu').max(50),
  password: z.string().min(1, 'Ievadiet paroli').max(200),
});
