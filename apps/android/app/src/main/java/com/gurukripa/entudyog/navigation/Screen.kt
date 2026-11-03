package com.gurukripa.entudyog.navigation

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Gurukripa Bricks")
    object Catalog : Screen("catalog", "Brick Catalog")
    object Estimator : Screen("estimator", "3-in-1 Estimator")
    object Cart : Screen("cart", "Cart & Checkout")
    object Profile : Screen("profile", "Profile")
    object Contact : Screen("contact", "Contact Kiln")
}
