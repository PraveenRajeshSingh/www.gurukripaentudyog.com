// Blog system
const blogPosts = [
    {
        id: 1,
        title: 'How to Choose the Right Bricks for Your Construction',
        titleHi: 'अपने निर्माण के लिए सही ईंटें कैसे चुनें',
        category: 'construction',
        date: '2024-01-15',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/brick.jpeg',
        excerpt: 'Learn the essential factors to consider when selecting bricks for your construction project...',
        excerptHi: 'अपने निर्माण परियोजना के लिए ईंटें चुनते समय विचार करने योग्य आवश्यक कारकों के बारे में जानें...',
        content: 'Full article content here...',
        contentHi: 'पूरा लेख सामग्री यहाँ...'
    },
    {
        id: 2,
        title: 'Benefits of Machine-Made Bricks',
        titleHi: 'मशीन से बनी ईंटों के फायदे',
        category: 'quality',
        date: '2024-01-10',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/gurukripaEnt1.png',
        excerpt: 'Discover why machine-made bricks are superior to traditional handmade bricks...',
        excerptHi: 'जानें कि मशीन से बनी ईंटें पारंपरिक हस्तनिर्मित ईंटों से बेहतर क्यों हैं...',
        content: 'Full article content here...',
        contentHi: 'पूरा लेख सामग्री यहाँ...'
    },
    {
        id: 3,
        title: 'Maintaining Brick Quality in Construction',
        titleHi: 'निर्माण में ईंट की गुणवत्ता बनाए रखना',
        category: 'tips',
        date: '2024-01-05',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/redbrick1.jpg',
        excerpt: 'Tips and tricks for maintaining brick quality during construction...',
        excerptHi: 'निर्माण के दौरान ईंट की गुणवत्ता बनाए रखने के लिए सुझाव और ट्रिक्स...',
        content: 'Full article content here...',
        contentHi: 'पूरा लेख सामग्री यहाँ...'
    }
];

const blogCategories = [
    { id: 'all', name: 'All Categories', nameHi: 'सभी श्रेणियां' },
    { id: 'construction', name: 'Construction', nameHi: 'निर्माण' },
    { id: 'quality', name: 'Quality', nameHi: 'गुणवत्ता' },
    { id: 'tips', name: 'Tips', nameHi: 'सुझाव' }
];

let currentBlogCategory = 'all';

function renderBlogPosts() {
    const container = document.getElementById('blogPosts');
    if (!container) return;
    
    const filteredPosts = currentBlogCategory === 'all' 
        ? blogPosts 
        : blogPosts.filter(post => post.category === currentBlogCategory);
    
    container.innerHTML = '';
    
    if (filteredPosts.length === 0) {
        container.innerHTML = '<div class="no-posts"><p>No blog posts found</p></div>';
        return;
    }
    
    const isHindi = currentLanguage === 'hi';
    filteredPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'blog-card';
        postCard.innerHTML = `
            <div class="blog-image">
                <img src="${post.image}" alt="${isHindi ? post.titleHi : post.title}" />
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-date">${formatDate(post.date)}</span>
                    <span class="blog-category">${getCategoryName(post.category)}</span>
                    <span class="blog-author">${post.author}</span>
                </div>
                <h3>${isHindi ? post.titleHi : post.title}</h3>
                <p>${isHindi ? post.excerptHi : post.excerpt}</p>
                <a href="#" class="btn-read-more" onclick="viewBlogPost(${post.id}); return false;">
                    ${getTranslation('readMore')}
                </a>
            </div>
        `;
        container.appendChild(postCard);
    });
}

function getCategoryName(categoryId) {
    const category = blogCategories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return currentLanguage === 'hi' ? category.nameHi : category.name;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function setBlogCategory(category) {
    currentBlogCategory = category;
    renderBlogPosts();
    updateBlogCategoryButtons();
}

function updateBlogCategoryButtons() {
    const buttons = document.querySelectorAll('.blog-category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === currentBlogCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function viewBlogPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isHindi = currentLanguage === 'hi';
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="this.closest('.blog-modal').remove()">&times;</span>
            <div class="blog-modal-body">
                <img src="${post.image}" alt="${isHindi ? post.titleHi : post.title}" />
                <div class="blog-modal-meta">
                    <span>${formatDate(post.date)}</span>
                    <span>${getCategoryName(post.category)}</span>
                    <span>${post.author}</span>
                </div>
                <h2>${isHindi ? post.titleHi : post.title}</h2>
                <div class="blog-modal-content">
                    ${isHindi ? post.contentHi : post.content}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Initialize blog on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('blogPosts')) {
        renderBlogPosts();
    }
});

