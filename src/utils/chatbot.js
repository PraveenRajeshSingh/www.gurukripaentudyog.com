/**
 * Gurukripa Bricks - AI Chatbot Module
 * Enhanced with conversation history and context memory
 */
const Chatbot = {
    conversationHistory: [],
    maxHistoryLength: 50,
    
    init: () => {
        const toggleBtn = document.getElementById('chatbotToggle');
        const chatbot = document.getElementById('chatbot');
        const closeBtn = document.getElementById('chatbotClose');
        const sendBtn = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        const messagesDiv = document.getElementById('chatbotMessages');
        const overlay = document.getElementById('chatbotOverlay');

        if (!chatbot || !toggleBtn) return;
        
        // Load conversation history
        Chatbot.loadHistory();

        const openChat = () => {
            chatbot.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.classList.add('chatbot-open');
            if (input) setTimeout(() => input.focus(), 350);
            
            // Render history if exists
            if (Chatbot.conversationHistory.length > 0 && messagesDiv) {
                Chatbot.renderHistory(messagesDiv);
            }
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

        const handleChatMessage = (msgText) => {
            if (!input || !messagesDiv) return;
            const text = (typeof msgText === 'string' ? msgText : input.value).trim();
            if (!text) {
                showToast('⚠️ Please type a message first');
                return;
            }

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user-message';
            const userTimestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            // Prevent XSS by escaping HTML tags
            const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            userMsg.innerHTML = `<p>${escapedText}</p><small class="message-time">${userTimestamp}</small>`;
            messagesDiv.appendChild(userMsg);
            
            // Save to history
            Chatbot.saveMessage('user', text);
            
            input.value = '';
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Show typing indicator
            showTyping();

            // Bot response after delay (optimized)
            setTimeout(() => {
                hideTyping();
                const response = Chatbot.getResponse(text);
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot-message';
                const botTimestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                botMsg.innerHTML = `<p>${response}</p><small class="message-time">${botTimestamp}</small>`;
                messagesDiv.appendChild(botMsg);
                
                // Save to history
                Chatbot.saveMessage('bot', response);
                
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 600); // Faster response
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
        
        // Helper function to add suggestion chips
        const withSuggestions = (message, suggestions) => {
            const chips = suggestions.map(s => 
                `<button class="suggestion-chip" onclick="handleChatMessage('${s}')">${s}</button>`
            ).join('');
            return `${message}<div class="suggestion-chips">${chips}</div>`;
        };
        
        if (t.includes('price') || t.includes('कीमत') || t.includes('rate') || t.includes('cost') || t.includes('दाम')) {
            const products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
            const priceList = products.map(p => `• ${p.name}: <b>₹${p.price.toFixed(2)}</b>/pc`).join('<br>');
            return withSuggestions(
                `🧱 Our premium brick prices:<br>${priceList}<br><br>📞 Call <b>+91 91989 23230</b> for bulk/custom discounts!`,
                ['Delivery Info', 'Quality Details', 'Place Order']
            );
        }
        if (t.includes('delivery') || t.includes('डिलीवरी') || t.includes('deliver')) {
            return withSuggestions(
                '🚛 We offer <b>same-day priority delivery</b> in Jaunpur district! For Varanasi, Jaunpur Rural & surrounding areas, delivery takes 1-2 days. Minimum order: 1000 bricks.',
                ['View Prices', 'Order Now', 'Contact Us']
            );
        }
        if (t.includes('quality') || t.includes('गुणवत्ता') || t.includes('grade')) {
            return withSuggestions(
                '⭐ All our bricks are <b>first-class quality</b> — well-burnt, uniform shape, high load capacity, and highly durable. We offer 4 grades from Standard Field Bricks to ultra-premium Shiv Eent Grade-A.',
                ['View Prices', 'Delivery Info', 'Order Now']
            );
        }
        if (t.includes('shiv') || t.includes('grade-a') || t.includes('grade a')) {
            const shivEent = typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.category === 'shiv-eent') : null;
            const shivPrice = shivEent ? shivEent.price.toFixed(2) : '10.00';
            return withSuggestions(
                `🌟 <b>Shiv Eent (Grade-A)</b> is our ultra-premium quality brick, double-fired for maximum durability and strength. Ideal for load-bearing walls and high-end construction.<br>• Price: <b>₹${shivPrice} per brick</b><br>• Specs: Red Clay • 9×4.5×3 inches`,
                ['View Prices', 'Delivery Info', 'Order Now']
            );
        }
        if (t.includes('machine') || t.includes('wirecut') || t.includes('precision')) {
            const machineBrick = typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.category === 'machine-made') : null;
            const machinePrice = machineBrick ? machineBrick.price.toFixed(2) : '9.00';
            return withSuggestions(
                `⚙️ Our <b>Machine Made Wirecut Bricks</b> have perfectly uniform shapes, sharp corners, and a smooth finish. Perfect for exposed brickwork, outer walls, and modern aesthetics.<br>• Price: <b>₹${machinePrice} per brick</b><br>• Specs: Precision Cut • 9×4.5×3 inches`,
                ['View Prices', 'Delivery Info', 'Order Now']
            );
        }
        if (t.includes('order') || t.includes('buy') || t.includes('खरीद') || t.includes('ऑर्डर')) {
            return withSuggestions(
                '🛒 To place an order:<br>1. Browse our Products section<br>2. Add items to cart<br>3. Proceed to checkout<br><br>Or call directly: <b>+91 91989 23230</b>',
                ['View Products', 'View Prices', 'Contact Us']
            );
        }
        if (t.includes('location') || t.includes('address') || t.includes('where') || t.includes('पता')) {
            return withSuggestions(
                '📍 We are located in <b>Nevada, Jalalpur-Chawari Road, Jalalpur, Jaunpur, Uttar Pradesh — 222001</b>.<br>Serving: Jaunpur, Varanasi, Ghazipur, Sultanpur & nearby areas.',
                ['Contact Us', 'View Products', 'Delivery Info']
            );
        }
        if (t.includes('time') || t.includes('hours') || t.includes('open') || t.includes('समय')) {
            return withSuggestions(
                '🕐 We are open <b>Monday – Saturday, 9:00 AM – 7:00 PM</b>.<br>Closed on Sundays.',
                ['Contact Us', 'Order Now', 'View Products']
            );
        }
        if (t.includes('contact') || t.includes('phone') || t.includes('call') || t.includes('संपर्क')) {
            return withSuggestions(
                '📞 Contact us:<br>• Phone: <b>+91 91989 23230</b><br>• WhatsApp: +91 91989 23230<br>• Email: info@gurukripaentudyog.com',
                ['View Products', 'Order Now', 'Delivery Info']
            );
        }
        if (t.includes('hi') || t.includes('hello') || t.includes('namaste') || t.includes('नमस्ते')) {
            return withSuggestions(
                'Namaste! 🙏 Welcome to <b>Gurukripa Bricks</b>. How can I help you today? You can ask about prices, delivery, quality, or how to order.',
                ['View Prices', 'Best Brick?', 'Delivery Info', 'Order Now']
            );
        }
        if (t.includes('best') || t.includes('recommend') || t.includes('which brick') || t.includes('सबसे अच्छ') || t.includes('कौन सी')) {
            const products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
            const best = products.reduce((a, b) => (b.rating || 0) > (a.rating || 0) ? b : a, products[0]);
            const bestPrice = best ? best.price.toFixed(2) : '10.00';
            return withSuggestions(
                `🌟 Based on quality ratings, I recommend <b>${best ? best.name : 'Shiv Eent (Grade-A)'}</b>!<br>• Rating: ⭐ ${best ? best.rating : '4.9'}/5<br>• Price: ₹${bestPrice}/pc<br>• ${best && best.specs ? best.specs.strength : '1500+ PSI'} strength<br><br>Ideal for load-bearing walls and premium construction.`,
                ['View Prices', 'Delivery Info', 'Add to Cart']
            );
        }
        if (t.includes('save my') || t.includes('callback') || t.includes('call me') || t.includes('contact me')) {
            return '📞 I\'d love to help! Please call us directly at <b>+91 91989 23230</b> and our team will assist you immediately. We\'re available Mon-Sat, 9AM-7PM.';
        }
        if (t.includes('thank') || t.includes('धन्यवाद')) {
            return '🙏 You\'re most welcome! Feel free to ask if you need anything else. Happy building! 🏗️';
        }
        return withSuggestions(
            'Thank you for your message! 😊 For detailed information, please call us at <b>+91 91989 23230</b> or visit our contact section. We\'re happy to help!',
            ['View Prices', 'Best Brick?', 'Contact Us', 'Order Now']
        );
    },
    
    // Save message to history
    saveMessage: (sender, text) => {
        Chatbot.conversationHistory.push({
            sender,
            text,
            timestamp: new Date().toISOString()
        });
        
        // Limit history length
        if (Chatbot.conversationHistory.length > Chatbot.maxHistoryLength) {
            Chatbot.conversationHistory = Chatbot.conversationHistory.slice(-Chatbot.maxHistoryLength);
        }
        
        // Persist to localStorage
        try {
            localStorage.setItem('chatbot_history', JSON.stringify(Chatbot.conversationHistory));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    },
    
    // Load history from localStorage
    loadHistory: () => {
        try {
            const saved = localStorage.getItem('chatbot_history');
            if (saved) {
                Chatbot.conversationHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load chat history:', e);
            Chatbot.conversationHistory = [];
        }
    },
    
    // Render conversation history
    renderHistory: (messagesDiv) => {
        // Clear existing messages
        messagesDiv.innerHTML = '';
        
        // Show last 20 messages only for performance
        const recentHistory = Chatbot.conversationHistory.slice(-20);
        
        recentHistory.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chatbot-message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`;
            const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            // XSS Prevention for history render
            const escapedText = msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Note: If msg is from bot, it might contain safe HTML tags like <b> or <br>, so we only escape user messages
            if (msg.sender === 'user') {
                msgDiv.innerHTML = `<p>${escapedText}</p><small class="message-time">${timestamp}</small>`;
            } else {
                msgDiv.innerHTML = `<p>${msg.text}</p><small class="message-time">${timestamp}</small>`;
            }
            messagesDiv.appendChild(msgDiv);
        });
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },
    
    // Clear conversation history
    clearHistory: () => {
        Chatbot.conversationHistory = [];
        localStorage.removeItem('chatbot_history');
    }
};

window.Chatbot = Chatbot;
