// ══════════════════════════════════════════
// SHARED FORMATTING UTILITIES
// Loaded first (before state.js and all consumers) so the helpers
// below are available as globals to every other script on the page.
// ══════════════════════════════════════════

// Format a number as an Indian Rupee string: '₹1,23,456'.
// Preserves the exact output of the previous inline pattern:
//   '₹' + Number(x).toLocaleString('en-IN')
function formatINR(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
}

// Format a number using the Indian locale grouping (no currency symbol).
// Preserves the exact output of the previous inline pattern:
//   Number(x).toLocaleString('en-IN')
function formatNum(n) {
    return Number(n || 0).toLocaleString('en-IN');
}
