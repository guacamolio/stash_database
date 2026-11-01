import { z } from 'zod';
import { PRODUCT_STATUS } from '../labels.js';

export const locationSchema = z.object({
  shelf: z.string().trim().toUpperCase().min(1, 'Ievadiet plauktu').max(10).regex(/^[A-Z0-9]+$/, 'Plaukts: tikai burti un cipari'),
  row: z.number({ invalid_type_error: 'Rindai jābūt skaitlim' }).int().min(1).max(99),
  slot: z.number({ invalid_type_error: 'Vietai jābūt skaitlim' }).int().min(1).max(99),
});

export const placementSchema = locationSchema.extend({ product_id: z.number().int().positive() });
export const conditionSchema = z.object({ status: z.enum(PRODUCT_STATUS) });
