package com.gurukripa.entudyog

import com.gurukripa.entudyog.core.util.FormValidation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Popup-form validation rules must match the backend DTO regex
 * (backend/src/platform/dto.ts) and the web storefront exactly.
 */
class FormValidationTest {

    @Test
    fun acceptsNormalIndianMobile() {
        assertNull(FormValidation.validateMobile("9876543210"))
        assertNull(FormValidation.validateMobile("+91 98765-43210"))
        assertNull(FormValidation.validateMobile(" 7410987654 "))
    }

    @Test
    fun rejectsInvalidMobile() {
        // Leading digit below 6, wrong length, letters — all rejected.
        assertNotNull(FormValidation.validateMobile("1234567890"))
        assertNotNull(FormValidation.validateMobile("987654321"))
        assertNotNull(FormValidation.validateMobile("987654321a"))
        assertNotNull(FormValidation.validateMobile(""))
    }

    @Test
    fun validatesPincode() {
        assertNull(FormValidation.validatePincode("223101"))
        assertNotNull(FormValidation.validatePincode("023101")) // leading zero
        assertNotNull(FormValidation.validatePincode("22310"))
        assertNotNull(FormValidation.validatePincode(""))       // required
    }

    @Test
    fun quantityIsOptionalButSaneWhenPresent() {
        assertNull(FormValidation.validateQuantity(""))
        assertNull(FormValidation.validateQuantity("4000"))
        assertNotNull(FormValidation.validateQuantity("400", required = true)) // below minimum
        assertNotNull(FormValidation.validateQuantity("12.5"))                 // not whole
        assertNotNull(FormValidation.validateQuantity("2000000"))              // above maximum
        assertNotNull(FormValidation.validateQuantity("", required = true))
    }

    @Test
    fun nameRules() {
        assertNull(FormValidation.validateName("Rakesh Yadav"))
        assertNotNull(FormValidation.validateName(""))
        assertNotNull(FormValidation.validateName("R"))
        assertNotNull(FormValidation.validateName("Site#12"))
    }

    @Test
    fun messageLengthCap() {
        assertNull(FormValidation.validateMessage("Need 2 trolleys by Diwali."))
        assertEquals(600, "अ".repeat(600).length)
        assertNotNull(FormValidation.validateMessage("x".repeat(601)))
    }
}
