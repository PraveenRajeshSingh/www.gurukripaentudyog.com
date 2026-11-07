// ══════════════════════════════════════════
// KILN ASSISTANT — bilingual (Hindi / English) helper
// ══════════════════════════════════════════
//
// How it answers:
//   1. If a chat endpoint is configured (<meta name="gb-chat-endpoint">), the
//      message + recent history are POSTed there and the server reply is shown.
//      API keys live on that server, never in this file. Timeouts and failures
//      are surfaced to the user — no silent fake answers.
//   2. Otherwise it falls back to an OFFLINE knowledge base of the yard's own
//      published facts (rates, delivery, contact). This is an automated helper,
//      not a live AI model, and the UI says so. Nothing here invents prices:
//      the rates below mirror PRODUCTS in data.js (source of truth).
//
// To enable a real assistant, set in head.html:
//   <meta name="gb-chat-endpoint" content="https://api.yourdomain.com/v1/chat">
// The endpoint should accept { message, history, language } and return
// { reply: "text" }. Keep provider credentials server-side.

// Rates are kept in one place and match data.js exactly.
const BOT_KNOWLEDGE_BASE = {
    rates: "🧱 Kiln wholesale rates (per piece):\n• Shiv Eent Grade-A: ₹12\n• Machine Wirecut: ₹11\n• Premium Red: ₹10\n• Standard: ₹8\n• Awwal (आव्वल): ₹7.05  (₹28,200 / 4,000-brick trolley)\n• Laal Peti (लाल पेटी): ₹6.25  (₹25,000 / 4,000-brick trolley)\n\nBulk discounts apply — ask our manager for a live quote.",
    delivery: "🚚 Delivery coverage:\n• Jaunpur district (Jalalpur, Trilochan, Kerakat, Badlapur): same-day for orders placed before 12 noon.\n• Varanasi & Sultanpur: 24–48 hours direct site dispatch.\n• We deliver across 15+ cities in Eastern UP.",
    estimator: "📐 Use the 3-in-1 Estimator (bottom tab or the Estimate section) to size a wall, a full house, or a boundary — it calculates bricks, cement and sand from your dimensions and can send the estimate straight to WhatsApp.",
    contact: "📞 Gurukripa Bhatta — Sales Office\n• Phone: +91 91989 23230\n• WhatsApp: wa.me/919198923230\n• Yard: Newada, Jalalpur, Jaunpur, UP\n• Mon–Sat, 8 AM – 6 PM"
};

const GBChat = {
    history: [],           // [{ role:'user'|'assistant', content }]
    pending: false,        // guards against duplicate submissions
    minimized: false,
    endpoint: (function () {
        const m = document.querySelector('meta[name="gb-chat-endpoint"]');
        return (m && m.content) ? m.content.trim() : '';
    })(),
    language: function () {
        return (document.documentElement.lang || 'en').toLowerCase().startsWith('hi') ? 'hi' : 'en';
    }
};

function chatEl(id) { return document.getElementById(id); }

function toggleChatbot(force) {
    const box = chatEl('chatbotBox');
    const wrap = chatEl('chatbotWrap');
    if (!box) return;
    const isOpen = box.classList.contains('open');
    const willOpen = (typeof force === 'boolean') ? force : !isOpen;
    if (willOpen === isOpen) {
        if (willOpen) setTimeout(() => chatEl('chatInput')?.focus({ preventScroll: true }), 60);
        return;
    }

    GBChat.minimized = false;
    box.classList.toggle('open', willOpen);
    if (wrap) wrap.classList.toggle('open', willOpen);
    document.body.classList.toggle('gb-chat-open', willOpen);

    if (willOpen) {
        if (typeof overlayLock === 'function') overlayLock();
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => chatEl('chatInput')?.focus({ preventScroll: true }), 250);
    } else {
        if (typeof overlayUnlock === 'function') overlayUnlock();
    }
    if (wrap) wrap.setAttribute('aria-hidden', String(!willOpen));
}

// Collapse to the launcher without discarding the conversation.
function minimizeChatbot() {
    const box = chatEl('chatbotBox');
    if (box) box.classList.add('minimized');
    GBChat.minimized = true;
    setTimeout(() => chatEl('chatInput')?.focus({ preventScroll: true }), 60);
}
function restoreChatbot() {
    const box = chatEl('chatbotBox');
    if (box) box.classList.remove('minimized');
    GBChat.minimized = false;
}

function openWhatsAppBhattaManager() {
    const text = encodeURIComponent("Namaste Gurukripa Bhatta Manager! I am inquiring about brick availability and wholesale delivery quotes for my construction site.");
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank', 'noopener');
}

