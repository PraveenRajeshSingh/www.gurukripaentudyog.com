import { z } from './zod-lite';

export const ProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  nameHi: z.string().optional(),
  category: z.string(),
  price: z.number().positive(),
  oldPrice: z.number().positive().nullable(),
  unit: z.string().default('per piece'),
  desc: z.string(),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().nonnegative(),
  badge: z.string().nullable(),
  badgeClass: z.string().optional(),
  stock: z.enum(['in-stock', 'low-stock', 'out-of-stock']),
  stockText: z.string(),
  img: z.string(),
  features: z.array(z.string())
});

export type ProductDto = z.infer<typeof ProductSchema>;
