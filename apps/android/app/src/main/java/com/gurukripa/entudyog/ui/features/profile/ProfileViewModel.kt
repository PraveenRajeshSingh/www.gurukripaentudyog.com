package com.gurukripa.entudyog.ui.features.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gurukripa.entudyog.data.model.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProfileViewModel : ViewModel() {

    private val _profileState = MutableStateFlow(
        UserProfile(
            name = "Praveen Rajesh Singh",
            phone = "9198923230",
            phoneVerified = true,
            email = "info@gurukripaentudyog.com",
            emailVerified = false,
            role = "Retail Customer",
            businessName = "Singh Construction Materials",
            businessType = "General Contractor",
            address = "Jaunpur–Varanasi Highway",
            city = "Jaunpur",
            pincode = "222001",
            preferredLanguage = "English"
        )
    )
    val profileState: StateFlow<UserProfile> = _profileState.asStateFlow()

    fun updateProfile(updated: UserProfile) {
        viewModelScope.launch {
            _profileState.value = updated
        }
    }
}
