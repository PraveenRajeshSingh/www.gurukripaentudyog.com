// ══════════════════════════════════════════
// WALL PREVIEW — Live SVG 2D Brick-Pattern Rendering
// Visualizes running-bond masonry based on length & height
// Lazy-friendly: called from calculator.js when #calculator is in view
// ══════════════════════════════════════════

(function () {
    window.drawWallPreview = function drawWallPreview(lenFt, htFt, thick) {
        const svg = document.getElementById('wallPreviewSvg');
        if (!svg) return;

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const frame = svg.parentElement;
        const containerW = frame ? (frame.clientWidth || 320) : 320;
        // Prefer 16/9 frame; cap height at 260 via CSS
        const containerH = frame ? Math.min(260, Math.max(120, frame.clientHeight || Math.round(containerW * 9 / 16))) : 180;

        const len = Math.max(2, parseFloat(lenFt) || 20);
        const ht = Math.max(1, parseFloat(htFt) || 10);
        const thickIn = thick || 9;

        const bricksPerRow = Math.min(28, Math.max(6, Math.round(len * 0.8)));
        const rowCount = Math.min(14, Math.max(4, Math.round(ht * 0.9)));

        const cellW = (containerW - 12) / bricksPerRow;
        const cellH = Math.min((containerH - 28) / rowCount, 18);
        const svgH = Math.round(rowCount * cellH + 28);

        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${containerW} ${svgH}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label',
            `Wall section ${len} feet long by ${ht} feet high, ${thickIn} inches thick`);

        // Simplified pattern when reduced motion is preferred (fewer rects)
        const maxRows = reduceMotion ? Math.min(rowCount, 6) : rowCount;
        const maxColsBase = reduceMotion ? Math.min(bricksPerRow, 12) : bricksPerRow;
        const cellW2 = (containerW - 12) / maxColsBase;
        const cellH2 = Math.min((svgH - 28) / maxRows, 18);

        let html = `<rect width="${containerW}" height="${svgH}" fill="var(--bg-card, #fdfbf9)" rx="8"/>`;

        for (let row = 0; row < maxRows; row++) {
            const y = row * cellH2 + 6;
            const isOdd = row % 2 !== 0;
            const offset = isOdd ? -(cellW2 / 2) : 0;
            const count = isOdd ? maxColsBase + 1 : maxColsBase;

            for (let col = 0; col <= count; col++) {
                const x = offset + col * cellW2 + 6;
                const w = cellW2 - 2;
                const h = cellH2 - 2;
                if (x + w < 0 || x > containerW - 6) continue;
                const tone = (row + col) % 3 === 0 ? '#b33614' : ((row + col) % 3 === 1 ? '#c8460a' : '#9b2c0e');
                html += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${tone}" stroke="#782309" stroke-width="0.5"/>`;
            }
        }

        html += `
            <text x="${containerW / 2}" y="${svgH - 8}" text-anchor="middle" font-size="11" fill="#782309" font-family="sans-serif" font-weight="700">
                Wall: ${len}ft (L) × ${ht}ft (H) · ${thickIn}″ · Running Bond
            </text>`;

        svg.innerHTML = html;
    };
})();
