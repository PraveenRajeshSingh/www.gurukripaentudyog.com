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
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.theme.SemanticSuccess
import com.gurukripa.entudyog.core.util.PricingEngine
import com.gurukripa.entudyog.data.model.CartItem
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.ui.common.GBConfirmDialog
import com.gurukripa.entudyog.ui.common.LocalizedResources
import com.gurukripa.entudyog.ui.common.str
import com.gurukripa.entudyog.ui.common.strFmt
import kotlinx.coroutines.launch

@Composable
fun CartScreen(
    cartRepository: CartRepository,
    onNavigateToCatalog: () -> Unit
) {
    val context = LocalContext.current
    // Capture the active-language Resources during composition so the WhatsApp
    // handoff (an imperative onClick) can resolve localized text outside compose.
    val res = LocalizedResources.current
    val coroutineScope = rememberCoroutineScope()
    val cartItems by cartRepository.cartItems.collectAsState(initial = emptyList())

    var couponInput by remember { mutableStateOf("") }
    var appliedCoupon by remember { mutableStateOf<String?>(null) }
    // Store the resource id, not the resolved text, so a mid-session language
    // switch re-renders the message in the new language.
    var couponError by remember { mutableStateOf<Int?>(null) }
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
            text = str(R.string.cart_title),
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
                    Text(str(R.string.cart_empty), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = onNavigateToCatalog,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                    ) {
                        Text(str(R.string.cart_browse))
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
                                    strFmt(R.string.cart_item_line, PricingEngine.formatNumber(item.quantity), "${item.unitPrice}"),
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
                            placeholder = { Text(str(R.string.coupon_placeholder)) },
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
                                    couponError = R.string.coupon_invalid
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                        ) {
                            Text(str(R.string.action_apply))
                        }
                    }
                    couponError?.let {
                        Text(str(it), color = MaterialTheme.colorScheme.error, fontSize = 11.sp)
                    }
                    appliedCoupon?.let {
                        Text(strFmt(R.string.coupon_applied, it), color = SemanticSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
                        Text(str(R.string.lbl_subtotal), fontSize = 12.sp)
                        Text(PricingEngine.formatINR(subtotal), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    if (discount > 0) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(strFmt(R.string.lbl_discount, appliedCoupon.orEmpty()), fontSize = 12.sp, color = SemanticSuccess)
                            Text("-${PricingEngine.formatINR(discount)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SemanticSuccess)
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(str(R.string.lbl_gst), fontSize = 12.sp)
                        Text(PricingEngine.formatINR(gst.totalTax), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(str(R.string.lbl_grand_total), fontSize = 15.sp, fontWeight = FontWeight.Black)
                        Text(PricingEngine.formatINR(gst.grandTotal), fontSize = 18.sp, fontWeight = FontWeight.Black, color = BrandTerracotta)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = {
                            val builder = StringBuilder(res.getString(R.string.cart_wa_intro))
                            builder.append("\n")
                            cartItems.forEachIndexed { i, it ->
                                builder.append(res.getString(R.string.cart_wa_line, i + 1, it.productName, PricingEngine.formatNumber(it.quantity), PricingEngine.formatINR(it.totalCost)))
                                builder.append("\n")
                            }
                            builder.append(res.getString(R.string.cart_wa_total, PricingEngine.formatINR(gst.grandTotal)))
                            builder.append("\n")
                            builder.append(res.getString(R.string.cart_wa_footer))

                            val uri = Uri.parse("https://wa.me/919198923230?text=${Uri.encode(builder.toString())}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticSuccess),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(str(R.string.cart_complete_wa), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    pendingRemove?.let { item ->
        GBConfirmDialog(
            title = str(R.string.cart_remove_title),
            message = strFmt(R.string.cart_remove_message, item.productName, PricingEngine.formatNumber(item.quantity), PricingEngine.formatINR(item.totalCost)),
            confirmLabel = str(R.string.action_remove),
            danger = true,
            onConfirm = {
                coroutineScope.launch { cartRepository.removeItem(item) }
                pendingRemove = null
            },
            onDismiss = { pendingRemove = null }
        )
    }
}
