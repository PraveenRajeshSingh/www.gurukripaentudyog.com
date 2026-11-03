package com.gurukripa.entudyog.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class Product(
    @PrimaryKey val id: Int,
    val name: String,
    val nameHi: String?,
    val category: String,
    val price: Double,
    val oldPrice: Double?,
    val unit: String,
    val desc: String,
    val rating: Double,
    val reviews: Int,
    val badge: String?,
    val stockText: String,
    val imageResName: String
) {
    val trolleyPrice: Double
        get() = price * 4000.0

    companion object {
        fun getVerifiedCatalog(): List<Product> = listOf(
            Product(
                id = 1,
                name = "Shiv Eent Grade-A",
                nameHi = "शिव ईंट ग्रेड-ए",
                category = "shiv-eent",
                price = 12.0,
                oldPrice = 14.0,
                unit = "per piece",
                desc = "Ultra-premium Grade-A brick with double-fired durability. Best for load-bearing walls.",
                rating = 5.0,
                reviews = 89,
                badge = "Best Seller",
                stockText = "In Stock (10k+)",
                imageResName = "brick_product_3"
            ),
            Product(
                id = 7,
                name = "Awwal Bricks (आव्वल ईंट)",
                nameHi = "आव्वल ईंट",
                category = "awwal",
                price = 7.05,
                oldPrice = null,
                unit = "per piece",
                desc = "High-quality Awwal bricks known for strength and durability. Ideal for heavy-duty construction — large buildings, factories and load-bearing walls. ₹28,200 per trolley of 4,000 bricks.",
                rating = 4.9,
                reviews = 78,
                badge = "Heavy Duty",
                stockText = "In Stock",
                imageResName = "brick_product_1"
            ),
            Product(
                id = 8,
                name = "Laal Peti Bricks (लाल पेटी ईंट)",
                nameHi = "लाल पेटी ईंट",
                category = "laal-peti",
                price = 6.25,
                oldPrice = null,
                unit = "per piece",
                desc = "Commonly used for general construction — homes, boundary walls and commercial buildings. Made using natural clay at an affordable price. ₹25,000 per trolley of 4,000 bricks.",
                rating = 4.5,
                reviews = 134,
                badge = "Popular",
                stockText = "In Stock",
                imageResName = "brick_product_2"
            ),
            Product(
                id = 2,
                name = "Premium Red Bricks",
                nameHi = "प्रीमियम लाल ईंट",
                category = "premium",
                price = 10.0,
                oldPrice = null,
                unit = "per piece",
                desc = "Premium quality red clay bricks with high compressive strength, ideal for structural walls.",
                rating = 4.8,
                reviews = 64,
                badge = "Popular",
                stockText = "In Stock",
                imageResName = "brick_product_2"
            ),
            Product(
                id = 3,
                name = "Standard Bricks",
                nameHi = "स्टैंडर्ड ईंट",
                category = "standard",
                price = 8.0,
                oldPrice = null,
                unit = "per piece",
                desc = "Reliable standard bricks for everyday construction. Best value for residential projects.",
                rating = 4.5,
                reviews = 112,
                badge = "Value Pick",
                stockText = "In Stock",
                imageResName = "redbrick1"
            ),
            Product(
                id = 4,
                name = "Machine Made Wirecut",
                nameHi = "मशीन मेड वायरकट",
                category = "machine-made",
                price = 11.0,
                oldPrice = 13.0,
                unit = "per piece",
                desc = "Precision machine-made wirecut bricks with perfect uniform size for modern construction.",
                rating = 4.9,
                reviews = 43,
                badge = "New",
                stockText = "Limited Stock",
                imageResName = "brick_product_1"
            ),
            Product(
                id = 5,
                name = "First Class Red Bricks",
                nameHi = "फर्स्ट क्लास लाल ईंट",
                category = "premium",
                price = 10.0,
                oldPrice = null,
                unit = "per piece",
                desc = "First-class quality bricks that pass all IS standards for residential and commercial use.",
                rating = 4.7,
                reviews = 55,
                badge = null,
                stockText = "In Stock",
                imageResName = "brick_product_3"
            ),
            Product(
                id = 6,
                name = "Standard Hollow Bricks",
                nameHi = "स्टैंडर्ड हॉलो ईंट",
                category = "standard",
                price = 9.0,
                oldPrice = null,
                unit = "per piece",
                desc = "Lightweight hollow bricks for partition walls, offering better thermal and sound insulation.",
                rating = 4.4,
                reviews = 38,
                badge = null,
                stockText = "In Stock",
                imageResName = "brick_product_2"
            )
        )
    }
}
