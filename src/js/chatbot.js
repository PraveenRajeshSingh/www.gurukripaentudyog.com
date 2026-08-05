// ══════════════════════════════════════════
// CHATBOT
// ══════════════════════════════════════════
function toggleChatbot() {
    const bot = document.getElementById('chatbotBox');
    if (!bot) return;
    const isOpen = bot.classList.contains('open');
    bot.classList.toggle('open');
    if (!isOpen) {
        setTimeout(() => document.getElementById('chatInput')?.focus(), 200);
    }
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
        const key = Object.keys(CHAT_RESPONSES).find(k => msg.toLowerCase().includes(k));
        const reply = key ? CHAT_RESPONSES[key] : "Thank you for your message! Our team will respond shortly.\n\n📞 Call: +91 91989 23230\n💬 WhatsApp available 24/7";
        appendChatMsg(reply, 'bot');
    }, 900);
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
