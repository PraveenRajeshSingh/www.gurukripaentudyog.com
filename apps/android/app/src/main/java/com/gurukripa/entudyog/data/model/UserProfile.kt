package com.gurukripa.entudyog.data.model

data class UserProfile(
    val name: String,
    val phone: String,
    val phoneVerified: Boolean = true,
    val email: String? = null,
    val emailVerified: Boolean = false,
    val role: String = "Retail Customer", // "Retail Customer", "Contractor", "Authorized Dealer"
    val businessName: String? = null,
    val businessType: String? = null,
    val address: String = "Jaunpur–Varanasi Highway",
    val city: String = "Jaunpur",
    val pincode: String = "222001",
    val preferredLanguage: String = "English"
)
