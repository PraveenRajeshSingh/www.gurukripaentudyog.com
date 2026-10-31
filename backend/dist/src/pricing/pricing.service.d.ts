import { EstimationParams, EstimationResult } from '../types/domain';
export interface GstTaxCalculation {
    taxableValue: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    grandTotal: number;
}
export declare class PricingEngineService {
    calculateGstFromInclusiveTotal(inclusiveTotal: number): GstTaxCalculation;
    calculateGstFromBase(taxableBase: number): GstTaxCalculation;
    calculateEstimation(params: EstimationParams): EstimationResult;
}
