// ══════════════════════════════════════════
// WALL PREVIEW — Live SVG 2D Brick-Pattern Rendering
// Visualizes running-bond masonry based on length & height
// ══════════════════════════════════════════

(function () {
    window.drawWallPreview = function drawWallPreview(lenFt, htFt, thick) {
        const svg = document.getElementById('wallPreviewSvg');
        if (!svg) return;

        const containerW = svg.parentElement ? (svg.parentElement.clientWidth || 320) : 320;
        const containerH = 150;

        const len = Math.max(2, parseFloat(lenFt) || 20);
        const ht = Math.max(1, parseFloat(htFt) || 10);

        // Aspect-ratio scaling for brick courses
        const bricksPerRow = Math.min(28, Math.max(6, Math.round(len * 0.8)));
        const rowCount = Math.min(14, Math.max(4, Math.round(ht * 0.9)));

        const cellW = (containerW - 12) / bricksPerRow;
        const cellH = Math.min(containerH / rowCount, 18);
        const svgH = Math.round(rowCount * cellH + 24);

        svg.setAttribute('width', '100%');
        svg.setAttribute('height', svgH);
        svg.setAttribute('viewBox', `0 0 ${containerW} ${svgH}`);

        let html = `<rect width="${containerW}" height="${svgH}" fill="#fdfbf9" rx="8"/>`;

        // Draw running-bond bricks
        for (let row = 0; row < rowCount; row++) {
            const y = row * cellH + 6;
            const isOdd = row % 2 !== 0;
            const offset = isOdd ? -(cellW / 2) : 0;
            const count = isOdd ? bricksPerRow + 1 : bricksPerRow;

            for (let col = 0; col <= count; col++) {
                const x = offset + col * cellW + 6;
                const w = cellW - 2;
                const h = cellH - 2;
                if (x + w < 0 || x > containerW - 6) continue;
                // Subtle color variation across kiln-fired red clay bricks
                const tone = (row + col) % 3 === 0 ? '#b33614' : ((row + col) % 3 === 1 ? '#c8460a' : '#9b2c0e');
                html += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${tone}" stroke="#782309" stroke-width="0.5"/>`;
            }
        }

        // Live Dimension Stamp
        html += `
            <text x="${containerW / 2}" y="${svgH - 6}" text-anchor="middle" font-size="10" fill="#782309" font-family="sans-serif" font-weight="700">
                📏 Wall Section: ${len}ft (L) × ${ht}ft (H) · ${thick || 9}″ thickness · Running Bond
            </text>`;

        svg.innerHTML = html;
    };
})();
