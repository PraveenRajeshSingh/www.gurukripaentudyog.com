import { Injectable } from '@nestjs/common';
import { EstimationParams, EstimationResult } from '../types/domain';

export interface GstTaxCalculation {
  taxableValue: number;
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  totalTax: number; // 5.0%
  grandTotal: number;
}

@Injectable()
export class PricingEngineService {
  /**
   * Verified Indian GST reverse-tax calculation matching Gurukripa ERP:
   * Total includes 5% GST (CGST 2.5% + SGST 2.5%).
   * baseVal = Math.round(total / 1.05)
   * cgst = Math.round((total - baseVal) / 2)
   * sgst = total - baseVal - cgst
   */
  calculateGstFromInclusiveTotal(inclusiveTotal: number): GstTaxCalculation {
    const total = Math.max(0, inclusiveTotal);
    const taxableValue = Math.round(total / 1.05);
    const totalTax = total - taxableValue;
    const cgst = Math.round(totalTax / 2);
    const sgst = totalTax - cgst;

    return {
      taxableValue,
      cgst,
      sgst,
      totalTax,
      grandTotal: total,
    };
  }

  /**
   * Forward GST calculation from taxable base
   */
  calculateGstFromBase(taxableBase: number): GstTaxCalculation {
    const base = Math.max(0, taxableBase);
    const cgst = Math.round(base * 0.025);
    const sgst = Math.round(base * 0.025);
    const totalTax = cgst + sgst;
    const grandTotal = base + totalTax;

    return {
      taxableValue: base,
      cgst,
      sgst,
      totalTax,
      grandTotal,
    };
  }

  /**
   * 3-in-1 Brick & Material Estimator Studio
   * Mathematical formulas verified against field production tests
   */
  calculateEstimation(params: EstimationParams): EstimationResult {
    const { type, lengthFt = 20, heightFt = 10, thicknessInches = 9, sqft = 1000, floors = 2, unitPrice = 7.05 } = params;

    let bricks = 0;
    let cementBags = 0;
    let sandCuFt = 0;

    if (type === 'wall') {
      const area = lengthFt * heightFt;
      bricks = Math.ceil(area * 8.6 * (thicknessInches / 4.5));
      cementBags = Math.ceil(bricks * 0.007);
      sandCuFt = Math.ceil(bricks * 0.35);
    } else if (type === 'house') {
      bricks = Math.ceil(sqft * floors * 19);
      cementBags = Math.ceil(sqft * floors * 0.4);
      sandCuFt = Math.ceil(sqft * floors * 1.8);
    } else if (type === 'boundary') {
      bricks = Math.ceil(lengthFt * heightFt * 9.5);
      cementBags = Math.ceil(bricks * 0.006);
      sandCuFt = Math.ceil(bricks * 0.3);
    }

    const trolleysCount = Number((bricks / 4000).toFixed(1));
    const totalEstimatedCost = Math.ceil(bricks * unitPrice);

    return {
      bricksNeeded: bricks,
      trolleysCount,
      cementBags,
      sandCuFt,
      totalEstimatedCost,
      breakageMarginPct: 5,
    };
  }
}
