const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Brick estimator mathematical models used in calculator.js
function calculateWall(len, ht, thick, price) {
    const area = len * ht;
    const bricks = Math.ceil(area * 8.6 * (thick / 4.5));
    const trolleys = Number((bricks / 4000).toFixed(1));
    const totalCost = Math.ceil(bricks * price);
    const cementBags = Math.ceil(bricks * 0.007);
    const sandCuFt = Math.ceil(bricks * 0.35);
    return { bricks, trolleys, totalCost, cementBags, sandCuFt };
}

function calculateHouse(sqft, floors, price) {
    const bricks = Math.ceil(sqft * floors * 19);
    const trolleys = Number((bricks / 4000).toFixed(1));
    const totalCost = Math.ceil(bricks * price);
    const cementBags = Math.ceil(sqft * floors * 0.4);
    const sandCuFt = Math.ceil(sqft * floors * 1.8);
    return { bricks, trolleys, totalCost, cementBags, sandCuFt };
}

function calculateBoundary(len, ht, price = 7.05) {
    const bricks = Math.ceil(len * ht * 9.5);
    const trolleys = Number((bricks / 4000).toFixed(1));
    const totalCost = Math.ceil(bricks * price);
    return { bricks, trolleys, totalCost };
}

describe('Estimator Mathematical Formulas', () => {
    test('Standard Wall (20x10ft, 9-inch wall, ₹12/brick)', () => {
        const res = calculateWall(20, 10, 9, 12);
        // area = 200 sq.ft; 200 * 8.6 * (9 / 4.5) = 200 * 8.6 * 2 = 3440 bricks
        assert.equal(res.bricks, 3440);
        assert.equal(res.trolleys, 0.9);
        assert.equal(res.totalCost, 41280);
        assert.equal(res.cementBags, Math.ceil(3440 * 0.007));
        assert.equal(res.sandCuFt, Math.ceil(3440 * 0.35));
    });

    test('House estimation (1000 sqft, 2 floors, ₹7.05/brick)', () => {
        const res = calculateHouse(1000, 2, 7.05);
        // 1000 * 2 * 19 = 38000 bricks
        assert.equal(res.bricks, 38000);
        assert.equal(res.trolleys, 9.5);
        assert.equal(res.totalCost, Math.ceil(38000 * 7.05)); // 267900
        assert.equal(res.cementBags, 800); // 1000 * 2 * 0.4
        assert.equal(res.sandCuFt, 3600); // 1000 * 2 * 1.8
    });

    test('Boundary wall estimation (150ft length, 6ft height)', () => {
        const res = calculateBoundary(150, 6, 7.05);
        // 150 * 6 * 9.5 = 8550 bricks
        assert.equal(res.bricks, 8550);
        assert.equal(res.trolleys, 2.1);
        assert.equal(res.totalCost, Math.ceil(8550 * 7.05));
    });
});
