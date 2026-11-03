import { z } from './zod-lite';

export const EnquirySchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  brickType: z.string().min(1, 'Please select a brick product'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  deliveryLocation: z.string().min(3, 'Delivery location is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit PIN code').optional().or(z.literal('')),
  message: z.string().max(1000).optional()
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;
