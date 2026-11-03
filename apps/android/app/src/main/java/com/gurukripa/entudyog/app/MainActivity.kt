package com.gurukripa.entudyog.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import com.gurukripa.entudyog.core.theme.GurukripaTheme
import com.gurukripa.entudyog.data.local.AppDatabase
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.data.repository.ProductRepository
import com.gurukripa.entudyog.navigation.MainNavHost

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val database = AppDatabase.getInstance(applicationContext)
        val productRepository = ProductRepository(database.productDao())
        val cartRepository = CartRepository(database.cartDao())

        setContent {
            GurukripaTheme {
                val navController = rememberNavController()
                MainNavHost(
                    navController = navController,
                    productRepository = productRepository,
                    cartRepository = cartRepository
                )
            }
        }
    }
}