function sendChat() {
    const input = chatEl('chatInput');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg || GBChat.pending) return;   // ignore empty + in-flight duplicates

    input.value = '';
    appendChatMsg(msg, 'user');
    GBChat.history.push({ role: 'user', content: msg });
    GBChat.pending = true;
    setSendEnabled(false);
    showTyping();

    if (GBChat.endpoint) {
        replyFromBackend(msg);
    } else {
        // Offline helper: match the yard's own published facts. Small delay so
        // the typing indicator is honest about "composing", not faking a model.
        setTimeout(() => {
            removeTyping();
            const reply = matchKnowledge(msg);
            appendChatMsg(reply, 'bot', true);
            finishTurn(reply);
        }, 500);
    }
}

async function replyFromBackend(msg) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000); // 20s timeout
    try {
        const res = await fetch(GBChat.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({ message: msg, history: GBChat.history.slice(-10), language: GBChat.language() })
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json().catch(() => ({}));
        const reply = (data.reply || data.message || (data.choices && data.choices[0]?.message?.content) || '').trim();
        removeTyping();
        if (reply) { appendChatMsg(reply, 'bot'); finishTurn(reply); }
        else { showChatError('The assistant returned an empty response. Please try again or WhatsApp our manager.'); }
    } catch (err) {
        clearTimeout(timer);
        removeTyping();
        showChatError(err && err.name === 'AbortError'
            ? 'The assistant timed out. Please try again, or WhatsApp our manager for a quick reply.'
            : 'Could not reach the assistant right now. You can still WhatsApp our manager below.');
    } finally {
        GBChat.pending = false;
        setSendEnabled(true);
    }
}

// Route a free-text message to a published fact, or offer the WhatsApp handoff.
function matchKnowledge(msg) {
    const q = msg.toLowerCase();
    let reply;
    if (/(price|rate|cost|रेट|कीमत|भाव|₹|₹)/.test(q)) reply = BOT_KNOWLEDGE_BASE.rates;
    else if (/(deliver|trolley|track|transport|ट्रॉली|पहुंच|डिलीवरी)/.test(q)) reply = BOT_KNOWLEDGE_BASE.delivery;
    else if (/(wall|calculate|estimate|brick.*(need|quantity)|how many|दीवार|अंदाजा|गणना)/.test(q)) reply = BOT_KNOWLEDGE_BASE.estimator;
    else if (/(contact|phone|call|manager|address|location|नंबर|संपर्क|फोन|पता)/.test(q)) reply = BOT_KNOWLEDGE_BASE.contact;
    else reply = "I can help with brick rates & grades, delivery & trolley tracking, and material estimates. Tap a chip below, or WhatsApp our Bhatta manager for a live quote.";

    // Honest note only on the offline helper (no configured assistant).
    return reply + "\n\n— Automated answers from our published info. For anything specific, tap “Talk to Bhatta Manager”.";
}

function finishTurn(reply) {
    GBChat.history.push({ role: 'assistant', content: reply });
    GBChat.pending = false;
    setSendEnabled(true);
}

function setSendEnabled(on) {
    const btn = chatEl('chatSendBtn');
    if (btn) btn.disabled = !on;
    const input = chatEl('chatInput');
    if (input) input.setAttribute('aria-busy', String(!on));
}

function sendChatChip(text) {
    toggleChatbot(true);
    const input = chatEl('chatInput');
    if (input) input.value = text;
    sendChat();
}

function appendChatMsg(text, role, /*unused*/ _note) {
    const container = chatEl('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    container.appendChild(div);
    scrollChatToBottom(container);
}

function showChatError(text) {
    const container = chatEl('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--error';
    div.setAttribute('role', 'alert');
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    container.appendChild(div);
    GBChat.pending = false;
    setSendEnabled(true);
    scrollChatToBottom(container);
}

function showTyping() {
    const container = chatEl('chatMessages');
    if (!container) return;
    removeTyping();
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chatTyping';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = '<div class="chat-dot"></div><div class="chat-dot"></div><div class="chat-dot"></div>';
    container.appendChild(div);
    scrollChatToBottom(container);
}

function removeTyping() {
    document.getElementById('chatTyping')?.remove();
}

function scrollChatToBottom(container) {
    container = container || chatEl('chatMessages');
    if (container) container.scrollTop = container.scrollHeight;
}

// Keep the full-screen sheet inside the visible viewport when the on-screen
// keyboard opens/closes. visualViewport reports the truly visible height, so we
// publish it as --gb-chat-vh (used by the mobile chat CSS in refinements.css).
(function setupChatViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
        const h = Math.round(vv.height);
        if (h) document.documentElement.style.setProperty('--gb-chat-vh', h + 'px');
    };
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    apply();
})();
