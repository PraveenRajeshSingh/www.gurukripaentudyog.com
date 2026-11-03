package com.gurukripa.entudyog.core.util

/**
 * Pure validation rules shared by every popup form.
 * Mirrors the web storefront (backend/src/platform/dto.ts) so the two
 * clients never disagree about what a valid phone/pincode is.
 * Unit-tested in app/src/test/java/com/gurukripa/entudyog/FormValidationTest.kt.
 */
object FormValidation {

    private val MOBILE_RE = Regex("^[6-9]\\d{9}$")
    private val PINCODE_RE = Regex("^[1-9]\\d{5}$")

    const val MIN_QUANTITY = 500
    const val MAX_QUANTITY = 1_000_000

    fun validateName(raw: String): String? {
        val v = raw.trim()
        return when {
            v.isEmpty() -> "Please enter your name."
            v.length < 2 -> "Name looks too short."
            !v.all { it.isLetter() || it == ' ' || it == '.' } -> "Name should contain letters only."
            else -> null
        }
    }

    fun validateMobile(raw: String): String? {
        val v = raw.trim().replace(" ", "").replace("-", "").removePrefix("+91")
        return if (MOBILE_RE.matches(v)) null else "Enter a valid 10-digit Indian mobile number."
    }

    fun validatePincode(raw: String): String? {
        val v = raw.trim()
        return if (v.isEmpty()) "Delivery pincode is required." else
            if (PINCODE_RE.matches(v)) null else "Pincode must be 6 digits (e.g. 223101)."
    }

    /** Blank is allowed (optional); anything present must be a sane bulk quantity. */
    fun validateQuantity(raw: String, required: Boolean = false): String? {
        val v = raw.trim()
        if (v.isEmpty()) return if (required) "Quantity is required." else null
        val n = v.toIntOrNull() ?: return "Quantity must be a whole number of bricks."
        return if (n in MIN_QUANTITY..MAX_QUANTITY) null
        else "Quantity must be between $MIN_QUANTITY and $MAX_QUANTITY pcs."
    }

    fun validateMessage(raw: String, required: Boolean = false): String? {
        val v = raw.trim()
        if (v.isEmpty()) return if (required) "Please describe your requirement." else null
        return if (v.length <= 600) null else "Please keep it under 600 characters."
    }
}
