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

    // ── Locale-aware accessors (Room schema unchanged: these are transient) ──
    // Technical values (price, 4,000/trolley, codes) are preserved verbatim; only
    // the prose/labels are switched. Unknown data always falls back to English.
    fun displayName(hindi: Boolean): String = if (hindi) (nameHi ?: name) else name
    fun displayDesc(hindi: Boolean): String = if (hindi) (HI_DESC[id] ?: desc) else desc
    fun displayBadge(hindi: Boolean): String? =
        if (hindi) badge?.let { HI_BADGE[it] } ?: badge else badge
    fun displayStock(hindi: Boolean): String =
        if (hindi) HI_STOCK[stockText] ?: stockText else stockText

    companion object {
        // Verified Hindi renderings of the in-code catalog (known business copy).
        private val HI_DESC = mapOf(
            1 to "अल्ट्रा-प्रीमियम ग्रेड-ए ईंट, डबल-फायर्ड मजबूती के साथ। लोड-बियरिंग दीवारों के लिए सर्वोत्तम।",
            7 to "मजबूती और टिकाऊपन के लिए जाने जाने वाली उच्च-गुणवत्ता आव्वल ईंटें। बड़े भवन, फैक्ट्री और लोड-बियरिंग दीवारों के लिए उत्तम — 4,000 ईंट प्रति ट्रॉली ₹28,200।",
            8 to "सामान्य निर्माण — घर, बाउंड्री वाल और व्यावसायिक भवन — के लिए प्रयुक्त। प्राकृतिक मिट्टी से, किफायती कीमत में। 4,000 ईंट प्रति ट्रॉली ₹25,000।",
            2 to "उच्च कम्प्रेसिव स्ट्रेंथ वाली प्रीमियम लाल मिट्टी की ईंटें, संरचनात्मक दीवारों के लिए उत्तम।",
            3 to "रोज़मर्रा के निर्माण के लिए भरोसेमंद स्टैंडर्ड ईंटें। आवासीय परियोजनाओं में सर्वश्रेष्ठ मूल्य।",
            4 to "आधुनिक निर्माण के लिए बिल्कुल समान आकार वाली प्रिसिशन मशीन मेड वायरकट ईंटें।",
            5 to "आवासीय और व्यावसायिक उपयोग के लिए सभी IS मानक पास करने वाली फर्स्ट-क्लास ईंटें।",
            6 to "पार्टीशन वॉल के लिए हल्की हॉलो ईंटें, बेहतर थर्मल व साउंड इन्सुलेशन प्रदान करती हैं।"
        )

        private val HI_BADGE = mapOf(
            "Best Seller" to "सर्वाधिक बिकने वाला",
            "Heavy Duty" to "मजबूत निर्माण",
            "Popular" to "लोकप्रिय",
            "Value Pick" to "बेहतर मूल्य",
            "New" to "नया"
        )

        private val HI_STOCK = mapOf(
            "In Stock" to "स्टॉक में",
            "In Stock (10k+)" to "स्टॉक में (10k+)",
            "Limited Stock" to "सीमित स्टॉक"
        )

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
