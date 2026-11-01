import { z } from 'zod';

export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number({ invalid_type_error: 'Daudzumam jābūt skaitlim' }).int().min(1, 'Daudzums vismaz 1').max(100000),
  })).min(1, 'Pievienojiet vismaz vienu preci').max(50)
    .refine((items) => new Set(items.map((i) => i.product_id)).size === items.length, 'Prece nedrīkst atkārtoties'),
});

export const orderStatusSchema = z.object({
  status: z.enum(['processing', 'packed', 'shipped', 'cancelled']),
});
