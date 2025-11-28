// ============================================
// FILTER TOGGLE FUNCTIONALITY
// ============================================

function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Close filter sidebar when clicking outside (mobile)
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('filterSidebar');
    const toggleBtn = document.querySelector('.filter-toggle-btn');
    
    if (sidebar && toggleBtn && window.innerWidth <= 1024) {
        if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
            sidebar.classList.add('hidden');
        }
    }
});

// Auto-hide filter sidebar on mobile when filter is applied
if (typeof setCategory === 'function') {
    const originalSetCategory = window.setCategory;
    window.setCategory = function(category) {
        originalSetCategory(category);
        
        // Hide sidebar on mobile after filter is applied
        if (window.innerWidth <= 1024) {
            const sidebar = document.getElementById('filterSidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
        }
    };
}





