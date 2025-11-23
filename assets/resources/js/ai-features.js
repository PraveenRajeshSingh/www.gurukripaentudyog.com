// ============================================
// AI-POWERED FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // CHATBOT WITH CONTEXT MEMORY
    // ============================================
    
    const chatMemory = {
        conversationHistory: [],
        userPreferences: {},
        context: {}
    };

    function saveChatMemory() {
        localStorage.setItem('chatbotMemory', JSON.stringify(chatMemory));
    }

    function loadChatMemory() {
        const saved = localStorage.getItem('chatbotMemory');
        if (saved) {
            try {
                Object.assign(chatMemory, JSON.parse(saved));
            } catch (e) {
                console.error('Error loading chat memory:', e);
            }
        }
    }

    function addToMemory(message, response, intent) {
        chatMemory.conversationHistory.push({
            message,
            response,
            intent,
            timestamp: new Date().toISOString()
        });

        // Keep only last 20 messages
        if (chatMemory.conversationHistory.length > 20) {
            chatMemory.conversationHistory.shift();
        }

        saveChatMemory();
    }

    function getContextualResponse(message) {
        // Analyze conversation history for context
        const recentMessages = chatMemory.conversationHistory.slice(-5);
        const context = extractContext(recentMessages);
        
        // Use context to provide better responses
        return generateContextualResponse(message, context);
    }

    function extractContext(messages) {
        const context = {
            topics: [],
            userIntent: null,
            mentionedProducts: []
        };

        messages.forEach(msg => {
            if (msg.intent) {
                context.userIntent = msg.intent;
            }
            // Extract product mentions
            if (msg.message.toLowerCase().includes('shiv') || msg.message.toLowerCase().includes('ईंट')) {
                context.mentionedProducts.push('Shiv Eant');
            }
        });

        return context;
    }

    function generateContextualResponse(message, context) {
        // Enhanced response based on context
        if (context.mentionedProducts.length > 0) {
            return `Based on our previous conversation about ${context.mentionedProducts.join(', ')}, I can help you with more details.`;
        }
        return null;
    }

    // ============================================
    // AI SEARCH (SEMANTIC SEARCH)
    // ============================================
    
    function initAISearch() {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();

            if (query.length < 2) return;

            searchTimeout = setTimeout(() => {
                performSemanticSearch(query);
            }, 300);
        });
    }

    function performSemanticSearch(query) {
        // Semantic search implementation
        const searchableContent = {
            products: document.querySelectorAll('.product-card'),
            blog: document.querySelectorAll('.blog-card'),
            sections: document.querySelectorAll('.section')
        };

        const results = [];
        const queryLower = query.toLowerCase();

        // Search in products
        searchableContent.products.forEach(product => {
            const text = product.textContent.toLowerCase();
            const relevance = calculateRelevance(text, queryLower);
            if (relevance > 0.3) {
                results.push({ element: product, relevance, type: 'product' });
            }
        });

        // Search in blog
        searchableContent.blog.forEach(blog => {
            const text = blog.textContent.toLowerCase();
            const relevance = calculateRelevance(text, queryLower);
            if (relevance > 0.3) {
                results.push({ element: blog, relevance, type: 'blog' });
            }
        });

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        // Display results
        displaySearchResults(results);
    }

    function calculateRelevance(text, query) {
        // Simple relevance calculation
        const words = query.split(' ');
        let matches = 0;

        words.forEach(word => {
            if (text.includes(word)) {
                matches++;
            }
        });

        return matches / words.length;
    }

    function displaySearchResults(results) {
        // Create or update results container
        let resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'searchResults';
            resultsContainer.className = 'search-results';
            document.body.appendChild(resultsContainer);
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found</p>';
            return;
        }

        resultsContainer.innerHTML = results.slice(0, 5).map(result => {
            return `
                <div class="search-result-item" data-type="${result.type}">
                    <h4>${result.element.querySelector('h3')?.textContent || 'Result'}</h4>
                    <p>Relevance: ${Math.round(result.relevance * 100)}%</p>
                </div>
            `;
        }).join('');

        // Highlight results
        results.forEach(result => {
            result.element.style.border = '2px solid var(--primary-color)';
            result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ============================================
    // AI RECOMMENDATIONS
    // ============================================
    
    function generateRecommendations() {
        const userBehavior = getUserBehavior();
        const recommendations = analyzeBehavior(userBehavior);
        displayRecommendations(recommendations);
    }

    function getUserBehavior() {
        return {
            viewedProducts: JSON.parse(localStorage.getItem('viewedProducts') || '[]'),
            cartItems: JSON.parse(localStorage.getItem('cart') || '[]'),
            searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]')
        };
    }

    function analyzeBehavior(behavior) {
        const recommendations = [];

        // Recommend based on viewed products
        if (behavior.viewedProducts.length > 0) {
            recommendations.push({
                type: 'product',
                message: 'You might like these similar products',
                items: behavior.viewedProducts.slice(0, 3)
            });
        }

        // Recommend based on location
        const location = JSON.parse(localStorage.getItem('userLocation') || 'null');
        if (location) {
            recommendations.push({
                type: 'location',
                message: 'Nearby services available',
                items: ['Same-day delivery', 'Free consultation']
            });
        }

        return recommendations;
    }

    function displayRecommendations(recommendations) {
        const container = document.getElementById('recommendations');
        if (!container) return;

        container.innerHTML = recommendations.map(rec => {
            return `
                <div class="recommendation-card">
                    <h4>${rec.message}</h4>
                    <ul>
                        ${rec.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // VOICE INPUT/OUTPUT
    // ============================================
    
    function initVoiceFeatures() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return; // Voice not supported
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN'; // Hindi and English

        // Add voice button to chatbot
        const chatbotInput = document.getElementById('chatbotInput');
        if (chatbotInput) {
            const voiceButton = document.createElement('button');
            voiceButton.className = 'voice-button';
            voiceButton.innerHTML = '<i class="ion-ios-mic"></i>';
            voiceButton.setAttribute('aria-label', 'Voice input');
            voiceButton.type = 'button';

            voiceButton.addEventListener('click', function() {
                startVoiceRecognition(recognition, chatbotInput);
            });

            chatbotInput.parentElement.insertBefore(voiceButton, chatbotInput.nextSibling);
        }
    }

    function startVoiceRecognition(recognition, input) {
        recognition.start();
        input.placeholder = 'Listening...';

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            input.dispatchEvent(new Event('input', { bubbles: true }));

            // Auto-send if chatbot is open
            const chatbot = document.getElementById('chatbot');
            if (chatbot && chatbot.classList.contains('active')) {
                setTimeout(() => {
                    const sendButton = document.getElementById('chatbotSend');
                    if (sendButton) sendButton.click();
                }, 500);
            }
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            input.placeholder = 'Voice input failed. Try again.';
        };

        recognition.onend = function() {
            input.placeholder = 'Type your message...';
        };
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    // ============================================
    // AI AUTO-FILL FORMS
    // ============================================
    
    function initAIAutoFill() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
            
            inputs.forEach(input => {
                // Auto-fill based on saved data
                const savedData = localStorage.getItem('userData');
                if (savedData) {
                    try {
                        const userData = JSON.parse(savedData);
                        if (userData[input.name]) {
                            input.value = userData[input.name];
                        }
                    } catch (e) {
                        console.error('Error loading user data:', e);
                    }
                }

                // Suggest based on input type
                input.addEventListener('input', function() {
                    suggestInput(this);
                });
            });
        });
    }

    function suggestInput(input) {
        // Simple suggestion logic
        if (input.type === 'email' && input.value.includes('@')) {
            const domain = input.value.split('@')[1];
            if (domain && !domain.includes('.')) {
                // Suggest common domains
                const suggestions = ['gmail.com', 'yahoo.com', 'outlook.com'];
                // Could show autocomplete dropdown here
            }
        }
    }

    // ============================================
    // INITIALIZE ALL AI FEATURES
    // ============================================
    
    function init() {
        loadChatMemory();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initAISearch();
                initVoiceFeatures();
                initAIAutoFill();
                generateRecommendations();
            });
        } else {
            initAISearch();
            initVoiceFeatures();
            initAIAutoFill();
            generateRecommendations();
        }
    }

    init();

    // Export functions
    window.addToMemory = addToMemory;
    window.getContextualResponse = getContextualResponse;
    window.speakText = speakText;

})();

