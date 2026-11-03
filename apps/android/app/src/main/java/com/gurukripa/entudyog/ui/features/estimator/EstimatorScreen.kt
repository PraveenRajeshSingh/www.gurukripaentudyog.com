package com.gurukripa.entudyog.ui.features.estimator

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.core.util.EstimatorEngine
import com.gurukripa.entudyog.core.util.PricingEngine
import com.gurukripa.entudyog.data.model.CartItem
import com.gurukripa.entudyog.data.repository.CartRepository
import kotlinx.coroutines.launch

@Composable
fun EstimatorScreen(
    cartRepository: CartRepository,
    onNavigateToCart: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var selectedTab by remember { mutableStateOf(0) } // 0: Wall, 1: House, 2: Boundary

    // Wall state
    var lengthStr by remember { mutableStateOf("20") }
    var heightStr by remember { mutableStateOf("10") }
    var thicknessInches by remember { mutableStateOf(9.0) }
    var brickPrice by remember { mutableStateOf(12.0) }

    // House state
    var sqftStr by remember { mutableStateOf("1000") }
    var floors by remember { mutableStateOf(1) }

    // Boundary state
    var perimStr by remember { mutableStateOf("150") }

    val length = lengthStr.toDoubleOrNull() ?: 20.0
    val height = heightStr.toDoubleOrNull() ?: 10.0
    val sqft = sqftStr.toDoubleOrNull() ?: 1000.0
    val perim = perimStr.toDoubleOrNull() ?: 150.0

    val result = remember(selectedTab, length, height, thicknessInches, brickPrice, sqft, floors, perim) {
        when (selectedTab) {
            0 -> EstimatorEngine.calculateWall(length, height, thicknessInches, brickPrice)
            1 -> EstimatorEngine.calculateHouse(sqft, floors, 7.05)
            else -> EstimatorEngine.calculateBoundary(perim, 6.0, 4.5, 6.25)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "3-in-1 Estimator Studio",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black
        )
        Text(
            text = "Calculates exact bricks, trolleys (4,000/tr), cement bags and sand volume with 5% breakage allowance.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Tab Selector
        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("Wall", modifier = Modifier.padding(12.dp), fontSize = 13.sp)
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("House", modifier = Modifier.padding(12.dp), fontSize = 13.sp)
            }
            Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }) {
                Text("Boundary", modifier = Modifier.padding(12.dp), fontSize = 13.sp)
            }
        }

        // Inputs
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (selectedTab == 0) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = lengthStr,
                            onValueChange = { lengthStr = it },
                            label = { Text("Length (ft)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = heightStr,
                            onValueChange = { heightStr = it },
                            label = { Text("Height (ft)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                    }
                } else if (selectedTab == 1) {
                    OutlinedTextField(
                        value = sqftStr,
                        onValueChange = { sqftStr = it },
                        label = { Text("Built-up Plot Area (sq. ft)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    OutlinedTextField(
                        value = perimStr,
                        onValueChange = { perimStr = it },
                        label = { Text("Perimeter Length (ft)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // Quantity Results Grid
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Material Breakdown",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Bricks", fontSize = 11.sp)
                            Text(PricingEngine.formatNumber(result.bricks), fontWeight = FontWeight.Black, fontSize = 16.sp, color = BrandTerracotta)
                        }
                    }
                    Card(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Trolleys", fontSize = 11.sp)
                            Text("${result.trolleys} tr", fontWeight = FontWeight.Black, fontSize = 16.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Cement Bags", fontSize = 11.sp)
                            Text("${result.cementBags}", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                    Card(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Sand Volume", fontSize = 11.sp)
                            Text("${result.sandCuFt} cu.ft", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Estimated Budget Box
                Surface(
                    color = BrandTerracotta.copy(alpha = 0.1f),
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("ESTIMATED BRICK BUDGET", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandTerracotta)
                        Text(PricingEngine.formatINR(result.estimatedCost), fontSize = 24.sp, fontWeight = FontWeight.Black, color = BrandTerracotta)
                        Text("Ex-bhatta loading price with 5% breakage allowance", fontSize = 10.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            val msg = "Hello Gurukripa! Please provide an official quote: Bricks required: ${result.bricks} (${result.trolleys} trolleys). Estimated budget: ${PricingEngine.formatINR(result.estimatedCost)}."
                            val uri = Uri.parse("https://wa.me/919198923230?text=${Uri.encode(msg)}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticSuccess),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("WhatsApp Quote", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                cartRepository.addItem(
                                    CartItem(
                                        productId = 1,
                                        productName = if (selectedTab == 0) "Wall Bricks" else if (selectedTab == 1) "House Bricks" else "Boundary Bricks",
                                        unitPrice = brickPrice,
                                        quantity = result.bricks
                                    )
                                )
                                onNavigateToCart()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Add to Cart", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
