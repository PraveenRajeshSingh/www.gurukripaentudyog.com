package com.gurukripa.entudyog

import com.gurukripa.entudyog.core.util.PricingEngine
import org.junit.Assert.assertEquals
import org.junit.Test

class PricingEngineTest {

    @Test
    fun testGstCalculationSplitsIntraStateEqually() {
        // Base: ₹10,000 -> 2.5% CGST (250) + 2.5% SGST (250) = 500 tax, ₹10,500 total
        val breakdown = PricingEngine.calculateGst(10000.0)
        assertEquals(250.0, breakdown.cgst, 0.01)
        assertEquals(250.0, breakdown.sgst, 0.01)
        assertEquals(500.0, breakdown.totalTax, 0.01)
        assertEquals(10500, breakdown.grandTotal)
    }

    @Test
    fun testCouponsCalculation() {
        val subtotal = 1000.0
        assertEquals(100.0, PricingEngine.calculateCouponDiscount("GURU10", subtotal), 0.01)
        assertEquals(50.0, PricingEngine.calculateCouponDiscount("BRICK50", subtotal), 0.01)
        assertEquals(150.0, PricingEngine.calculateCouponDiscount("FIRSTORDER", subtotal), 0.01)
        assertEquals(0.0, PricingEngine.calculateCouponDiscount("INVALID", subtotal), 0.01)
    }
}
