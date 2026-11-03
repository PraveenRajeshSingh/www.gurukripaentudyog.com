import { EstimatorResult } from '../schemas/estimator';

export function calculateWallEstimator(length: number, height: number, thickness = 9, brickPrice = 12): EstimatorResult {
  const area = length * height;
  const bricks = Math.ceil(area * 8.6 * (thickness / 4.5));
  const trolleys = parseFloat((bricks / 4000).toFixed(1));
  const cementBags = Math.ceil(bricks * 0.007);
  const sandCuFt = Math.ceil(bricks * 0.35);
  const estimatedCost = Math.ceil(bricks * brickPrice);

  return {
    bricks,
    trolleys,
    cementBags,
    sandCuFt,
    estimatedCost
  };
}

export function calculateHouseEstimator(builtupArea: number, floors = 1, brickPrice = 7.05): EstimatorResult {
  const bricks = Math.ceil(builtupArea * floors * 18.5);
  const trolleys = parseFloat((bricks / 4000).toFixed(1));
  const cementBags = Math.ceil(bricks * 0.008);
  const sandCuFt = Math.ceil(bricks * 0.4);
  const estimatedCost = Math.ceil(bricks * brickPrice);

  return {
    bricks,
    trolleys,
    cementBags,
    sandCuFt,
    estimatedCost
  };
}

export function calculateBoundaryEstimator(perimeter: number, height = 6, thickness = 4.5, brickPrice = 6.25): EstimatorResult {
  const area = perimeter * height;
  const bricks = Math.ceil(area * 8.6 * (thickness / 4.5));
  const trolleys = parseFloat((bricks / 4000).toFixed(1));
  const cementBags = Math.ceil(bricks * 0.006);
  const sandCuFt = Math.ceil(bricks * 0.3);
  const estimatedCost = Math.ceil(bricks * brickPrice);

  return {
    bricks,
    trolleys,
    cementBags,
    sandCuFt,
    estimatedCost
  };
}
