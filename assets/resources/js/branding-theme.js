// ============================================
// BRANDING & THEME FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // LOGO ANIMATIONS
    // ============================================
    
    function initLogoAnimations() {
        const logos = document.querySelectorAll('.nav-logo, .logo-link img');
        
        logos.forEach(logo => {
            // Add intro animation on load
            logo.classList.add('logo-animated');
            
            // Add glow on hover
            logo.addEventListener('mouseenter', function() {
                this.classList.add('logo-glow');
            });
            
            logo.addEventListener('mouseleave', function() {
                this.classList.remove('logo-glow');
            });
        });
    }

    // ============================================
    // THEME SYSTEM
    // ============================================
    
    function initThemeSystem() {
        // Get saved theme or detect system
        const savedTheme = localStorage.getItem('theme') || 'auto';
        const savedColor = localStorage.getItem('themeColor') || null;
        
        applyTheme(savedTheme);
        if (savedColor) {
            applyColorTheme(savedColor);
        }
        
        // Create theme toggle button
        createThemeToggle();
        createThemePicker();
        createFontSizeControls();
        createAccessibilityPanel();
    }

    function applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            theme = prefersDark.matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
    }

    function applyColorTheme(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('themeColor', color);
    }

    function createThemeToggle() {
        const existing = document.getElementById('themeToggleBtn');
        if (existing) return;
        
        const btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.className = 'theme-toggle';
        btn.innerHTML = '<i class="ion-ios-moon"></i>';
        btn.setAttribute('aria-label', 'Toggle theme');
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateThemeIcon(currentTheme, btn);
        
        btn.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const themes = ['light', 'dark', 'auto'];
            const nextIndex = (themes.indexOf(current) + 1) % themes.length;
            const nextTheme = themes[nextIndex];
            applyTheme(nextTheme);
            updateThemeIcon(nextTheme, btn);
        });
        
        document.body.appendChild(btn);
    }

    function updateThemeIcon(theme, button) {
        const btn = button || document.getElementById('themeToggleBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        if (!icon) return;
        
        const icons = {
            light: 'ion-ios-sunny',
            dark: 'ion-ios-moon',
            auto: 'ion-ios-partly-sunny'
        };
        
        icon.className = icons[theme] || icons.light;
    }

    function createThemePicker() {
        const picker = document.createElement('div');
        picker.className = 'theme-picker';
        picker.id = 'themePicker';
        picker.innerHTML = `
            <h4>Choose Theme</h4>
            <div class="theme-option" onclick="applyTheme('light')">
                <input type="radio" name="theme" value="light" id="theme-light">
                <label for="theme-light">Light</label>
            </div>
            <div class="theme-option" onclick="applyTheme('dark')">
                <input type="radio" name="theme" value="dark" id="theme-dark">
                <label for="theme-dark">Dark</label>
            </div>
            <div class="theme-option" onclick="applyTheme('auto')">
                <input type="radio" name="theme" value="auto" id="theme-auto">
                <label for="theme-auto">Auto</label>
            </div>
            <h4 style="margin-top: 20px;">Color Theme</h4>
            <div class="color-picker">
                <div class="color-option" style="background: #e67e22;" onclick="applyColorTheme('#e67e22')"></div>
                <div class="color-option" style="background: #3498db;" onclick="applyColorTheme('#3498db')"></div>
                <div class="color-option" style="background: #27ae60;" onclick="applyColorTheme('#27ae60')"></div>
                <div class="color-option" style="background: #9b59b6;" onclick="applyColorTheme('#9b59b6')"></div>
                <div class="color-option" style="background: #e74c3c;" onclick="applyColorTheme('#e74c3c')"></div>
                <div class="color-option" style="background: #f39c12;" onclick="applyColorTheme('#f39c12')"></div>
                <div class="color-option" style="background: #1abc9c;" onclick="applyColorTheme('#1abc9c')"></div>
                <div class="color-option" style="background: #34495e;" onclick="applyColorTheme('#34495e')"></div>
            </div>
        `;
        
        document.body.appendChild(picker);
        
        // Toggle picker
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('dblclick', function() {
                picker.classList.toggle('active');
            });
        }
    }

    function createFontSizeControls() {
        const controls = document.createElement('div');
        controls.className = 'font-size-controls';
        controls.innerHTML = `
            <button class="font-size-btn" onclick="changeFontSize('small')" aria-label="Small font">A-</button>
            <button class="font-size-btn" onclick="changeFontSize('medium')" aria-label="Medium font">A</button>
            <button class="font-size-btn" onclick="changeFontSize('large')" aria-label="Large font">A+</button>
            <button class="font-size-btn" onclick="changeFontSize('xlarge')" aria-label="Extra large font">A++</button>
        `;
        document.body.appendChild(controls);
    }

    function createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.className = 'accessibility-panel';
        panel.id = 'accessibilityPanel';
        panel.innerHTML = `
            <h4>Accessibility</h4>
            <div class="accessibility-option">
                <span>High Contrast</span>
                <div class="toggle-switch" onclick="toggleAccessibility('contrast', this)"></div>
            </div>
            <div class="accessibility-option">
                <span>Color Blind Mode</span>
                <div class="toggle-switch" onclick="toggleAccessibility('colorblind', this)"></div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Toggle panel button
        const accBtn = document.createElement('button');
        accBtn.className = 'theme-toggle';
        accBtn.style.top = '200px';
        accBtn.innerHTML = '<i class="ion-ios-settings"></i>';
        accBtn.setAttribute('aria-label', 'Accessibility settings');
        accBtn.addEventListener('click', function() {
            panel.classList.toggle('active');
        });
        document.body.appendChild(accBtn);
    }

    window.applyTheme = function(theme) {
        applyTheme(theme);
        const picker = document.getElementById('themePicker');
        if (picker) {
            picker.querySelector(`input[value="${theme}"]`).checked = true;
        }
    };

    window.applyColorTheme = function(color) {
        applyColorTheme(color);
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.style.background.includes(color)) {
                opt.classList.add('active');
            }
        });
    };

    window.changeFontSize = function(size) {
        document.documentElement.setAttribute('data-font-size', size);
        localStorage.setItem('fontSize', size);
    };

    window.toggleAccessibility = function(feature, toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        if (feature === 'contrast') {
            document.documentElement.setAttribute('data-contrast', isActive ? 'high' : 'normal');
            localStorage.setItem('highContrast', isActive);
        } else if (feature === 'colorblind') {
            document.documentElement.setAttribute('data-colorblind', isActive);
            localStorage.setItem('colorBlind', isActive);
        }
    };

    // ============================================
    // INITIALIZE
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initLogoAnimations();
                initThemeSystem();
                
                // Load saved preferences
                const fontSize = localStorage.getItem('fontSize') || 'medium';
                changeFontSize(fontSize);
                
                const highContrast = localStorage.getItem('highContrast') === 'true';
                if (highContrast) {
                    document.documentElement.setAttribute('data-contrast', 'high');
                }
                
                const colorBlind = localStorage.getItem('colorBlind') === 'true';
                if (colorBlind) {
                    document.documentElement.setAttribute('data-colorblind', 'true');
                }
            });
        } else {
            initLogoAnimations();
            initThemeSystem();
        }
    }

    init();

})();

