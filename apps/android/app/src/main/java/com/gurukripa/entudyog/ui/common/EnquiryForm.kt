package com.gurukripa.entudyog.ui.common

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import com.gurukripa.entudyog.core.util.FormValidation

/**
 * Enquiry / request-a-quotation popup shared by Home, Catalog and Contact.
 *
 * Submitting composes a verified enquiry message and hands it to the kiln
 * sales desk over WhatsApp — the same real channel the app already uses to
 * complete orders. Nothing is "sent" unless the handoff actually starts
 * (spec §4: success only after the operation really happens), and there is
 * no fake in-app confirmation. When the platform API host is configured,
 * this same form gains an HTTP submit path without touching callers.
 */
private const val SALES_WHATSAPP = "919198923230"

@Composable
fun GBEnquiryDialog(
    subject: String,
    productName: String? = null,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var site by remember { mutableStateOf("") }
    var pincode by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var details by remember { mutableStateOf("") }

    var errors by remember { mutableStateOf(mapOf<String, String?>()) }
    var busy by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<Pair<GBMessageKind, String>?>(null) }

    GBFormDialog(
        title = subject,
        primaryLabel = "Send via WhatsApp",
        secondaryLabel = "Cancel",
        busy = busy,
        onSubmit = {
            val errs = mapOf(
                "name" to FormValidation.validateName(name),
                "mobile" to FormValidation.validateMobile(mobile),
                "pincode" to FormValidation.validatePincode(pincode),
                "quantity" to FormValidation.validateQuantity(quantity),
                "details" to FormValidation.validateMessage(details)
            )
            errors = errs.filterValues { it != null }
            if (errors.isNotEmpty()) {
                // Keep the dialog open; the first error names itself inline under its field.
            } else {
                busy = true
                val text = buildString {
                    appendLine("Gurukripa Ent Udyog — $subject")
                    if (productName != null) appendLine("Product: $productName")
                    appendLine("Name: $name")
                    appendLine("Mobile: $mobile")
                    if (site.isNotBlank()) appendLine("Site / address: $site")
                    appendLine("Delivery pincode: $pincode")
                    if (quantity.isNotBlank()) appendLine("Quantity: $quantity pcs")
                    if (details.isNotBlank()) appendLine("Details: $details")
                }
                val intent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://wa.me/$SALES_WHATSAPP?text=${Uri.encode(text)}")
                )
                try {
                    context.startActivity(intent)
                    result = GBMessageKind.SUCCESS to
                        "Your enquiry was prepared and handed to WhatsApp. Press send there to reach the kiln desk."
                } catch (_: ActivityNotFoundException) {
                    result = GBMessageKind.ERROR to
                        "WhatsApp is not installed on this device. Call +91 91989 23230 instead."
                } finally {
                    busy = false
                }
            }
        },
        onDismiss = onDismiss
    ) {
        Column {
            GBField(
                label = "Your name",
                value = name,
                onValueChange = { name = it },
                error = errors["name"]
            )
            GBField(
                label = "Mobile number",
                value = mobile,
                onValueChange = { mobile = it },
                error = errors["mobile"],
                keyboardType = KeyboardType.Phone,
                supportingHint = "10 digits — we call or WhatsApp back on this number."
            )
            GBField(
                label = "Construction site / village (optional)",
                value = site,
                onValueChange = { site = it }
            )
            GBField(
                label = "Delivery pincode",
                value = pincode,
                onValueChange = { pincode = it },
                error = errors["pincode"],
                keyboardType = KeyboardType.Number,
                supportingHint = "Trolley delivery is confirmed against this pincode."
            )
            GBField(
                label = "Quantity in pcs (optional)",
                value = quantity,
                onValueChange = { quantity = it },
                error = errors["quantity"],
                keyboardType = KeyboardType.Number,
                supportingHint = "One tractor trolley ≈ 4,000 pcs."
            )
            GBField(
                label = "Anything specific? (optional)",
                value = details,
                onValueChange = { details = it },
                error = errors["details"],
                singleLine = false
            )
        }
    }

    result?.let { (kind, message) ->
        GBMessageDialog(
            title = if (kind == GBMessageKind.SUCCESS) "Enquiry ready to send" else "Could not open WhatsApp",
            message = message,
            kind = kind,
            onDismiss = { result = null; onDismiss() }
        )
    }
}
