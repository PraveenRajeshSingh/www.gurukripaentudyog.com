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
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.core.util.LanguagePrefs
import com.gurukripa.entudyog.core.util.PricingEngine
import com.gurukripa.entudyog.data.model.CartItem
import com.gurukripa.entudyog.data.model.Product
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.data.repository.ProductRepository
import com.gurukripa.entudyog.ui.common.GBAdaptiveDialog
import com.gurukripa.entudyog.ui.common.GBMessageDialog
import com.gurukripa.entudyog.ui.common.GBMessageKind
import com.gurukripa.entudyog.ui.common.str
import com.gurukripa.entudyog.ui.common.strFmt
import kotlinx.coroutines.launch

@Composable
fun CatalogScreen(
    productRepository: ProductRepository,
    cartRepository: CartRepository,
    onNavigateToCart: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val products by productRepository.getProducts().collectAsState(initial = Product.getVerifiedCatalog())
    // Re-render catalog copy whenever the app language changes.
    val hindi = LanguagePrefs.language.value == LanguagePrefs.HI
    // Product preview popup + one non-blocking confirmation after the cart write succeeds.
    var detailProduct by remember { mutableStateOf<Product?>(null) }
    var addedProduct by remember { mutableStateOf<String?>(null) }

    fun addToCart(product: Product) {
        coroutineScope.launch {
            cartRepository.addItem(
                CartItem(
                    productId = product.id,
                    productName = product.displayName(hindi),
                    unitPrice = product.price,
                    quantity = 4000
                )
            )
            // Success is announced only after the Room write completed (§4).
            addedProduct = product.displayName(hindi)
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
                text = str(R.string.cat_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black
            )
            Text(
                text = str(R.string.cat_subtitle),
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
                                text = product.displayName(hindi),
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            // In English mode, show the Hindi name as a friendly subtitle.
                            if (!hindi && product.nameHi != null) {
                                Text(
                                    text = product.nameHi,
                                    fontSize = 12.sp,
                                    color = BrandTerracotta
                                )
                            }
                        }

                        product.displayBadge(hindi)?.let { badge ->
                            Surface(
                                color = BrandTerracotta.copy(alpha = 0.1f),
                                shape = MaterialTheme.shapes.small
                            ) {
                                Text(
                                    text = badge,
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
                        text = product.displayDesc(hindi),
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
                                text = strFmt(R.string.cat_price_per_pc, PricingEngine.formatINR(product.price)),
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp,
                                color = BrandTerracotta
                            )
                            Text(
                                text = strFmt(R.string.cat_trolley_price, PricingEngine.formatINR(product.trolleyPrice)),
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { detailProduct = product }) {
                                Text(str(R.string.action_details), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BrandTerracotta)
                            }
                            Button(
                                onClick = { addToCart(product) },
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta)
                            ) {
                                Text(str(R.string.cat_add_trolley), fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    detailProduct?.let { product ->
        GBAdaptiveDialog(title = product.displayName(hindi), onDismiss = { detailProduct = null }) {
            if (!hindi && product.nameHi != null) {
                Text(product.nameHi, fontSize = 13.sp, color = BrandTerracotta, fontWeight = FontWeight.Bold)
            }
            product.displayBadge(hindi)?.let {
                Text(it, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(product.displayDesc(hindi), fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                strFmt(R.string.cat_detail_price_line, PricingEngine.formatINR(product.price), PricingEngine.formatINR(product.trolleyPrice)),
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                color = BrandTerracotta
            )
            Button(
                onClick = { addToCart(product) },
                colors = ButtonDefaults.buttonColors(containerColor = BrandTerracotta),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(str(R.string.cat_add_trolley_full), fontWeight = FontWeight.Bold)
            }
        }
    }

    addedProduct?.let { name ->
        GBMessageDialog(
            title = str(R.string.cat_added_title),
            message = strFmt(R.string.cat_added_message, name),
            kind = GBMessageKind.SUCCESS,
            // Keep the previous flow: after the confirmed-add message, land in the cart.
            onDismiss = { addedProduct = null; onNavigateToCart() }
        )
    }
}
