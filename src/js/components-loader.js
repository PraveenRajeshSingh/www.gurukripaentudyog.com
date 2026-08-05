// ══════════════════════════════════════════
// HTML COMPONENT PARTIAL LOADER
// ══════════════════════════════════════════
async function loadComponents() {
    const slots = document.querySelectorAll('[data-component]');
    if (!slots.length) return;

    for (const slot of slots) {
        const name = slot.getAttribute('data-component');
        if (!name) continue;
        try {
            const res = await fetch(`src/components/${name}.html`);
            if (res.ok) {
                const html = await res.text();
                slot.outerHTML = html;
            }
        } catch (err) {
            console.warn(`Component load skipped for ${name}:`, err);
        }
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);
