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
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.ui.common.GBEnquiryDialog

@Composable
fun ContactScreen() {
    val context = LocalContext.current
    var showEnquiry by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Contact Gurukripa Ent Udyog",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black
        )
        Text(
            text = "Direct connection to kiln sales desk and tractor trolley logistics.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Bhatta Location", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Jaunpur–Varanasi Highway, Uttar Pradesh, India", fontSize = 13.sp)
                Text("Convenient off-highway turning for tractor trolleys and multi-axle trucks.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                Divider()

                Text("Telephone & WhatsApp", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("+91 91989 23230", fontSize = 16.sp, fontWeight = FontWeight.Black, color = BrandTerracotta)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919198923230"))
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Call Kiln")
                    }

                    Button(
                        onClick = {
                            val uri = Uri.parse("https://wa.me/919198923230?text=Hello%20Gurukripa%20Ent%20Udyog!")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticSuccess),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("WhatsApp")
                    }
                }

                Divider()

                Text("Official Email", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("info@gurukripaentudyog.com", fontSize = 13.sp)

                Divider()

                Text("Operating Hours", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Monday – Saturday: 8:00 AM – 6:00 PM\nSunday: Advance scheduled dispatches only", fontSize = 12.sp)
            }
        }

        // The one form-style popup shared with Home/Catalog — validated, real handoff.
        Button(
            onClick = { showEnquiry = true },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Send Enquiry / Request Quotation", fontWeight = FontWeight.Bold)
        }
    }

    if (showEnquiry) {
        GBEnquiryDialog(
            subject = "Bulk Project Quotation",
            onDismiss = { showEnquiry = false }
        )
    }
}
