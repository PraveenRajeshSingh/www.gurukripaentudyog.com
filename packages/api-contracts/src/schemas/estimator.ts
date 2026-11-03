import { z } from './zod-lite';

export const WallEstimatorSchema = z.object({
  length: z.number().positive(),
  height: z.number().positive(),
  thickness: z.number().positive().default(9),
  brickPrice: z.number().positive().default(12)
});

export const HouseEstimatorSchema = z.object({
  builtupArea: z.number().positive(),
  floors: z.number().int().positive().default(1),
  brickPrice: z.number().positive().default(7.05)
});

export const BoundaryEstimatorSchema = z.object({
  perimeter: z.number().positive(),
  height: z.number().positive().default(6),
  thickness: z.number().positive().default(4.5),
  brickPrice: z.number().positive().default(6.25)
});

export const EstimatorResultSchema = z.object({
  bricks: z.number().int().nonnegative(),
  trolleys: z.number().nonnegative(),
  cementBags: z.number().int().nonnegative(),
  sandCuFt: z.number().int().nonnegative(),
  estimatedCost: z.number().nonnegative()
});

export type WallEstimatorInput = z.infer<typeof WallEstimatorSchema>;
export type HouseEstimatorInput = z.infer<typeof HouseEstimatorSchema>;
export type BoundaryEstimatorInput = z.infer<typeof BoundaryEstimatorSchema>;
export type EstimatorResult = z.infer<typeof EstimatorResultSchema>;
