package com.gurukripa.entudyog.ui.features.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.core.theme.BrandDark
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.ui.common.LocalizedResources
import com.gurukripa.entudyog.ui.common.str

@Composable
fun HomeScreen(
    onNavigateToEstimator: () -> Unit,
    onNavigateToCatalog: () -> Unit,
    onNavigateToContact: () -> Unit
) {
    val context = LocalContext.current
    // Captured for the imperative WhatsApp onClick (composable scope only).
    val res = LocalizedResources.current
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = BrandDark)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = str(R.string.home_eyebrow),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.tertiary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = str(R.string.company_name),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = str(R.string.home_tagline),
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onNavigateToEstimator,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.home_cta_estimator), fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = onNavigateToCatalog,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.home_cta_view_rates), fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimary)
                    }
                }
            }
        }

        // Verified Technical Standards
        Text(
            text = str(R.string.home_standards_title),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(str(R.string.home_trolley_capacity), fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                    Text(str(R.string.home_trolley_count), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(str(R.string.home_trolley_note), fontSize = 10.sp)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(str(R.string.home_gst_invoicing), fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                    Text(str(R.string.home_gst_value), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(str(R.string.home_gst_note), fontSize = 10.sp)
                }
            }
        }

        // Direct Action Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = str(R.string.home_logistics_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = str(R.string.home_logistics_desc),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL).apply {
                                data = Uri.parse("tel:+919198923230")
                            }
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.home_call_btn), fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val uri = Uri.parse("https://wa.me/919198923230?text=${Uri.encode(res.getString(R.string.home_wa_greeting))}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = com.gurukripa.entudyog.core.theme.SemanticSuccess),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(str(R.string.action_whatsapp), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
