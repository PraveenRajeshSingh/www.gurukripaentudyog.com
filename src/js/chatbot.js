// ══════════════════════════════════════════
// BILINGUAL AI CONSTRUCTION ASSISTANT CHATBOT
// ══════════════════════════════════════════

const BOT_KNOWLEDGE_BASE = {
    rates: "🧱 Current Kiln Wholesale Rates:\n• Shiv Eent (Grade-A): ₹12/pc (₹12,000 / 1,000 pcs)\n• Awwal (आव्वल): ₹7.05/pc (₹28,200 / 4,000 trolley)\n• Laal Peti (लाल पेटी): ₹6.25/pc (₹25,000 / 4,000 trolley)\n• Machine Wirecut: ₹10/pc\n\nAll rates include loading & 5% GST options available.",
    delivery: "🚚 Delivery Coverage & Timelines:\n• Jaunpur District: Same-day delivery for orders before 12 PM (Jalalpur, Trilochan, Kerakat, Badlapur).\n• Varanasi & Sultanpur: 24–48 hours direct site dispatch.\n• Delivery is FREE within 10 km of Bhatta yard!",
    estimator: "📐 Quick Wall Calculation:\n• 100 sq.ft wall (9-inch main wall) requires approx. 1,720 bricks, 12 cement bags, and 60 cu.ft sand.\n• Use our 3-in-1 Estimator tab on the home screen for live sliders & PDF export!",
    contact: "📞 Gurukripa Bhatta Sales Office:\n• Phone: +91 91989 23230\n• WhatsApp: https://wa.me/919198923230\n• Yard: Nevada, Jalalpur, Jaunpur UP"
};

function toggleChatbot() {
    const wrap = document.getElementById('chatbotWrap');
    const box = document.getElementById('chatbotBox');
    if (!box) return;
    const isOpen = box.classList.contains('open');
    box.classList.toggle('open');
    if (wrap) wrap.classList.toggle('open');

    if (!isOpen) {
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('chatInput')?.focus(), 250);
        if (navigator.vibrate) navigator.vibrate(30);
    } else {
        document.body.style.overflow = '';
    }
}

function openWhatsAppBhattaManager() {
    const text = encodeURIComponent("Namaste Gurukripa Bhatta Manager! I am inquiring about brick availability and wholesale delivery quotes for my construction site.");
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank');
}

function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    appendChatMsg(msg, 'user');
    showTyping();

    setTimeout(() => {
        removeTyping();
        const lower = msg.toLowerCase();
        let reply = "";

        if (lower.includes('price') || lower.includes('rate') || lower.includes('रेट') || lower.includes('कीमत')) {
            reply = BOT_KNOWLEDGE_BASE.rates;
        } else if (lower.includes('delivery') || lower.includes('trolley') || lower.includes('ट्रॉली') || lower.includes('पहुंच') || lower.includes('track')) {
            reply = BOT_KNOWLEDGE_BASE.delivery;
        } else if (lower.includes('wall') || lower.includes('calculate') || lower.includes('दीवार') || lower.includes('estimate')) {
            reply = BOT_KNOWLEDGE_BASE.estimator;
        } else if (lower.includes('manager') || lower.includes('contact') || lower.includes('phone') || lower.includes('नंबर')) {
            reply = BOT_KNOWLEDGE_BASE.contact;
        } else {
            reply = "धन्यवाद! Gurukripa Bhatta AI Assistant. I can assist you with:\n1. 🧱 Brick rates & grades\n2. 🚚 Trolley delivery slots\n3. 📐 Wall estimation & cement ratio\n\nOr click below to speak directly with our Manager via WhatsApp.";
        }
        appendChatMsg(reply, 'bot');
    }, 700);
}

function sendChatChip(text) {
    const input = document.getElementById('chatInput');
    if (input) input.value = text;
    sendChat();
}

function appendChatMsg(text, role) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chatTyping';
    div.innerHTML = '<div class="chat-dot"></div><div class="chat-dot"></div><div class="chat-dot"></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    document.getElementById('chatTyping')?.remove();
}
