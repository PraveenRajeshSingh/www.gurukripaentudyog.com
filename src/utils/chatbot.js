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

        if (!chatbot || !toggleBtn) return;

        // Toggle chatbot
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = chatbot.classList.toggle('active');
            
            const overlay = document.getElementById('chatbotOverlay');
            if (overlay) overlay.classList.toggle('active', isActive);

            if (isActive && input) {
                setTimeout(() => input.focus(), 300);
            }
        });

        // Close chatbot
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                chatbot.classList.remove('active');
                const overlay = document.getElementById('chatbotOverlay');
                if (overlay) overlay.classList.remove('active');
            });
        }

        // Global listeners for Chatbot (ESC and Click Outside)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatbot.classList.contains('active')) {
                chatbot.classList.remove('active');
                const overlay = document.getElementById('chatbotOverlay');
                if (overlay) overlay.classList.remove('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (chatbot.classList.contains('active') && 
                !chatbot.contains(e.target) && 
                !toggleBtn.contains(e.target)) {
                chatbot.classList.remove('active');
                const overlay = document.getElementById('chatbotOverlay');
                if (overlay) overlay.classList.remove('active');
            }
        });

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

            // Bot response after delay
            setTimeout(() => {
                const response = Chatbot.getResponse(text);
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot-message';
                botMsg.innerHTML = `<p>${response}</p>`;
                messagesDiv.appendChild(botMsg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 800);

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
        const input = text.toLowerCase();
        if (input.includes('price') || input.includes('कीमत') || input.includes('rate') || input.includes('cost')) {
            return 'Our brick prices: Standard ₹6.5/pc, Premium ₹8.5/pc, Machine Made ₹9/pc, Shiv Eent ₹10-11/pc. Call +91 91989 23230 for bulk pricing!';
        }
        if (input.includes('delivery') || input.includes('डिलीवरी')) {
            return 'We offer same-day delivery in Jaunpur district! For Varanasi and surrounding areas, delivery takes 1-2 days.';
        }
        if (input.includes('quality') || input.includes('गुणवत्ता')) {
            return 'All our bricks are first-class quality — well-burnt, uniform shape, and durable.';
        }
        if (input.includes('order') || input.includes('buy')) {
            return 'To place an order, call us at +91 91989 23230 or use the cart on our website!';
        }
        if (input.includes('hi') || input.includes('hello')) {
            return 'Namaste! 🙏 Welcome to Gurukripa Bricks. How can I help you today?';
        }
        return 'Thank you for your message! For detailed information, please call us at +91 91989 23230. We\'re happy to help! 😊';
    }
};

window.Chatbot = Chatbot;
