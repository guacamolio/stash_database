import { z } from 'zod';
import { ROLES } from '../permissions.js';

const username = z.string().trim().min(3, 'Lietotājvārds: vismaz 3 simboli').max(30)
  .regex(/^[A-Za-z0-9_.-]+$/, 'Lietotājvārdā drīkst būt tikai burti, cipari, _ . -');
const password = z.string().min(8, 'Parole: vismaz 8 simboli').max(100)
  .regex(/[A-Za-z]/, 'Parolē jābūt vismaz vienam burtam')
  .regex(/\d/, 'Parolē jābūt vismaz vienam ciparam');
const role = z.enum(ROLES, { errorMap: () => ({ message: 'Nederīga loma' }) });

export const createUserSchema = z.object({ username, password, role });
export const updateUserSchema = z.object({ username, role, password: password.optional() });
