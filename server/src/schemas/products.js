import { z } from 'zod';
import { PRODUCT_STATUS } from '../labels.js';

export const productSchema = z.object({
  sku: z.string().trim().min(1, 'Ievadiet artikulu').max(40)
    .regex(/^[A-Za-z0-9._-]+$/, 'Artikulā drīkst būt tikai burti, cipari, . _ -'),
  name: z.string().trim().min(1, 'Ievadiet nosaukumu').max(100),
  quantity: z.number({ invalid_type_error: 'Daudzumam jābūt skaitlim' }).int('Daudzumam jābūt veselam skaitlim').min(0, 'Daudzums nevar būt negatīvs').max(1_000_000),
  status: z.enum(PRODUCT_STATUS).default('in_stock'),
});
