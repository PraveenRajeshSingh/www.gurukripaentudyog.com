package com.gurukripa.entudyog.core.util

import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToInt

data class GstBreakdown(
    val taxableAmount: Double,
    val cgst: Double,
    val sgst: Double,
    val totalTax: Double,
    val grandTotal: Int
)

object PricingEngine {

    /**
     * 5% GST Calculation for Intra-State (Uttar Pradesh) construction brick supplies:
     * CGST: 2.5%, SGST: 2.5%
     */
    fun calculateGst(taxableAmount: Double): GstBreakdown {
        val cgst = Math.round(taxableAmount * 0.025 * 100.0) / 100.0
        val sgst = Math.round(taxableAmount * 0.025 * 100.0) / 100.0
        val totalTax = Math.round((cgst + sgst) * 100.0) / 100.0
        val grandTotal = (taxableAmount + totalTax).roundToInt()

        return GstBreakdown(
            taxableAmount = taxableAmount,
            cgst = cgst,
            sgst = sgst,
            totalTax = totalTax,
            grandTotal = grandTotal
        )
    }

    /**
     * Verified coupon calculation:
     * GURU10: 10% off
     * BRICK50: ₹50 flat off
     * FIRSTORDER: 15% off
     */
    fun calculateCouponDiscount(couponCode: String?, subtotal: Double): Double {
        if (couponCode.isNullOrBlank()) return 0.0
        return when (couponCode.trim().uppercase()) {
            "GURU10" -> (subtotal * 0.10).roundToInt().toDouble()
            "BRICK50" -> minOf(50.0, subtotal)
            "FIRSTORDER" -> (subtotal * 0.15).roundToInt().toDouble()
            else -> 0.0
        }
    }

    /**
     * Format Indian Rupee currency: e.g. ₹28,200
     */
    fun formatINR(amount: Number): String {
        val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        formatter.maximumFractionDigits = 0
        return formatter.format(amount)
    }

    fun formatNumber(amount: Number): String {
        val formatter = NumberFormat.getNumberInstance(Locale("en", "IN"))
        return formatter.format(amount)
    }
}
