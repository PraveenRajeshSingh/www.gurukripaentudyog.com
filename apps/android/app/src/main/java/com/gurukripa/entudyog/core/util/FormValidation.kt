package com.gurukripa.entudyog.core.util

import androidx.annotation.StringRes
import com.gurukripa.entudyog.R

/**
 * Pure validation rules shared by every popup form.
 * Mirrors the web storefront (backend/src/platform/dto.ts) so the two
 * clients never disagree about what a valid phone/pincode is.
 * Unit-tested in app/src/test/java/com/gurukripa/entudyog/FormValidationTest.kt.
 *
 * Returns localized [R.string] message ids (null = valid) instead of hardcoded
 * English text, so callers resolve the message in the active language.
 */
object FormValidation {

    private val MOBILE_RE = Regex("^[6-9]\\d{9}$")
    private val PINCODE_RE = Regex("^[1-9]\\d{5}$")

    const val MIN_QUANTITY = 500
    const val MAX_QUANTITY = 1_000_000

    @StringRes
    fun validateName(raw: String): Int? {
        val v = raw.trim()
        return when {
            v.isEmpty() -> R.string.err_name_empty
            v.length < 2 -> R.string.err_name_short
            !v.all { it.isLetter() || it == ' ' || it == '.' } -> R.string.err_name_letters
            else -> null
        }
    }

    @StringRes
    fun validateMobile(raw: String): Int? {
        val v = raw.trim().replace(" ", "").replace("-", "").removePrefix("+91")
        return if (MOBILE_RE.matches(v)) null else R.string.err_mobile_invalid
    }

    @StringRes
    fun validatePincode(raw: String): Int? {
        val v = raw.trim()
        return if (v.isEmpty()) R.string.err_pincode_required else
            if (PINCODE_RE.matches(v)) null else R.string.err_pincode_invalid
    }

    /** Blank is allowed (optional); anything present must be a sane bulk quantity. */
    @StringRes
    fun validateQuantity(raw: String, required: Boolean = false): Int? {
        val v = raw.trim()
        if (v.isEmpty()) return if (required) R.string.err_qty_required else null
        val n = v.toIntOrNull() ?: return R.string.err_qty_whole
        return if (n in MIN_QUANTITY..MAX_QUANTITY) null
        else R.string.err_qty_range
    }

    @StringRes
    fun validateMessage(raw: String, required: Boolean = false): Int? {
        val v = raw.trim()
        if (v.isEmpty()) return if (required) R.string.err_msg_required else null
        return if (v.length <= 600) null else R.string.err_msg_long
    }
}
