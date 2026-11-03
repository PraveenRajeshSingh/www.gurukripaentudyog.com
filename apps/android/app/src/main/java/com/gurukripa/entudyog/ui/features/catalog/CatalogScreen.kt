package com.gurukripa.entudyog.ui.features.catalog

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.util.PricingEngine
import com.gurukripa.entudyog.data.model.CartItem
import com.gurukripa.entudyog.data.model.Product
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.data.repository.ProductRepository
import com.gurukripa.entudyog.ui.common.GBAdaptiveDialog
import com.gurukripa.entudyog.ui.common.GBMessageDialog
import com.gurukripa.entudyog.ui.common.GBMessageKind
import kotlinx.coroutines.launch

@Composable
fun CatalogScreen(
    productRepository: ProductRepository,
    cartRepository: CartRepository,
    onNavigateToCart: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val products by productRepository.getProducts().collectAsState(initial = Product.getVerifiedCatalog())
    // Product preview popup + one non-blocking confirmation after the cart write succeeds.
    var detailProduct by remember { mutableStateOf<Product?>(null) }
    var addedProduct by remember { mutableStateOf<String?>(null) }

    fun addToCart(product: Product) {
        coroutineScope.launch {
            cartRepository.addItem(
                CartItem(
                    productId = product.id,
                    productName = product.name,
                    unitPrice = product.price,
                    quantity = 4000
                )
            )
            // Success is announced only after the Room write completed (§4).
            addedProduct = product.name
            detailProduct = null
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Verified Brick Catalog",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "All pricing verified direct ex-bhatta with 5% GST tax invoicing.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        items(products) { product ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = product.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            if (product.nameHi != null) {
                                Text(
                                    text = product.nameHi,
                                    fontSize = 12.sp,
                                    color = BrandTerracotta
                                )
                            }
                        }

                        if (product.badge != null) {
                            Surface(
                                color = BrandTerracotta.copy(alpha = 0.1f),
                                shape = MaterialTheme.shapes.small
                            ) {
                                Text(
                                    text = product.badge,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandTerracotta,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = product.desc,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = PricingEngine.formatINR(product.price) + " / pc",
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp,
                                color = BrandTerracotta
                            )
                            Text(
                                text = PricingEngine.formatINR(product.trolleyPrice) + " (4,000 pcs trolley)",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { detailProduct = product }) {
                                Text("Details", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BrandTerracotta)
                            }
                            Button(
                                onClick = { addToCart(product) },
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                            ) {
                                Text("+ 1 Trolley", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    detailProduct?.let { product ->
        GBAdaptiveDialog(title = product.name, onDismiss = { detailProduct = null }) {
            if (product.nameHi != null) {
                Text(product.nameHi, fontSize = 13.sp, color = BrandTerracotta, fontWeight = FontWeight.Bold)
            }
            product.badge?.let {
                Text(it, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(product.desc, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                "₹${product.price} per piece  •  ₹${product.trolleyPrice} per 4,000-pc trolley",
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                color = BrandTerracotta
            )
            Button(
                onClick = { addToCart(product) },
                colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Add 1 Trolley (4,000 pcs)", fontWeight = FontWeight.Bold)
            }
        }
    }

    addedProduct?.let { name ->
        GBMessageDialog(
            title = "Added to cart",
            message = "$name — one trolley (4,000 pcs) is now in your cart.",
            kind = GBMessageKind.SUCCESS,
            // Keep the previous flow: after the confirmed-add message, land in the cart.
            onDismiss = { addedProduct = null; onNavigateToCart() }
        )
    }
}
