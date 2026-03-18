/**
 * Gurukripa Bricks - Brick Calculator Module
 */
const BrickCalculator = {
    init: () => {
        const calcBtn = document.getElementById('calculateBricks');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', () => {
            const length = parseFloat(document.getElementById('wallLength').value);
            const width = parseFloat(document.getElementById('wallWidth').value);
            const height = parseFloat(document.getElementById('wallHeight').value);
            const brickType = document.getElementById('brickType').value;

            // Validate inputs
            if (!length || length <= 0 || !height || height <= 0) {
                showToast('⚠️ Please enter valid wall dimensions.', 3000);
                return;
            }

            const wallWidth = width || 0.23;

            // Brick dimensions (meters) with mortar
            const brickSizes = {
                standard: { l: 0.228, w: 0.114, h: 0.076, price: 6.5 },
                shiv: { l: 0.228, w: 0.114, h: 0.076, price: 10 },
                premium: { l: 0.228, w: 0.114, h: 0.076, price: 8.5 },
                machine: { l: 0.230, w: 0.110, h: 0.075, price: 9 }
            };

            const brick = brickSizes[brickType] || brickSizes.standard;
            const brickVolume = brick.l * brick.w * brick.h;
            const wallVolume = length * wallWidth * height;
            const totalBricks = Math.ceil(wallVolume / brickVolume);

            // Cement: ~1 bag per 500 bricks (standard wall)
            const cementBags = Math.ceil(totalBricks / 500);
            // Sand: ~0.5 cu.ft per 100 bricks
            const sandCuFt = Math.ceil((totalBricks / 100) * 0.5);
            const totalCost = totalBricks * brick.price;

            // Show results
            const resultsDiv = document.getElementById('calcResults');
            document.getElementById('resultBricks').textContent = totalBricks.toLocaleString('en-IN') + ' bricks';
            document.getElementById('resultCement').textContent = cementBags + ' bags (approx)';
            document.getElementById('resultSand').textContent = sandCuFt + ' cu.ft (approx)';
            document.getElementById('resultCost').textContent = '₹' + totalCost.toLocaleString('en-IN');
            document.getElementById('resultDelivery').textContent = 'Available — Same-day in Jaunpur';

            if (resultsDiv) {
                resultsDiv.classList.add('show');
                resultsDiv.style.display = 'block';
            }

            if (window.showToast) {
                showToast('✅ Calculation complete!', 3000);
            }
        });
    }
};

window.BrickCalculator = BrickCalculator;
