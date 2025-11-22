// Enhanced AI Chatbot with Product Information and ChatGPT Integration
(function() {
    'use strict';
    
    // Configuration - Replace with your OpenAI API key
    // To enable ChatGPT integration:
    // 1. Get your API key from https://platform.openai.com/api-keys
    // 2. Replace 'YOUR_OPENAI_API_KEY_HERE' below with your actual API key
    // 3. The chatbot will work without API key using intelligent fallback responses
    const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // Add your OpenAI API key here
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    
    // Product information for quick responses
    const productInfo = {
        shiv: {
            name: 'Shiv Eant',
            nameHi: 'शिव ईंट',
            price: 10,
            description: 'Premium quality Shiv Eant bricks with superior strength and durability. Perfect for all construction needs.',
            descriptionHi: 'उत्कृष्ट शक्ति और स्थायित्व के साथ प्रीमियम गुणवत्ता वाली शिव ईंटें। सभी निर्माण आवश्यकताओं के लिए परफेक्ट।',
            rating: 4.9,
            category: 'shiv',
            inStock: true
        }
    };
    
    // Company information
    const companyInfo = {
        name: 'Gurukripa Bricks',
        nameHi: 'गुरुकृपा ईंट उद्योग',
        phone: '+91 9198923230',
        email: 'info@gurukripabricks.in',
        address: 'गुरुकृपा ईंट उद्योग - नेवादा, जलालपुर-चावरी रोड, जलालपुर, जौनपुर (उ.प्र.)',
        cities: ['Jaunpur', 'Varanasi', 'Trilochan', 'Jalalpur'],
        experience: '25+ years',
        customers: '23000+'
    };
    
    // Get current language
    function getCurrentLanguage() {
        return localStorage.getItem('language') || 'hi';
    }
    
    // Get translation
    function getTranslation(key) {
        if (typeof window.getTranslation === 'function') {
            return window.getTranslation(key);
        }
        return key;
    }
    
    // Detect intent from user message
    function detectIntent(message) {
        const msg = message.toLowerCase();
        const isHindi = getCurrentLanguage() === 'hi';
        
        // Price queries
        if (msg.includes('price') || msg.includes('कीमत') || msg.includes('मूल्य') || msg.includes('दाम')) {
            return 'price';
        }
        
        // Product information
        if (msg.includes('product') || msg.includes('उत्पाद') || msg.includes('ईंट') || msg.includes('brick')) {
            return 'product';
        }
        
        // Contact information
        if (msg.includes('contact') || msg.includes('phone') || msg.includes('mobile') || msg.includes('संपर्क') || msg.includes('फोन') || msg.includes('नंबर')) {
            return 'contact';
        }
        
        // Address/Location
        if (msg.includes('address') || msg.includes('location') || msg.includes('पता') || msg.includes('स्थान') || msg.includes('कहाँ')) {
            return 'address';
        }
        
        // Delivery
        if (msg.includes('delivery') || msg.includes('deliver') || msg.includes('डिलीवरी') || msg.includes('पहुंच')) {
            return 'delivery';
        }
        
        // Order
        if (msg.includes('order') || msg.includes('buy') || msg.includes('purchase') || msg.includes('ऑर्डर') || msg.includes('खरीद') || msg.includes('मंगवा')) {
            return 'order';
        }
        
        // General greeting
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('नमस्ते') || msg.includes('नमस्कार')) {
            return 'greeting';
        }
        
        return 'general';
    }
    
    // Get quick response based on intent
    function getQuickResponse(intent, message) {
        const isHindi = getCurrentLanguage() === 'hi';
        const product = productInfo.shiv;
        
        switch(intent) {
            case 'price':
                if (isHindi) {
                    return `शिव ईंट की कीमत ₹${product.price} प्रति पीस है। यह उच्च गुणवत्ता वाली ईंट है जो सभी निर्माण कार्यों के लिए उपयुक्त है। अधिक जानकारी के लिए हमें ${companyInfo.phone} पर कॉल करें।`;
                } else {
                    return `The price of Shiv Eant is ₹${product.price} per piece. It's a high-quality brick suitable for all construction needs. For more information, please call us at ${companyInfo.phone}.`;
                }
                
            case 'product':
                if (isHindi) {
                    return `${product.nameHi} - ${product.descriptionHi}\n\nकीमत: ₹${product.price}/पीस\nरेटिंग: ${product.rating}/5\n\nयह उच्च गुणवत्ता वाली ईंट है जो सभी निर्माण आवश्यकताओं के लिए परफेक्ट है।`;
                } else {
                    return `${product.name} - ${product.description}\n\nPrice: ₹${product.price}/piece\nRating: ${product.rating}/5\n\nThis is a high-quality brick perfect for all construction needs.`;
                }
                
            case 'contact':
                if (isHindi) {
                    return `संपर्क जानकारी:\n📞 फोन: ${companyInfo.phone}\n📧 ईमेल: ${companyInfo.email}\n\nहमसे संपर्क करने के लिए आप हमें कॉल कर सकते हैं या WhatsApp पर मैसेज भेज सकते हैं।`;
                } else {
                    return `Contact Information:\n📞 Phone: ${companyInfo.phone}\n📧 Email: ${companyInfo.email}\n\nYou can call us or send a WhatsApp message to contact us.`;
                }
                
            case 'address':
                if (isHindi) {
                    return `हमारा पता:\n${companyInfo.address}\n\nहम जौनपुर, वाराणसी, त्रिलोचन और जलालपुर में सेवा प्रदान करते हैं।`;
                } else {
                    return `Our Address:\n${companyInfo.address}\n\nWe serve in Jaunpur, Varanasi, Trilochan, and Jalalpur.`;
                }
                
            case 'delivery':
                if (isHindi) {
                    return `हम जौनपुर जिले के भीतर एक दिन में डिलीवरी प्रदान करते हैं। अन्य शहरों के लिए, कृपया हमसे ${companyInfo.phone} पर संपर्क करें।`;
                } else {
                    return `We provide same-day delivery within Jaunpur district. For other cities, please contact us at ${companyInfo.phone}.`;
                }
                
            case 'order':
                if (isHindi) {
                    return `ऑर्डर करने के लिए:\n1. वेबसाइट पर उत्पाद को कार्ट में जोड़ें\n2. चेकआउट करें\n3. या सीधे हमें ${companyInfo.phone} पर कॉल करें\n\nहमारी ईंटें उच्च गुणवत्ता वाली हैं और ${companyInfo.experience} का अनुभव है।`;
                } else {
                    return `To place an order:\n1. Add product to cart on website\n2. Proceed to checkout\n3. Or call us directly at ${companyInfo.phone}\n\nOur bricks are high quality with ${companyInfo.experience} of experience.`;
                }
                
            case 'greeting':
                if (isHindi) {
                    return `नमस्ते! मैं गुरुकृपा ईंट उद्योग का AI सहायक हूं। मैं आपकी कैसे मदद कर सकता हूं? आप हमारे उत्पादों, कीमतों, या किसी भी अन्य जानकारी के बारे में पूछ सकते हैं।`;
                } else {
                    return `Hello! I'm the AI assistant for Gurukripa Bricks. How can I help you? You can ask about our products, prices, or any other information.`;
                }
                
            default:
                return null; // Will use ChatGPT for general queries
        }
    }
    
    // Call ChatGPT API
    async function callChatGPT(message, conversationHistory = []) {
        // If no API key is set, return null to use fallback
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
            return null;
        }
        
        try {
            const isHindi = getCurrentLanguage() === 'hi';
            const systemPrompt = isHindi ? 
                `आप गुरुकृपा ईंट उद्योग का AI सहायक हैं। आप ईंट निर्माण, निर्माण सामग्री, और कंपनी के बारे में जानकारी प्रदान करते हैं। कंपनी की जानकारी:
- नाम: ${companyInfo.nameHi}
- फोन: ${companyInfo.phone}
- अनुभव: ${companyInfo.experience}
- ग्राहक: ${companyInfo.customers}
- उत्पाद: ${productInfo.shiv.nameHi} - ₹${productInfo.shiv.price}/पीस
संक्षिप्त और मददगार उत्तर दें।` :
                `You are an AI assistant for ${companyInfo.name}. You provide information about brick manufacturing, construction materials, and the company. Company info:
- Name: ${companyInfo.name}
- Phone: ${companyInfo.phone}
- Experience: ${companyInfo.experience}
- Customers: ${companyInfo.customers}
- Product: ${productInfo.shiv.name} - ₹${productInfo.shiv.price}/piece
Provide brief and helpful answers.`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: message }
            ];
            
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 200,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            return null;
        }
    }
    
    // Get fallback response when ChatGPT is not available
    function getFallbackResponse(message) {
        const isHindi = getCurrentLanguage() === 'hi';
        const fallbackResponses = isHindi ? [
            'धन्यवाद! हमारी ईंटों के बारे में अधिक जानकारी के लिए कृपया हमें ' + companyInfo.phone + ' पर कॉल करें।',
            'हमारी ईंटें उच्च गुणवत्ता वाली हैं और ' + companyInfo.experience + ' का अनुभव है।',
            'हम ' + companyInfo.cities.join(', ') + ' में सेवा प्रदान करते हैं।',
            'शिव ईंट की कीमत ₹' + productInfo.shiv.price + ' प्रति पीस है। अधिक जानकारी के लिए हमसे संपर्क करें।',
            'कृपया हमारी वेबसाइट देखें या सीधे हमसे ' + companyInfo.phone + ' पर संपर्क करें।'
        ] : [
            'Thank you! For more information about our bricks, please call us at ' + companyInfo.phone + '.',
            'Our bricks are high quality with ' + companyInfo.experience + ' of experience.',
            'We serve in ' + companyInfo.cities.join(', ') + '.',
            'The price of Shiv Eant is ₹' + productInfo.shiv.price + ' per piece. Contact us for more information.',
            'Please visit our website or contact us directly at ' + companyInfo.phone + '.'
        ];
        
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    // Process user message and generate response
    async function processMessage(message, conversationHistory = []) {
        // Show typing indicator
        showTypingIndicator();
        
        // Detect intent
        const intent = detectIntent(message);
        
        // Get quick response if available
        let response = getQuickResponse(intent, message);
        
        // If no quick response, try ChatGPT
        if (!response) {
            response = await callChatGPT(message, conversationHistory);
        }
        
        // If ChatGPT also fails, use fallback
        if (!response) {
            response = getFallbackResponse(message);
        }
        
        // Hide typing indicator
        hideTypingIndicator();
        
        return response;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chatbot-message bot-message typing-indicator';
        typingIndicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        typingIndicator.id = 'typingIndicator';
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Add message to chat
    function addMessage(text, isUser = false) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send message
    async function sendMessage() {
        const input = document.getElementById('chatbotInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, true);
        input.value = '';
        
        // Track analytics
        if (typeof trackEvent === 'function') {
            trackEvent('chatbot_message_sent', { message: message });
        }
        
        // Process and get response
        const response = await processMessage(message);
        addMessage(response);
    }
    
    // Initialize chatbot
    function initChatbot() {
        // Ensure only one chatbot toggle button exists
        const allToggles = document.querySelectorAll('.chatbot-toggle, #chatbotToggle');
        if (allToggles.length > 1) {
            // Keep only the first one, remove others
            for (let i = 1; i < allToggles.length; i++) {
                allToggles[i].remove();
            }
        }
        
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const send = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        
        if (toggle) {
            // Ensure toggle is unique and visible
            toggle.style.display = 'flex';
            toggle.style.visibility = 'visible';
            toggle.style.opacity = '1';
            toggle.style.zIndex = '99999';
            
            // Ensure icon is visible
            const icon = toggle.querySelector('.chatbot-icon-main');
            if (icon) {
                icon.style.display = 'block';
                icon.style.visibility = 'visible';
                icon.style.opacity = '1';
            }
            
            // Add click event listener
            toggle.addEventListener('click', function() {
                const chatbot = document.getElementById('chatbot');
                if (chatbot) {
                    chatbot.classList.toggle('active');
                    if (chatbot.classList.contains('active')) {
                        input?.focus();
                    }
                }
            });
        }
        
        if (close) {
            close.addEventListener('click', function() {
                const chatbot = document.getElementById('chatbot');
                if (chatbot) {
                    chatbot.classList.remove('active');
                }
            });
        }
        
        if (send) {
            send.addEventListener('click', sendMessage);
        }
        
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            // Update placeholder based on language
            const updatePlaceholder = () => {
                const placeholder = getTranslation('chatbotPlaceholder');
                if (placeholder && placeholder !== 'chatbotPlaceholder') {
                    input.placeholder = placeholder;
                }
            };
            updatePlaceholder();
            
            // Update on language change
            const langObserver = new MutationObserver(updatePlaceholder);
            if (document.documentElement) {
                langObserver.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['lang']
                });
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
    
    // Make functions globally available
    window.sendChatbotMessage = sendMessage;
    
})();

