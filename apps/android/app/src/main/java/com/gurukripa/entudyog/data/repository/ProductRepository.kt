package com.gurukripa.entudyog.data.repository

import com.gurukripa.entudyog.data.local.ProductDao
import com.gurukripa.entudyog.data.model.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class ProductRepository(
    private val productDao: ProductDao
) {
    fun getProducts(): Flow<List<Product>> {
        return flow {
            // Emit verified catalog directly or from local room database
            emit(Product.getVerifiedCatalog())
        }
    }

    suspend fun getProductById(id: Int): Product? {
        return Product.getVerifiedCatalog().find { it.id == id }
    }
}
