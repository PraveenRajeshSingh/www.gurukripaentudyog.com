/**
 * Gurukripa Bricks - AI Chatbot Module
 */
const Chatbot = {
    init: () => {
        const toggleBtn = document.getElementById('chatbotToggle');
        const chatbot = document.getElementById('chatbot');
        const closeBtn = document.getElementById('chatbotClose');
        const sendBtn = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        const messagesDiv = document.getElementById('chatbotMessages');
        const overlay = document.getElementById('chatbotOverlay');

        if (!chatbot || !toggleBtn) return;

        const openChat = () => {
            chatbot.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.classList.add('chatbot-open');
            if (input) setTimeout(() => input.focus(), 350);
        };

        const closeChat = () => {
            chatbot.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('chatbot-open');
        };

        // Toggle chatbot
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatbot.classList.contains('active') ? closeChat() : openChat();
        });

        // Close chatbot
        if (closeBtn) closeBtn.addEventListener('click', closeChat);
        if (overlay) overlay.addEventListener('click', closeChat);

        // Global ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatbot.classList.contains('active')) closeChat();
        });

        const showTyping = () => {
            const typing = document.createElement('div');
            typing.className = 'chatbot-message bot-message chatbot-typing';
            typing.innerHTML = '<span></span><span></span><span></span>';
            typing.id = 'typingIndicator';
            if (messagesDiv) {
                messagesDiv.appendChild(typing);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        };

        const hideTyping = () => {
            const t = document.getElementById('typingIndicator');
            if (t) t.remove();
        };

        const handleChatMessage = () => {
            if (!input || !messagesDiv) return;
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user-message';
            userMsg.innerHTML = `<p>${text}</p>`;
            messagesDiv.appendChild(userMsg);
            input.value = '';
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Show typing indicator
            showTyping();

            // Bot response after delay
            setTimeout(() => {
                hideTyping();
                const response = Chatbot.getResponse(text);
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot-message';
                botMsg.innerHTML = `<p>${response}</p>`;
                messagesDiv.appendChild(botMsg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 900);
        };

        if (sendBtn) sendBtn.addEventListener('click', handleChatMessage);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleChatMessage();
            });
        }

        window.handleChatMessage = handleChatMessage;
    },

    getResponse: (text) => {
        const t = text.toLowerCase();
        if (t.includes('price') || t.includes('कीमत') || t.includes('rate') || t.includes('cost') || t.includes('दाम')) {
            return '🧱 Our brick prices:<br>• Shiv Eent (Grade A): ₹10-11/pc<br>• Premium Red Clay: ₹8.5/pc<br>• Standard Field Brick: ₹6.5/pc<br>• Machine Made Wirecut: ₹9/pc<br><br>📞 Call <b>+91 91989 23230</b> for bulk pricing!';
        }
        if (t.includes('delivery') || t.includes('डिलीवरी') || t.includes('deliver')) {
            return '🚛 We offer <b>same-day delivery</b> in Jaunpur district! For Varanasi & surrounding areas, delivery takes 1-2 days. Minimum order: 1000 bricks.';
        }
        if (t.includes('quality') || t.includes('गुणवत्ता') || t.includes('grade')) {
            return '⭐ All our bricks are <b>first-class quality</b> — well-burnt, uniform shape, and highly durable. We offer 4 grades from Standard to Premium Shiv Eent.';
        }
        if (t.includes('order') || t.includes('buy') || t.includes('खरीद') || t.includes('ऑर्डर')) {
            return '🛒 To place an order:<br>1. Browse our Products section<br>2. Add items to cart<br>3. Proceed to checkout<br><br>Or call directly: <b>+91 91989 23230</b>';
        }
        if (t.includes('location') || t.includes('address') || t.includes('where') || t.includes('पता')) {
            return '📍 We are located in <b>Jalalpur, Jaunpur, Uttar Pradesh — 222001</b>.<br>Serving: Jaunpur, Varanasi, Ghazipur, Sultanpur & nearby areas.';
        }
        if (t.includes('time') || t.includes('hours') || t.includes('open') || t.includes('समय')) {
            return '🕐 We are open <b>Monday – Saturday, 8:00 AM – 6:00 PM</b>.<br>Closed on Sundays and public holidays.';
        }
        if (t.includes('contact') || t.includes('phone') || t.includes('call') || t.includes('संपर्क')) {
            return '📞 Contact us:<br>• Phone: <b>+91 91989 23230</b><br>• WhatsApp: +91 91989 23230<br>• Email: info@gurukripaentudyog.com';
        }
        if (t.includes('hi') || t.includes('hello') || t.includes('namaste') || t.includes('नमस्ते')) {
            return 'Namaste! 🙏 Welcome to <b>Gurukripa Bricks</b>. How can I help you today? You can ask about prices, delivery, quality, or how to order.';
        }
        if (t.includes('thank') || t.includes('धन्यवाद')) {
            return '🙏 You\'re most welcome! Feel free to ask if you need anything else. Happy building! 🏗️';
        }
        return 'Thank you for your message! 😊 For detailed information, please call us at <b>+91 91989 23230</b> or visit our contact section. We\'re happy to help!';
    }
};

window.Chatbot = Chatbot;
