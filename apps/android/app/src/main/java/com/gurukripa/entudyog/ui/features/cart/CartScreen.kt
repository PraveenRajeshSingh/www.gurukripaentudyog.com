package com.gurukripa.entudyog.ui.features.cart

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.core.util.PricingEngine
import com.gurukripa.entudyog.data.model.CartItem
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.ui.common.GBConfirmDialog
import kotlinx.coroutines.launch

@Composable
fun CartScreen(
    cartRepository: CartRepository,
    onNavigateToCatalog: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val cartItems by cartRepository.cartItems.collectAsState(initial = emptyList())

    var couponInput by remember { mutableStateOf("") }
    var appliedCoupon by remember { mutableStateOf<String?>(null) }
    var couponError by remember { mutableStateOf<String?>(null) }
    // Destructive-action guard: removing a whole line asks first (§3 of the popup spec).
    var pendingRemove by remember { mutableStateOf<CartItem?>(null) }

    val subtotal = cartItems.sumOf { it.totalCost }
    val discount = PricingEngine.calculateCouponDiscount(appliedCoupon, subtotal)
    val taxable = maxOf(0.0, subtotal - discount)
    val gst = PricingEngine.calculateGst(taxable)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Your Cart & Invoice",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black
        )

        if (cartItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Your cart is empty", fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = onNavigateToCatalog,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                    ) {
                        Text("Browse Bricks")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(cartItems) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.productName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(
                                    "${PricingEngine.formatNumber(item.quantity)} pcs @ ₹${item.unitPrice}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    PricingEngine.formatINR(item.totalCost),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandTerracotta
                                )
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                OutlinedButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            if (item.quantity > 500) {
                                                cartRepository.updateQuantity(item, item.quantity - 500)
                                            } else {
                                                pendingRemove = item
                                            }
                                        }
                                    },
                                    contentPadding = PaddingValues(0.dp),
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Text("-")
                                }

                                Text(
                                    "${item.quantity}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )

                                OutlinedButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            cartRepository.updateQuantity(item, item.quantity + 500)
                                        }
                                    },
                                    contentPadding = PaddingValues(0.dp),
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Text("+")
                                }
                            }
                        }
                    }
                }

                // Coupon code row
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = couponInput,
                            onValueChange = { couponInput = it },
                            placeholder = { Text("Coupon (e.g. GURU10)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = {
                                val c = couponInput.trim().uppercase()
                                if (c == "GURU10" || c == "BRICK50" || c == "FIRSTORDER") {
                                    appliedCoupon = c
                                    couponError = null
                                } else {
                                    couponError = "Invalid coupon code"
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                        ) {
                            Text("Apply")
                        }
                    }
                    if (couponError != null) {
                        Text(couponError!!, color = MaterialTheme.colorScheme.error, fontSize = 11.sp)
                    }
                    if (appliedCoupon != null) {
                        Text("✓ Coupon $appliedCoupon applied!", color = SemanticSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Summary Bottom Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Subtotal", fontSize = 12.sp)
                        Text(PricingEngine.formatINR(subtotal), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    if (discount > 0) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Discount ($appliedCoupon)", fontSize = 12.sp, color = SemanticSuccess)
                            Text("-${PricingEngine.formatINR(discount)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SemanticSuccess)
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("5% GST (CGST 2.5% + SGST 2.5%)", fontSize = 12.sp)
                        Text(PricingEngine.formatINR(gst.totalTax), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Grand Total", fontSize = 15.sp, fontWeight = FontWeight.Black)
                        Text(PricingEngine.formatINR(gst.grandTotal), fontSize = 18.sp, fontWeight = FontWeight.Black, color = BrandTerracotta)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = {
                            var text = "Hello Gurukripa Ent Udyog! I would like to place an order:%0A"
                            cartItems.forEachIndexed { i, it ->
                                text += "${i + 1}. ${it.productName} - ${it.quantity} pcs (${PricingEngine.formatINR(it.totalCost)})%0A"
                            }
                            text += "Grand Total (with 5% GST): ${PricingEngine.formatINR(gst.grandTotal)}%0A"
                            text += "Please confirm trolley dispatch schedule."

                            val uri = Uri.parse("https://wa.me/919198923230?text=${Uri.encode(text)}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticSuccess),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Complete Order via WhatsApp", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    pendingRemove?.let { item ->
        GBConfirmDialog(
            title = "Remove from cart?",
            message = "${item.productName} — ${PricingEngine.formatNumber(item.quantity)} pcs (${PricingEngine.formatINR(item.totalCost)}) will be taken out of this cart.",
            confirmLabel = "Remove",
            danger = true,
            onConfirm = {
                coroutineScope.launch { cartRepository.removeItem(item) }
                pendingRemove = null
            },
            onDismiss = { pendingRemove = null }
        )
    }
}
