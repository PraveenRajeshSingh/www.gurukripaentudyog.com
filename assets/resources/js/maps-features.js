// ============================================
// GOOGLE MAPS ENHANCEMENTS
// ============================================

(function() {
    'use strict';

    // ============================================
    // ANIMATED MAP MARKER
    // ============================================
    
    function initAnimatedMapMarker() {
        const mapIframe = document.querySelector('.contact-map iframe');
        if (!mapIframe) return;

        // Add custom marker styling via URL parameters
        const currentSrc = mapIframe.src;
        if (!currentSrc.includes('&marker')) {
            // Add marker animation
            const newSrc = currentSrc + '&marker=animation:bounce';
            mapIframe.src = newSrc;
        }
    }

    // ============================================
    // DARK MODE MAP
    // ============================================
    
    function initDarkModeMap() {
        const mapIframe = document.querySelector('.contact-map iframe');
        if (!mapIframe) return;

        function updateMapTheme() {
            const theme = document.documentElement.getAttribute('data-theme');
            const currentSrc = mapIframe.src;
            
            // Remove existing style parameter
            let newSrc = currentSrc.split('&style=')[0];
            
            if (theme === 'dark') {
                // Dark map style
                const darkStyle = encodeURIComponent(JSON.stringify([
                    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
                ]));
                newSrc += '&style=' + darkStyle;
            }
            
            mapIframe.src = newSrc;
        }

        // Watch for theme changes
        const observer = new MutationObserver(updateMapTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // Initial theme
        updateMapTheme();
    }

    // ============================================
    // MULTI-LOCATION SUPPORT
    // ============================================
    
    function initMultiLocation() {
        const locations = [
            {
                name: 'Main Office',
                lat: 25.6041,
                lng: 82.7914,
                address: 'Jalalpur, Jaunpur'
            },
            {
                name: 'Branch 1',
                lat: 25.7551,
                lng: 82.6837,
                address: 'Jaunpur'
            },
            {
                name: 'Branch 2',
                lat: 25.3176,
                lng: 82.9739,
                address: 'Varanasi'
            }
        ];

        // Create location selector
        const locationSelector = document.createElement('div');
        locationSelector.className = 'location-selector';
        locationSelector.innerHTML = `
            <select class="location-dropdown" onchange="switchMapLocation(this.value)">
                ${locations.map((loc, index) => `
                    <option value="${index}">${loc.name} - ${loc.address}</option>
                `).join('')}
            </select>
        `;

        const contactMap = document.querySelector('.contact-map');
        if (contactMap) {
            contactMap.parentElement.insertBefore(locationSelector, contactMap);
        }

        window.switchMapLocation = function(index) {
            const location = locations[index];
            const mapIframe = document.querySelector('.contact-map iframe');
            if (mapIframe && location) {
                mapIframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2843.75099685615!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDM2JzE0LjgiTiA4MsKwNDcnMjkuMCJF!5e0!3m2!1sen!2sin!4v1234567890!5m2!1sen!2sin`;
            }
        };
    }

    // ============================================
    // STORE LOCATOR WITH FILTERS
    // ============================================
    
    function initStoreLocator() {
        // Add store locator button
        const locatorBtn = document.createElement('button');
        locatorBtn.className = 'btn btn-primary';
        locatorBtn.textContent = 'Find Nearest Store';
        locatorBtn.style.marginTop = '20px';
        locatorBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    findNearestStore(userLat, userLng);
                });
            } else {
                if (typeof showToast === 'function') {
                    showToast('Error', 'Geolocation not supported', 'error');
                }
            }
        });

        const contactSection = document.querySelector('.section-contact');
        if (contactSection) {
            const mapContainer = contactSection.querySelector('.contact-map');
            if (mapContainer) {
                mapContainer.parentElement.appendChild(locatorBtn);
            }
        }
    }

    function findNearestStore(userLat, userLng) {
        const stores = [
            { name: 'Jalalpur', lat: 25.6041, lng: 82.7914 },
            { name: 'Jaunpur', lat: 25.7551, lng: 82.6837 },
            { name: 'Varanasi', lat: 25.3176, lng: 82.9739 }
        ];

        let nearest = stores[0];
        let minDistance = calculateDistance(userLat, userLng, stores[0].lat, stores[0].lng);

        stores.forEach(store => {
            const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = store;
            }
        });

        if (typeof showToast === 'function') {
            showToast('Nearest Store', `${nearest.name} (${Math.round(minDistance)} km away)`, 'success');
        }
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // ============================================
    // CLICKABLE DIRECTIONS BUTTON
    // ============================================
    
    function initDirectionsButton() {
        const directionsBtn = document.createElement('a');
        directionsBtn.href = 'https://www.google.com/maps/dir/?api=1&destination=25.6041,82.7914';
        directionsBtn.target = '_blank';
        directionsBtn.className = 'btn btn-primary';
        directionsBtn.innerHTML = '<i class="ion-ios-navigate"></i> Get Directions';
        directionsBtn.style.marginTop = '15px';
        directionsBtn.style.display = 'inline-flex';
        directionsBtn.style.alignItems = 'center';
        directionsBtn.style.gap = '8px';

        const contactMap = document.querySelector('.contact-map');
        if (contactMap) {
            contactMap.parentElement.appendChild(directionsBtn);
        }
    }

    // ============================================
    // CUSTOM MAP STYLING
    // ============================================
    
    function initCustomMapStyling() {
        const mapIframe = document.querySelector('.contact-map iframe');
        if (!mapIframe) return;

        // Add branded colors to map
        const currentSrc = mapIframe.src;
        if (!currentSrc.includes('&style=')) {
            const customStyle = encodeURIComponent(JSON.stringify([
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#e67e22' }]
                }
            ]));
            
            mapIframe.src = currentSrc + '&style=' + customStyle;
        }
    }

    // ============================================
    // INITIALIZE
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initAnimatedMapMarker();
                initDarkModeMap();
                initMultiLocation();
                initStoreLocator();
                initDirectionsButton();
                initCustomMapStyling();
            });
        } else {
            initAnimatedMapMarker();
            initDarkModeMap();
            initMultiLocation();
            initStoreLocator();
            initDirectionsButton();
            initCustomMapStyling();
        }
    }

    init();

})();

