package com.gurukripa.entudyog.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.gurukripa.entudyog.data.model.CartItem
import kotlinx.coroutines.flow.Flow

@Dao
interface CartDao {
    @Query("SELECT * FROM cart_items ORDER BY id DESC")
    fun getCartItems(): Flow<List<CartItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: CartItem)

    @Update
    suspend fun updateItem(item: CartItem)

    @Delete
    suspend fun deleteItem(item: CartItem)

    @Query("DELETE FROM cart_items")
    suspend fun clearCart()
}
