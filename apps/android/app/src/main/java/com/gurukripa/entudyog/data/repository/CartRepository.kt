package com.gurukripa.entudyog.data.repository

import com.gurukripa.entudyog.data.local.CartDao
import com.gurukripa.entudyog.data.model.CartItem
import kotlinx.coroutines.flow.Flow

class CartRepository(
    private val cartDao: CartDao
) {
    val cartItems: Flow<List<CartItem>> = cartDao.getCartItems()

    suspend fun addItem(item: CartItem) {
        cartDao.insertItem(item)
    }

    suspend fun updateQuantity(item: CartItem, newQty: Int) {
        cartDao.updateItem(item.copy(quantity = newQty))
    }

    suspend fun removeItem(item: CartItem) {
        cartDao.deleteItem(item)
    }

    suspend fun clear() {
        cartDao.clearCart()
    }
}
