// Customer Reviews System
const customerReviews = [
    {
        id: 1,
        name: 'Rajesh Kumar',
        nameHi: 'राजेश कुमार',
        location: 'Jaunpur',
        locationHi: 'जौनपुर',
        rating: 5,
        date: '2024-11-20',
        image: 'assets/resources/img/Naveen_Singh.jpeg',
        review: 'Excellent quality bricks! Used them for my house construction. The bricks are strong, uniform in size, and have a beautiful red color. Delivery was on time and the service was great. Highly recommended!',
        reviewHi: 'उत्कृष्ट गुणवत्ता वाली ईंटें! मैंने अपने घर के निर्माण के लिए इनका उपयोग किया। ईंटें मजबूत हैं, आकार में समान हैं, और एक सुंदर लाल रंग है। डिलीवरी समय पर थी और सेवा बहुत अच्छी थी। अत्यधिक अनुशंसित!',
        verified: true
    },
    {
        id: 2,
        name: 'Priya Sharma',
        nameHi: 'प्रिया शर्मा',
        location: 'Varanasi',
        locationHi: 'वाराणसी',
        rating: 5,
        date: '2024-11-15',
        image: 'assets/resources/img/Vishal_Singh.jpeg',
        review: 'Best brick supplier in the region! The Shiv Eant bricks are of premium quality. They helped me choose the right type for my project. Very professional and reliable service.',
        reviewHi: 'क्षेत्र में सर्वश्रेष्ठ ईंट आपूर्तिकर्ता! शिव ईंट की ईंटें प्रीमियम गुणवत्ता की हैं। उन्होंने मुझे अपनी परियोजना के लिए सही प्रकार चुनने में मदद की। बहुत पेशेवर और विश्वसनीय सेवा।',
        verified: true
    },
    {
        id: 3,
        name: 'Amit Singh',
        nameHi: 'अमित सिंह',
        location: 'Trilochan',
        locationHi: 'त्रिलोचन',
        rating: 5,
        date: '2024-11-10',
        image: 'assets/resources/img/Naveen_Singh.jpeg',
        review: '25+ years of experience shows in their product quality. The bricks are well-burnt, have low water absorption, and perfect for load-bearing walls. Great value for money!',
        reviewHi: '25+ वर्षों का अनुभव उनकी उत्पाद गुणवत्ता में दिखता है। ईंटें अच्छी तरह से जली हुई हैं, कम पानी अवशोषण है, और भार वहन करने वाली दीवारों के लिए परफेक्ट हैं। पैसे का बेहतरीन मूल्य!',
        verified: true
    },
    {
        id: 4,
        name: 'Sunita Devi',
        nameHi: 'सुनीता देवी',
        location: 'Jalalpur',
        locationHi: 'जलालपुर',
        rating: 5,
        date: '2024-11-05',
        image: 'assets/resources/img/Vishal_Singh.jpeg',
        review: 'Very satisfied with the quality and service. The team is knowledgeable and guided us throughout. The bricks arrived in perfect condition. Will definitely order again!',
        reviewHi: 'गुणवत्ता और सेवा से बहुत संतुष्ट। टीम जानकार है और हमारा पूरे समय मार्गदर्शन किया। ईंटें बिल्कुल सही स्थिति में आईं। निश्चित रूप से फिर से ऑर्डर करेंगे!',
        verified: true
    },
    {
        id: 5,
        name: 'Vikram Yadav',
        nameHi: 'विक्रम यादव',
        location: 'Jaunpur',
        locationHi: 'जौनपुर',
        rating: 5,
        date: '2024-10-28',
        image: 'assets/resources/img/Naveen_Singh.jpeg',
        review: 'Top-notch quality bricks! Used for commercial building construction. The machine-made bricks have uniform size which saved us time and money. Excellent customer support!',
        reviewHi: 'शीर्ष गुणवत्ता वाली ईंटें! वाणिज्यिक भवन निर्माण के लिए उपयोग किया गया। मशीन से बनी ईंटों का समान आकार है जिसने हमारा समय और पैसा बचाया। उत्कृष्ट ग्राहक सहायता!',
        verified: true
    },
    {
        id: 6,
        name: 'Anjali Patel',
        nameHi: 'अंजली पटेल',
        location: 'Varanasi',
        locationHi: 'वाराणसी',
        rating: 5,
        date: '2024-10-20',
        image: 'assets/resources/img/Vishal_Singh.jpeg',
        review: 'Gurukripa Bricks is our trusted partner for all construction needs. Their bricks are durable, cost-effective, and meet all quality standards. Highly professional team!',
        reviewHi: 'गुरुकृपा ईंट सभी निर्माण आवश्यकताओं के लिए हमारा विश्वसनीय साथी है। उनकी ईंटें टिकाऊ, लागत प्रभावी हैं, और सभी गुणवत्ता मानकों को पूरा करती हैं। अत्यधिक पेशेवर टीम!',
        verified: true
    }
];

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="ion-ios-star"></i>';
        } else {
            stars += '<i class="ion-ios-star-outline"></i>';
        }
    }
    return stars;
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
    
    customerReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">
                        <img src="${review.image}" alt="${isHindi ? review.nameHi : review.name}" onerror="this.src='assets/resources/img/gurukripaLogo.jpg'">
                    </div>
                    <div class="reviewer-details">
                        <h4>${isHindi ? review.nameHi : review.name}</h4>
                        <p class="reviewer-location">
                            <i class="ion-ios-location"></i> ${isHindi ? review.locationHi : review.location}
                        </p>
                    </div>
                </div>
                ${review.verified ? '<span class="verified-badge"><i class="ion-ios-checkmark-circle"></i> Verified</span>' : ''}
            </div>
            <div class="review-rating">
                ${generateStarRating(review.rating)}
                <span class="rating-number">${review.rating}.0</span>
            </div>
            <div class="review-date">
                <i class="ion-ios-calendar"></i> ${formatReviewDate(review.date)}
            </div>
            <div class="review-content">
                <p>${isHindi ? review.reviewHi : review.review}</p>
            </div>
        `;
        container.appendChild(reviewCard);
    });
}

function formatReviewDate(dateString) {
    const date = new Date(dateString);
    const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
    return date.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getAverageRating() {
    const totalRating = customerReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / customerReviews.length).toFixed(1);
}

function getTotalReviews() {
    return customerReviews.length;
}

// Initialize reviews on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reviewsContainer')) {
        renderReviews();
    }
});

// Make functions globally available
window.renderReviews = renderReviews;
window.getAverageRating = getAverageRating;
window.getTotalReviews = getTotalReviews;

