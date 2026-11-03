package com.gurukripa.entudyog.ui.common

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import com.gurukripa.entudyog.R
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

/**
 * Resolve a validation message id in the active language. The quantity-range
 * string carries two numeric placeholders; every other id is plain text.
 */
@Composable
private fun errorText(@StringRes id: Int): String =
    if (id == R.string.err_qty_range) {
        strFmt(id, FormValidation.MIN_QUANTITY, FormValidation.MAX_QUANTITY)
    } else {
        str(id)
    }

@Composable
fun GBEnquiryDialog(
    subject: String,
    productName: String? = null,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    // Captured for the imperative onSubmit (compose scope only reads the Locale).
    val res = LocalizedResources.current

    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var site by remember { mutableStateOf("") }
    var pincode by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var details by remember { mutableStateOf("") }

    // Store message ids (not resolved text) so a language switch re-renders them.
    var errors by remember { mutableStateOf(mapOf<String, Int?>()) }
    var busy by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<GBMessageKind?>(null) }

    GBFormDialog(
        title = subject,
        primaryLabel = str(R.string.enq_send_wa),
        secondaryLabel = str(R.string.action_cancel),
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
                    appendLine("${res.getString(R.string.company_name)} — $subject")
                    if (productName != null) appendLine(res.getString(R.string.enq_msg_product, productName))
                    appendLine(res.getString(R.string.enq_msg_name, name))
                    appendLine(res.getString(R.string.enq_msg_mobile, mobile))
                    if (site.isNotBlank()) appendLine(res.getString(R.string.enq_msg_site, site))
                    appendLine(res.getString(R.string.enq_msg_pincode, pincode))
                    if (quantity.isNotBlank()) appendLine(res.getString(R.string.enq_msg_quantity, quantity))
                    if (details.isNotBlank()) appendLine(res.getString(R.string.enq_msg_details, details))
                }
                val intent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://wa.me/$SALES_WHATSAPP?text=${Uri.encode(text)}")
                )
                try {
                    context.startActivity(intent)
                    result = GBMessageKind.SUCCESS
                } catch (_: ActivityNotFoundException) {
                    result = GBMessageKind.ERROR
                } finally {
                    busy = false
                }
            }
        },
        onDismiss = onDismiss
    ) {
        Column {
            GBField(
                label = str(R.string.enq_field_name),
                value = name,
                onValueChange = { name = it },
                error = errors["name"]?.let { errorText(it) }
            )
            GBField(
                label = str(R.string.enq_field_mobile),
                value = mobile,
                onValueChange = { mobile = it },
                error = errors["mobile"]?.let { errorText(it) },
                keyboardType = KeyboardType.Phone,
                supportingHint = str(R.string.enq_hint_mobile)
            )
            GBField(
                label = str(R.string.enq_field_site),
                value = site,
                onValueChange = { site = it }
            )
            GBField(
                label = str(R.string.enq_field_pincode),
                value = pincode,
                onValueChange = { pincode = it },
                error = errors["pincode"]?.let { errorText(it) },
                keyboardType = KeyboardType.Number,
                supportingHint = str(R.string.enq_hint_pincode)
            )
            GBField(
                label = str(R.string.enq_field_quantity),
                value = quantity,
                onValueChange = { quantity = it },
                error = errors["quantity"]?.let { errorText(it) },
                keyboardType = KeyboardType.Number,
                supportingHint = str(R.string.enq_hint_quantity)
            )
            GBField(
                label = str(R.string.enq_field_details),
                value = details,
                onValueChange = { details = it },
                error = errors["details"]?.let { errorText(it) },
                singleLine = false
            )
        }
    }

    result?.let { kind ->
        GBMessageDialog(
            title = str(if (kind == GBMessageKind.SUCCESS) R.string.enq_ready_title else R.string.enq_fail_title),
            message = str(if (kind == GBMessageKind.SUCCESS) R.string.enq_success_msg else R.string.enq_fail_msg),
            kind = kind,
            onDismiss = { result = null; onDismiss() }
        )
    }
}
