'use strict';
// ══════════════════════════════════════════
// GOOGLE MAPS PLATFORM & LOGISTICS ENGINE
// Geocoding helpers, distance, serviceability & map mount
// Canonical kiln coords = Google Place "Guru Kripa Eant Udyog, Newada, Jalalpur"
// ══════════════════════════════════════════

window.GurukripaMaps = window.GurukripaMaps || {};

(function(exports) {
    // Verified Place coordinates (contact embed / Get Directions share this pair)
    const BHATTA_COORDS = { lat: 25.6041031, lng: 82.7939421 };
    const BHATTA_ADDRESS = 'Newada, Jalalpur-Chavri Road, Jalalpur, Jaunpur (UP) — 222001';
    const PLACE_URL = 'https://www.google.com/maps/place/Guru+Kripa+Eant+Udyog,+Newada,+Jalalpur,+Jaunpur/@25.6041079,82.7913672,17z/data=!3m1!4b1!4m6!3m5!1s0x39902fb80ba0141f:0x8383316b344c0741!8m2!3d25.6041031!4d82.7939421!16s%2Fg%2F11j48jlhtf';
    const EMBED_URL = 'https://maps.google.com/maps?q=25.6041031,82.7939421&z=16&output=embed';
    const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=25.6041031,82.7939421';
    const MAX_SERVICEABLE_KM = 120;

    exports.BhattaCoords = BHATTA_COORDS;
    exports.BhattaAddress = BHATTA_ADDRESS;
    exports.PlaceUrl = PLACE_URL;
    exports.EmbedUrl = EMBED_URL;
    exports.DirectionsUrl = DIRECTIONS_URL;
    exports.MaxServiceableKm = MAX_SERVICEABLE_KM;

    exports.calculateDistanceKm = function(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    };

    exports.calculateTransportCharge = function(distanceKm, trolleyCount = 1) {
        if (distanceKm <= 10) return 500 * trolleyCount;
        const perKmCharge = Math.round((distanceKm - 10) * 25);
        return (500 + perKmCharge) * trolleyCount;
    };

    exports.checkServiceability = function(cityNameOrPincode) {
        const query = (cityNameOrPincode || '').toLowerCase().trim();
        const primaryZones = [
            'jaunpur', '222001', '222002', 'jalalpur', 'trilochan', 'kerakat',
            'badlapur', 'machhalishahar', 'mariahu', 'shahganj', 'saidpur',
            'varanasi', '221001', '221002', 'mughalsarai', 'sultanpur', 'azamgarh'
        ];
        const isServiceable = primaryZones.some(zone => query.includes(zone));
        return {
            serviceable: isServiceable,
            estimatedDays: query.includes('jaunpur') || query.includes('222001') || query.includes('jalalpur')
                ? 'Same-Day Dispatch (under 12 hrs)'
                : 'Scheduled (24-48 hrs)',
            baseZone: isServiceable ? 'Eastern UP Core Kiln Grid' : 'Extended Zone (Requires Custom Freight Quote)'
        };
    };

    /** Embed iframe (no API key). Used when Maps JS SDK is not configured. */
    exports.renderEmbedFallback = function(mapEl, options) {
        if (!mapEl) return;
        const title = (options && options.title) || 'Gurukripa Bricks — Newada Yard';
        const note = (options && options.note) || 'Yard location on Google Maps. Live trolley GPS is not available on this site.';
        mapEl.innerHTML =
            '<div class="gb-map-fallback">' +
              '<div class="gb-map-fallback__frame-wrap">' +
                '<iframe class="gb-map-fallback__frame" src="' + EMBED_URL + '" title="' + title.replace(/"/g, '') + '" ' +
                  'loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
              '</div>' +
              '<div class="gb-map-fallback__meta">' +
                '<strong>' + title + '</strong>' +
                '<span>' + BHATTA_ADDRESS + '</span>' +
                '<span class="gb-map-fallback__note">' + note + '</span>' +
                '<div class="gb-map-fallback__actions">' +
                  '<a class="btn btn-primary btn-sm" href="' + DIRECTIONS_URL + '" target="_blank" rel="noopener">Get Directions</a>' +
                  '<a class="btn btn-outline btn-sm" href="' + PLACE_URL + '" target="_blank" rel="noopener">Open in Google Maps</a>' +
                '</div>' +
              '</div>' +
            '</div>';
    };

    function ensureMapHostSize(mapEl) {
        if (!mapEl) return;
        mapEl.classList.add('gb-map-host');
        if (!mapEl.style.minHeight) mapEl.style.minHeight = '180px';
        if (!mapEl.style.width) mapEl.style.width = '100%';
    }

    function invalidateMapSize(map) {
        if (!map || typeof google === 'undefined' || !google.maps) return;
        try {
            google.maps.event.trigger(map, 'resize');
            const c = map.getCenter && map.getCenter();
            if (c) map.setCenter(c);
        } catch (_e) { /* ignore */ }
    }

    exports.initMapElement = function(elementId, initialMarkerCoords, options) {
        options = options || {};
        const mapEl = document.getElementById(elementId);
        if (!mapEl) return null;
        ensureMapHostSize(mapEl);

        const center = initialMarkerCoords || BHATTA_COORDS;

        if (typeof google !== 'undefined' && google.maps) {
            // Reuse existing map instance if the host was already initialized.
            if (mapEl._gbMap) {
                mapEl._gbMap.setCenter(center);
                if (mapEl._gbMarker) mapEl._gbMarker.setPosition(center);
                setTimeout(function () { invalidateMapSize(mapEl._gbMap); }, 120);
                return { map: mapEl._gbMap, marker: mapEl._gbMarker };
            }
            try {
                const map = new google.maps.Map(mapEl, {
                    center: center,
                    zoom: options.zoom || 15,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy',
                    styles: [
                        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
                    ]
                });
                const marker = new google.maps.Marker({
                    position: center,
                    map: map,
                    title: options.title || 'Gurukripa Bricks Kiln — Newada, Jalalpur'
                });
                mapEl._gbMap = map;
                mapEl._gbMarker = marker;
                // Modal/sheet open animations leave the canvas at 0×0 until painted.
                setTimeout(function () { invalidateMapSize(map); }, 80);
                setTimeout(function () { invalidateMapSize(map); }, 320);
                if (window.visualViewport) {
                    const onVV = function () { invalidateMapSize(map); };
                    window.visualViewport.addEventListener('resize', onVV, { passive: true });
                    mapEl._gbVvHandler = onVV;
                }
                return { map, marker };
            } catch (_err) {
                exports.renderEmbedFallback(mapEl, options);
                return null;
            }
        }

        exports.renderEmbedFallback(mapEl, options);
        return null;
    };

    exports.invalidateMapIn = function(elementId) {
        const mapEl = document.getElementById(elementId);
        if (mapEl && mapEl._gbMap) invalidateMapSize(mapEl._gbMap);
    };

    exports.invalidateAll = function() {
        if (!document || typeof document.querySelectorAll !== 'function') return;
        document.querySelectorAll('.gb-map-host, #trackerMapContainer, .tracker-map-container').forEach(function (el) {
            if (el && el._gbMap) invalidateMapSize(el._gbMap);
        });
    };

    // Reflow after modal/sheet animation, orientation, or visualViewport keyboard resize.
    // Guard addEventListener so Node/test sandboxes (and non-DOM hosts) can still load the module.
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('gb:overlay-layout', function () {
            setTimeout(exports.invalidateAll, 80);
            setTimeout(exports.invalidateAll, 320);
        }, { passive: true });
        window.addEventListener('orientationchange', function () {
            setTimeout(exports.invalidateAll, 200);
            setTimeout(exports.invalidateAll, 500);
        }, { passive: true });
    }
    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
        window.visualViewport.addEventListener('resize', function () {
            if (document.body && document.body.classList.contains('overlay-open')) {
                exports.invalidateAll();
            }
        }, { passive: true });
    }

    function readBrowserMapsKey() {
        try {
            var meta = document.querySelector('meta[name="google-maps-api-key"]');
            var key = meta && meta.content ? String(meta.content).trim() : '';
            if (!key || /^YOUR_/i.test(key)) return '';
            return key;
        } catch (_e) {
            return '';
        }
    }

    var _mapsSdkPromise = null;
    var _leafletPromise = null;

    /** Load Google Maps JS when a browser key is configured (referrer-restricted). */
    exports.loadGoogleMapsSdk = function () {
        if (typeof google !== 'undefined' && google.maps) return Promise.resolve(google.maps);
        var key = readBrowserMapsKey();
        if (!key) return Promise.reject(new Error('NO_GOOGLE_KEY'));
        if (_mapsSdkPromise) return _mapsSdkPromise;
        _mapsSdkPromise = new Promise(function (resolve, reject) {
            var cb = '__gbMapsReady_' + Date.now();
            window[cb] = function () {
                try { delete window[cb]; } catch (_e) { /* ignore */ }
                if (typeof google !== 'undefined' && google.maps) resolve(google.maps);
                else reject(new Error('Google Maps failed to initialize'));
            };
            var s = document.createElement('script');
            s.async = true;
            s.defer = true;
            s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) +
                '&libraries=places&callback=' + cb;
            s.onerror = function () {
                _mapsSdkPromise = null;
                reject(new Error('Google Maps script failed to load'));
            };
            document.head.appendChild(s);
        });
        return _mapsSdkPromise;
    };

    exports.loadLeaflet = function () {
        if (window.L && window.L.map) return Promise.resolve(window.L);
        if (_leafletPromise) return _leafletPromise;
        _leafletPromise = new Promise(function (resolve, reject) {
            var cssId = 'gb-leaflet-css';
            if (!document.getElementById(cssId)) {
                var link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }
            var s = document.createElement('script');
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            s.crossOrigin = '';
            s.onload = function () {
                if (window.L) resolve(window.L);
                else reject(new Error('Leaflet missing after load'));
            };
            s.onerror = function () {
                _leafletPromise = null;
                reject(new Error('Leaflet failed to load'));
            };
            document.head.appendChild(s);
        });
        return _leafletPromise;
    };

    /**
     * Interactive nearby map: Google Maps when key/SDK available, else Leaflet + OSM tiles.
     * options: { user, suppliers, onSelect, zoom }
     */
    exports.initNearbyMap = function (elementId, options) {
        options = options || {};
        var mapEl = document.getElementById(elementId);
        if (!mapEl) return Promise.resolve(null);
        ensureMapHostSize(mapEl);
        mapEl.style.minHeight = mapEl.style.minHeight || '280px';

        var user = options.user || BHATTA_COORDS;
        var suppliers = options.suppliers || [];
        var onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;

        function mountGoogle() {
            return exports.loadGoogleMapsSdk().then(function () {
                if (mapEl._gbNearbyTeardown) mapEl._gbNearbyTeardown();
                var map = new google.maps.Map(mapEl, {
                    center: { lat: user.lat, lng: user.lng },
                    zoom: options.zoom || 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    gestureHandling: 'greedy'
                });
                var markers = [];
                var userMarker = new google.maps.Marker({
                    position: { lat: user.lat, lng: user.lng },
                    map: map,
                    title: 'Your location',
                    zIndex: 999,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 9,
                        fillColor: '#0369a1',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    }
                });
                markers.push(userMarker);
                var info = new google.maps.InfoWindow();
                var bounds = new google.maps.LatLngBounds();
                bounds.extend(userMarker.getPosition());
                suppliers.forEach(function (s) {
                    if (s.lat == null || s.lng == null) return;
                    var m = new google.maps.Marker({
                        position: { lat: s.lat, lng: s.lng },
                        map: map,
                        title: s.name
                    });
                    m.addListener('click', function () {
                        var dist = s.distanceKm != null ? (s.distanceKm + ' km') : '';
                        var addr = s.address ? '<div>' + String(s.address).replace(/</g, '&lt;') + '</div>' : '';
                        info.setContent(
                            '<div class="gb-map-popup"><strong>' + String(s.name).replace(/</g, '&lt;') +
                            '</strong>' + (dist ? '<div>' + dist + '</div>' : '') + addr + '</div>'
                        );
                        info.open(map, m);
                        if (onSelect) onSelect(s);
                    });
                    markers.push(m);
                    bounds.extend(m.getPosition());
                });
                if (suppliers.length) map.fitBounds(bounds, 48);
                mapEl._gbMap = map;
                mapEl._gbNearbyTeardown = function () {
                    markers.forEach(function (m) { m.setMap(null); });
                    info.close();
                };
                mapEl._gbNearbyApi = {
                    provider: 'google',
                    locateMe: function () {
                        map.setCenter({ lat: user.lat, lng: user.lng });
                        map.setZoom(14);
                    },
                    setUser: function (u) {
                        user = u;
                        userMarker.setPosition({ lat: u.lat, lng: u.lng });
                        map.setCenter({ lat: u.lat, lng: u.lng });
                    },
                    resize: function () { invalidateMapSize(map); }
                };
                setTimeout(function () { invalidateMapSize(map); }, 120);
                return mapEl._gbNearbyApi;
            });
        }

        function mountLeaflet() {
            return exports.loadLeaflet().then(function (L) {
                if (mapEl._gbNearbyTeardown) mapEl._gbNearbyTeardown();
                mapEl.innerHTML = '';
                var map = L.map(mapEl, {
                    zoomControl: true,
                    attributionControl: true
                }).setView([user.lat, user.lng], options.zoom || 12);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);
                var layer = L.layerGroup().addTo(map);
                var userMarker = L.circleMarker([user.lat, user.lng], {
                    radius: 9,
                    color: '#fff',
                    weight: 2,
                    fillColor: '#0369a1',
                    fillOpacity: 1
                }).bindPopup('Your location').addTo(layer);
                var bounds = [[user.lat, user.lng]];
                suppliers.forEach(function (s) {
                    if (s.lat == null || s.lng == null) return;
                    var m = L.marker([s.lat, s.lng]).addTo(layer);
                    var dist = s.distanceKm != null ? (s.distanceKm + ' km · ') : '';
                    var addr = s.address || '';
                    m.bindPopup('<strong>' + String(s.name).replace(/</g, '&lt;') + '</strong><br>' +
                        dist + String(addr).replace(/</g, '&lt;'));
                    m.on('click', function () { if (onSelect) onSelect(s); });
                    bounds.push([s.lat, s.lng]);
                });
                if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36] });
                mapEl._gbNearbyTeardown = function () {
                    try { map.remove(); } catch (_e) { /* ignore */ }
                    mapEl.innerHTML = '';
                };
                mapEl._gbNearbyApi = {
                    provider: 'leaflet',
                    locateMe: function () {
                        map.setView([user.lat, user.lng], 14);
                        userMarker.openPopup();
                    },
                    setUser: function (u) {
                        user = u;
                        userMarker.setLatLng([u.lat, u.lng]);
                        map.setView([u.lat, u.lng], map.getZoom());
                    },
                    resize: function () { try { map.invalidateSize(); } catch (_e) { /* ignore */ } }
                };
                setTimeout(function () {
                    try { map.invalidateSize(); } catch (_e) { /* ignore */ }
                }, 160);
                return mapEl._gbNearbyApi;
            });
        }

        return mountGoogle().catch(function () {
            return mountLeaflet();
        }).catch(function () {
            var q = user.lat + ',' + user.lng;
            mapEl.innerHTML =
                '<div class="gb-map-fallback">' +
                '<div class="gb-map-fallback__frame-wrap">' +
                '<iframe class="gb-map-fallback__frame" src="https://maps.google.com/maps?q=' +
                encodeURIComponent(q) + '&z=12&output=embed" title="Nearby map" loading="lazy" ' +
                'referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
                '<div class="gb-map-fallback__meta"><strong>Map preview</strong>' +
                '<span>Interactive markers require network access to map tiles.</span></div></div>';
            mapEl._gbNearbyApi = {
                provider: 'embed',
                locateMe: function () {},
                setUser: function () {},
                resize: function () {}
            };
            return mapEl._gbNearbyApi;
        });
    };
})(window.GurukripaMaps);
