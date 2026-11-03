package com.gurukripa.entudyog.ui.features.contact

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.ui.common.GBEnquiryDialog
import com.gurukripa.entudyog.ui.common.LocalizedResources
import com.gurukripa.entudyog.ui.common.str

@Composable
fun ContactScreen() {
    val context = LocalContext.current
    // Captured for the imperative WhatsApp onClick (composable scope only).
    val res = LocalizedResources.current
    var showEnquiry by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = str(R.string.contact_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black
        )
        Text(
            text = str(R.string.contact_subtitle),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(str(R.string.contact_bhatta_location), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(str(R.string.kiln_address), fontSize = 13.sp)
                Text(str(R.string.contact_address_note), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                Divider()

                Text(str(R.string.contact_phone_whatsapp), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(str(R.string.phone_number), fontSize = 16.sp, fontWeight = FontWeight.Black, color = BrandTerracotta)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919198923230"))
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.contact_call_kiln))
                    }

                    Button(
                        onClick = {
                            val uri = Uri.parse("https://wa.me/919198923230?text=${Uri.encode(res.getString(R.string.contact_wa_greeting))}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticSuccess),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.action_whatsapp))
                    }
                }

                Divider()

                Text(str(R.string.contact_email_label), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(str(R.string.contact_email), fontSize = 13.sp)

                Divider()

                Text(str(R.string.contact_hours_label), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(str(R.string.contact_hours_value), fontSize = 12.sp)
            }
        }

        // The one form-style popup shared with Home/Catalog — validated, real handoff.
        Button(
            onClick = { showEnquiry = true },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(str(R.string.contact_enquiry_btn), fontWeight = FontWeight.Bold)
        }
    }

    if (showEnquiry) {
        GBEnquiryDialog(
            subject = str(R.string.enquiry_subject_bulk),
            onDismiss = { showEnquiry = false }
        )
    }
}
