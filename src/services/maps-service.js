'use strict';
// ══════════════════════════════════════════
// GOOGLE MAPS PLATFORM & LOGISTICS ENGINE
// Provides official Geocoding, Distance Matrix, Route estimation & Serviceability
// ══════════════════════════════════════════

window.GurukripaMaps = window.GurukripaMaps || {};

(function(exports) {
    // Kiln Base Station: Nevada, Jalalpur-Chavri Road, Jaunpur UP (222001)
    const BHATTA_COORDS = { lat: 25.7476, lng: 82.6837 };
    const MAX_SERVICEABLE_KM = 120; // 120 km delivery radius around Jaunpur Bhatta

    exports.BhattaCoords = BHATTA_COORDS;
    exports.MaxServiceableKm = MAX_SERVICEABLE_KM;

    // Haversine formula fallback for calculating straight-line distance in km
    exports.calculateDistanceKm = function(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    };

    // Calculate delivery transport tariff based on road distance
    exports.calculateTransportCharge = function(distanceKm, trolleyCount = 1) {
        if (distanceKm <= 10) {
            return 500 * trolleyCount; // Local Jaunpur base flat unloading
        }
        // Base ₹500 + ₹25 per km for distance beyond 10 km
        const perKmCharge = Math.round((distanceKm - 10) * 25);
        return (500 + perKmCharge) * trolleyCount;
    };

    // Check if site PIN code or city is within delivery service area
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
            estimatedDays: query.includes('jaunpur') || query.includes('222001') ? 'Same-Day Dispatch (under 12 hrs)' : 'Scheduled (24-48 hrs)',
            baseZone: isServiceable ? 'Eastern UP Core Kiln Grid' : 'Extended Zone (Requires Custom Freight Quote)'
        };
    };

    // Initialize interactive Google Maps instance
    exports.initMapElement = function(elementId, initialMarkerCoords, options = {}) {
        const mapEl = document.getElementById(elementId);
        if (!mapEl) return null;

        if (typeof google !== 'undefined' && google.maps) {
            const map = new google.maps.Map(mapEl, {
                center: initialMarkerCoords || BHATTA_COORDS,
                zoom: options.zoom || 13,
                mapTypeControl: false,
                streetViewControl: false,
                styles: [
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
                ]
            });

            const marker = new google.maps.Marker({
                position: initialMarkerCoords || BHATTA_COORDS,
                map: map,
                title: options.title || 'Gurukripa Bricks Kiln Base Station',
                icon: options.icon || undefined
            });

            return { map, marker };
        } else {
            // Graceful fallback when Google Maps API key is waiting to be configured
            mapEl.innerHTML = `
                <div style="height:100%;min-height:180px;background:var(--bg-subtle,#F5EFE6);border:1px dashed var(--line,#E7E1DA);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center">
                    <span style="font-size:1.6rem;margin-bottom:6px">🗺️</span>
                    <strong style="font-size:0.86rem;color:var(--ink,#202124)">Google Maps Live Route &amp; GPS</strong>
                    <span style="font-size:0.75rem;color:var(--ink-3,#64666B);margin-top:2px">Kiln Base: Nevada, Jalalpur-Chavri Rd, Jaunpur (25.7476° N, 82.6837° E)</span>
                    <span style="font-size:0.72rem;background:var(--brand-glow);color:var(--brand);padding:2px 8px;border-radius:10px;margin-top:6px">Service Radius: 120 km Active</span>
                </div>`;
            return null;
        }
    };
})(window.GurukripaMaps);
