"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingEngineService = void 0;
const common_1 = require("@nestjs/common");
let PricingEngineService = class PricingEngineService {
    calculateGstFromInclusiveTotal(inclusiveTotal) {
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
    calculateGstFromBase(taxableBase) {
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
    calculateEstimation(params) {
        const { type, lengthFt = 20, heightFt = 10, thicknessInches = 9, sqft = 1000, floors = 2, unitPrice = 7.05 } = params;
        let bricks = 0;
        let cementBags = 0;
        let sandCuFt = 0;
        if (type === 'wall') {
            const area = lengthFt * heightFt;
            bricks = Math.ceil(area * 8.6 * (thicknessInches / 4.5));
            cementBags = Math.ceil(bricks * 0.007);
            sandCuFt = Math.ceil(bricks * 0.35);
        }
        else if (type === 'house') {
            bricks = Math.ceil(sqft * floors * 19);
            cementBags = Math.ceil(sqft * floors * 0.4);
            sandCuFt = Math.ceil(sqft * floors * 1.8);
        }
        else if (type === 'boundary') {
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
};
exports.PricingEngineService = PricingEngineService;
exports.PricingEngineService = PricingEngineService = __decorate([
    (0, common_1.Injectable)()
], PricingEngineService);
//# sourceMappingURL=pricing.service.js.map