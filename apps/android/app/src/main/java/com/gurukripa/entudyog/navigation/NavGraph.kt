package com.gurukripa.entudyog.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.theme.BrandTerracotta
import com.gurukripa.entudyog.data.repository.CartRepository
import com.gurukripa.entudyog.data.repository.ProductRepository
import com.gurukripa.entudyog.ui.common.LanguageSwitcher
import com.gurukripa.entudyog.ui.common.str
import com.gurukripa.entudyog.ui.features.cart.CartScreen
import com.gurukripa.entudyog.ui.features.catalog.CatalogScreen
import com.gurukripa.entudyog.ui.features.contact.ContactScreen
import com.gurukripa.entudyog.ui.features.estimator.EstimatorScreen
import com.gurukripa.entudyog.ui.features.home.HomeScreen
import com.gurukripa.entudyog.ui.features.profile.ProfileScreen
import com.gurukripa.entudyog.ui.features.profile.ProfileViewModel

data class BottomNavItem(
    val screen: Screen,
    val icon: ImageVector,
    val labelRes: Int
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainNavHost(
    navController: NavHostController,
    productRepository: ProductRepository,
    cartRepository: CartRepository
) {
    val navItems = listOf(
        BottomNavItem(Screen.Home, Icons.Default.Home, R.string.nav_home),
        BottomNavItem(Screen.Catalog, Icons.Default.ShoppingCart, R.string.nav_catalog),
        BottomNavItem(Screen.Estimator, Icons.Default.Build, R.string.nav_estimator),
        BottomNavItem(Screen.Cart, Icons.Default.ShoppingCart, R.string.nav_cart),
        BottomNavItem(Screen.Profile, Icons.Default.Person, R.string.nav_profile),
        BottomNavItem(Screen.Contact, Icons.Default.Call, R.string.nav_contact)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = str(R.string.company_name),
                        style = MaterialTheme.typography.titleMedium
                    )
                },
                actions = {
                    LanguageSwitcher(modifier = Modifier.padding(end = 12.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandTerracotta,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                navItems.forEach { item ->
                    val label = str(item.labelRes)
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = label) },
                        label = { Text(label) },
                        selected = currentRoute == item.screen.route,
                        onClick = {
                            navController.navigate(item.screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToEstimator = { navController.navigate(Screen.Estimator.route) },
                    onNavigateToCatalog = { navController.navigate(Screen.Catalog.route) },
                    onNavigateToContact = { navController.navigate(Screen.Contact.route) }
                )
            }
            composable(Screen.Catalog.route) {
                CatalogScreen(
                    productRepository = productRepository,
                    cartRepository = cartRepository,
                    onNavigateToCart = { navController.navigate(Screen.Cart.route) }
                )
            }
            composable(Screen.Estimator.route) {
                EstimatorScreen(
                    cartRepository = cartRepository,
                    onNavigateToCart = { navController.navigate(Screen.Cart.route) }
                )
            }
            composable(Screen.Cart.route) {
                CartScreen(
                    cartRepository = cartRepository,
                    onNavigateToCatalog = { navController.navigate(Screen.Catalog.route) }
                )
            }
            composable(Screen.Profile.route) {
                val profileViewModel: ProfileViewModel = viewModel()
                ProfileScreen(
                    viewModel = profileViewModel,
                    onNavigateToOrders = { navController.navigate(Screen.Cart.route) },
                    onNavigateToCatalog = { navController.navigate(Screen.Catalog.route) }
                )
            }
            composable(Screen.Contact.route) {
                ContactScreen()
            }
        }
    }
}
