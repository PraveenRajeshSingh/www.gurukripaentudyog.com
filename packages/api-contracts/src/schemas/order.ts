import { z } from './zod-lite';

export const OrderItemSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  total: z.number().positive()
});

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  items: z.array(OrderItemSchema).min(1, 'At least one item required'),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional()
});

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
