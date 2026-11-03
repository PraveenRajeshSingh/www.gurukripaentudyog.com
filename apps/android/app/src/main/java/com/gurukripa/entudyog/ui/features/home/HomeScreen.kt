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

@Composable
fun HomeScreen(
    onNavigateToEstimator: () -> Unit,
    onNavigateToCatalog: () -> Unit,
    onNavigateToContact: () -> Unit
) {
    val context = LocalContext.current
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
                    text = "GURUKRIPA ENT UDYOG",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.tertiary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "गुरुकृपा ईंट उद्योग",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Direct kiln bhatta manufacturer of double-fired red clay, Awwal, and machine wirecut bricks on Jaunpur–Varanasi Highway.",
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
                        Text("3-in-1 Estimator", fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = onNavigateToCatalog,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("View Rates", fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimary)
                    }
                }
            }
        }

        // Verified Technical Standards
        Text(
            text = "Verified Manufacturing & Supply Standards",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Trolley Capacity", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                    Text("4,000 Bricks", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Standard tractor load", fontSize = 10.sp)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("GST Invoicing", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                    Text("5% GST", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("2.5% CGST + 2.5% SGST", fontSize = 10.sp)
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
                    text = "Direct Kiln Logistics & Dispatch",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Fleet of 12 trolleys delivering across Jaunpur, Varanasi, Jalalpur, and Trilochan.",
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
                        Text("Call: +91 91989 23230", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val uri = Uri.parse("https://wa.me/919198923230?text=Hello%20Gurukripa%20Ent%20Udyog,%20I%20need%20a%20quote.")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = com.gurukripa.entudyog.core.theme.SemanticSuccess),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("WhatsApp", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
