package com.gurukripa.entudyog.ui.features.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.theme.BrandDark
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.core.util.LanguagePrefs
import com.gurukripa.entudyog.data.model.UserProfile
import com.gurukripa.entudyog.ui.common.LanguageSwitcher
import com.gurukripa.entudyog.ui.common.str

/**
 * Map the profile's role value to a localized label. Only the three known
 * business roles are translated; anything unexpected is shown verbatim so we
 * never invent a translation for unknown account data (spec §6).
 */
@Composable
private fun displayRole(role: String): String {
    val id = when (role) {
        "Retail Customer" -> R.string.role_retail
        "Contractor" -> R.string.role_contractor
        "Authorized Dealer" -> R.string.role_dealer
        else -> null
    }
    return id?.let { str(it) } ?: role
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onNavigateToOrders: () -> Unit,
    onNavigateToCatalog: () -> Unit
) {
    val context = LocalContext.current
    val profile by viewModel.profileState.collectAsState()

    var showEditSheet by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Edit form state
    var editName by remember { mutableStateOf(profile.name) }
    var editPhone by remember { mutableStateOf(profile.phone) }
    var editEmail by remember { mutableStateOf(profile.email ?: "") }
    var editBusiness by remember { mutableStateOf(profile.businessName ?: "") }
    var editAddress by remember { mutableStateOf(profile.address) }
    var editCity by remember { mutableStateOf(profile.city) }
    var editPincode by remember { mutableStateOf(profile.pincode) }
    var errorMessage by remember { mutableStateOf<Int?>(null) }

    val initials = profile.name.split(" ")
        .mapNotNull { it.firstOrNull() }
        .take(2)
        .joinToString("")
        .uppercase()
        .ifEmpty { "U" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Profile Header Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(BrandTerracotta),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile.name,
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        )

                        Surface(
                            color = BrandTerracotta.copy(alpha = 0.1f),
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Text(
                                text = displayRole(profile.role),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrandTerracotta,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "+91 ${profile.phone}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            if (profile.phoneVerified) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = str(R.string.profile_verified),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SemanticSuccess
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = {
                        editName = profile.name
                        editPhone = profile.phone
                        editEmail = profile.email ?: ""
                        editBusiness = profile.businessName ?: ""
                        editAddress = profile.address
                        editCity = profile.city
                        editPincode = profile.pincode
                        errorMessage = null
                        showEditSheet = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp) // 48dp touch target
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(str(R.string.profile_edit_btn), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // 2. Personal & Site Delivery Information
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = str(R.string.profile_details_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = BrandDark
                )

                Divider()

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(str(R.string.profile_business_name), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    Text(profile.businessName ?: "—", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(str(R.string.profile_email), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    Text(profile.email ?: "—", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(str(R.string.profile_delivery_address), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    Text(profile.address, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(str(R.string.profile_city_pin), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    Text("${profile.city} - ${profile.pincode}", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(str(R.string.profile_language), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    // Reflect the live app language, not the stale seed value.
                    Text(str(if (LanguagePrefs.isHindi()) R.string.lang_hindi else R.string.lang_english), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // 3. Profile Navigation Menu
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(8.dp)) {
                ListItem(
                    headlineContent = { Text(str(R.string.profile_menu_orders), fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    supportingContent = { Text(str(R.string.profile_menu_orders_sub), fontSize = 11.sp) },
                    leadingContent = { Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = BrandTerracotta) },
                    trailingContent = { Text("→", color = MaterialTheme.colorScheme.outline) },
                    modifier = Modifier.height(56.dp)
                )

                Divider()

                ListItem(
                    headlineContent = { Text(str(R.string.profile_menu_catalog), fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    supportingContent = { Text(str(R.string.profile_menu_catalog_sub), fontSize = 11.sp) },
                    leadingContent = { Icon(Icons.Default.List, contentDescription = null, tint = BrandTerracotta) },
                    trailingContent = { Text("→", color = MaterialTheme.colorScheme.outline) },
                    modifier = Modifier.height(56.dp)
                )

                Divider()

                ListItem(
                    headlineContent = { Text(str(R.string.profile_menu_support), fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    supportingContent = { Text("${str(R.string.phone_number)} ${str(R.string.profile_menu_support_sub)}", fontSize = 11.sp) },
                    leadingContent = { Icon(Icons.Default.Call, contentDescription = null, tint = BrandTerracotta) },
                    trailingContent = { Text("→", color = MaterialTheme.colorScheme.outline) },
                    modifier = Modifier.height(56.dp)
                )

                Divider()

                ListItem(
                    headlineContent = { Text(str(R.string.profile_menu_logout), color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    leadingContent = { Icon(Icons.Default.ExitToApp, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                    modifier = Modifier.height(48.dp)
                )
            }
        }

        // 4. Settings — app language. Switching here drives the whole UI instantly.
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = str(R.string.profile_settings_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = BrandDark
                )
                Divider()
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(str(R.string.profile_app_language), fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    LanguageSwitcher()
                }
            }
        }
    }

    // Edit Profile Modal Bottom Sheet
    if (showEditSheet) {
        ModalBottomSheet(
            onDismissRequest = { showEditSheet = false }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = str(R.string.profile_edit_btn),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                errorMessage?.let {
                    Text(text = str(it), color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }

                OutlinedTextField(
                    value = editName,
                    onValueChange = { editName = it },
                    label = { Text(str(R.string.profile_edit_name)) },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )

                OutlinedTextField(
                    value = editPhone,
                    onValueChange = { editPhone = it },
                    label = { Text(str(R.string.profile_edit_phone)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )

                OutlinedTextField(
                    value = editEmail,
                    onValueChange = { editEmail = it },
                    label = { Text(str(R.string.profile_edit_email)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )

                OutlinedTextField(
                    value = editBusiness,
                    onValueChange = { editBusiness = it },
                    label = { Text(str(R.string.profile_edit_business)) },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )

                OutlinedTextField(
                    value = editAddress,
                    onValueChange = { editAddress = it },
                    label = { Text(str(R.string.profile_edit_address)) },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = editCity,
                        onValueChange = { editCity = it },
                        label = { Text(str(R.string.profile_edit_city)) },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                    )
                    OutlinedTextField(
                        value = editPincode,
                        onValueChange = { editPincode = it },
                        label = { Text(str(R.string.profile_edit_pin)) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        if (editName.trim().length < 2) {
                            errorMessage = R.string.profile_err_name_min
                            return@Button
                        }
                        if (!editPhone.trim().matches(Regex("^[6-9]\\d{9}$"))) {
                            errorMessage = R.string.profile_err_phone
                            return@Button
                        }
                        viewModel.updateProfile(
                            profile.copy(
                                name = editName.trim(),
                                phone = editPhone.trim(),
                                email = editEmail.trim().ifEmpty { null },
                                businessName = editBusiness.trim().ifEmpty { null },
                                address = editAddress.trim(),
                                city = editCity.trim(),
                                pincode = editPincode.trim()
                            )
                        )
                        showEditSheet = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(str(R.string.profile_save), fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(str(R.string.profile_logout_title)) },
            text = { Text(str(R.string.profile_logout_message)) },
            confirmButton = {
                Button(
                    onClick = { showLogoutDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text(str(R.string.profile_logout_confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text(str(R.string.action_cancel))
                }
            }
        )
    }
}
