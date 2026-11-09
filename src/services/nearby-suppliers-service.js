'use strict';
/**
 * Nearby Brick Bhatta & Eent Supplier Finder
 * Real location-based discovery via browser Geolocation + OpenStreetMap Overpass.
 * Never invents prices, ratings, phones, or availability.
 */
window.GurukripaNearby = window.GurukripaNearby || {};

(function (exports) {
    var OVERPASS_ENDPOINTS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
    ];
    var NOMINATIM = 'https://nominatim.openstreetmap.org';
    var BDC_REVERSE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
    var CACHE_TTL_MS = 10 * 60 * 1000;
    var SAVED_KEY = 'gb_saved_suppliers';
    var SESSION_LOC_KEY = 'gb_nearby_session_loc';
    var _cache = Object.create(null);
    var _userLocation = null;
    var _lastResults = [];

    var BRICK_TYPES = [
        {
            id: 'first-class',
            name: 'First-Class Red Clay Bricks',
            nameHi: 'प्रथम श्रेणी लाल मिट्टी ईंट',
            img: 'src/assets/images/optimized/product-3-480.jpg',
            desc: 'Dense, well-burnt red clay bricks commonly specified for residential masonry when test certificates confirm compressive strength for the project.',
            applications: ['Residential house construction', 'Load-bearing masonry (when certified for the design)'],
            dimensions: 'Typically ~230 × 110 × 70 mm (confirm with supplier)',
            priceHint: null,
            keywords: ['first class', 'awwal', 'grade-a', 'grade a', 'pratham', 'red clay', 'eent', 'ईंट']
        },
        {
            id: 'second-class',
            name: 'Second-Class Bricks',
            nameHi: 'द्वितीय श्रेणी ईंट',
            img: 'src/assets/images/optimized/product-2-480.jpg',
            desc: 'Generally used for appropriate non-critical or plastered masonry where the project specification allows second-class bricks.',
            applications: ['General construction where specified', 'Partition and plastered walls per engineer'],
            dimensions: 'Varies by kiln — verify before ordering',
            priceHint: null,
            keywords: ['second class', 'laal peti', 'standard', 'common']
        },
        {
            id: 'fly-ash',
            name: 'Fly Ash Bricks',
            nameHi: 'फ्लाई ऐश ब्रिक',
            img: 'src/assets/images/optimized/product-red-480.jpg',
            desc: 'Machine-pressed masonry units with relatively uniform dimensions. Suitability depends on tested properties and structural design.',
            applications: ['Masonry alternative where codes/engineer allow', 'Partition walls'],
            dimensions: 'Often ~230 × 110 × 70 mm (supplier-specific)',
            priceHint: null,
            keywords: ['fly ash', 'flyash', 'fa brick']
        },
        {
            id: 'wire-cut',
            name: 'Wire-Cut Bricks',
            nameHi: 'वायर-कट ईंट',
            img: 'src/assets/images/optimized/product-1-480.jpg',
            desc: 'Extruded/wire-cut bricks with uniform shape and finish. Confirm compressive strength and moisture absorption for the intended use.',
            applications: ['Exposed brickwork', 'Modern masonry finishes'],
            dimensions: 'Machine-controlled; ask supplier for exact mm',
            priceHint: null,
            keywords: ['wire cut', 'wirecut', 'machine made', 'machine-made']
        },
        {
            id: 'aac',
            name: 'AAC Blocks',
            nameHi: 'AAC ब्लॉक',
            img: 'src/assets/images/optimized/product-trolley-480.jpg',
            desc: 'Autoclaved aerated concrete blocks used for lightweight wall construction when the structural system is designed for AAC.',
            applications: ['Lightweight wall construction', 'Partition walls'],
            dimensions: 'Commonly 600 × 200 × 100–200 mm (confirm)',
            priceHint: null,
            keywords: ['aac', 'autoclaved', 'aerated']
        },
        {
            id: 'concrete-block',
            name: 'Concrete Blocks',
            nameHi: 'कंक्रीट ब्लॉक',
            img: 'src/assets/images/optimized/product-trolley-480.jpg',
            desc: 'Concrete masonry units for structural or partition applications according to project specifications and tested grades.',
            applications: ['Structural / partition CMU as specified', 'Compound walls'],
            dimensions: 'Varies — request grade and size sheet',
            priceHint: null,
            keywords: ['concrete block', 'cmu', 'cement block', 'hollow block']
        }
    ];

    function verifiedGurukripa() {
        var maps = window.GurukripaMaps || {};
        var coords = maps.BhattaCoords || { lat: 25.6041031, lng: 82.7939421 };
        var products = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) ? PRODUCTS : [];
        var awwal = products.find(function (p) { return p.category === 'awwal'; });
        var laal = products.find(function (p) { return p.category === 'laal-peti'; });
        var wire = products.find(function (p) { return p.category === 'machine-made'; });
        var brickTypes = ['first-class', 'second-class', 'wire-cut'];
        var pricePerBrick = awwal && typeof awwal.price === 'number' ? awwal.price : null;
        var priceNote = [];
        if (awwal) priceNote.push('Awwal ₹' + awwal.price + '/pc (catalogue)');
        if (laal) priceNote.push('Laal Peti ₹' + laal.price + '/pc (catalogue)');
        if (wire) priceNote.push('Wirecut ₹' + wire.price + '/pc (catalogue)');

        return {
            id: 'gurukripa-verified',
            source: 'verified',
            verified: true,
            name: 'Gurukripa Bricks Industry (Guru Kripa Eant Udyog)',
            nameHi: 'गुरुकृपा ईंट उद्योग',
            lat: coords.lat,
            lng: coords.lng,
            address: maps.BhattaAddress || 'Newada, Jalalpur-Chavri Road, Jalalpur, Jaunpur (UP) — 222001',
            locality: 'Newada, Jalalpur',
            city: 'Jaunpur',
            district: 'Jaunpur',
            pincode: '222001',
            phone: '919198923230',
            whatsapp: '919198923230',
            website: 'https://www.gurukripaentudyog.com',
            image: 'src/assets/images/optimized/product-3-480.jpg',
            brickTypes: brickTypes,
            pricePerBrick: pricePerBrick,
            priceConfidence: pricePerBrick != null ? 'catalogue' : null,
            priceNote: priceNote.join(' · ') || null,
            bulkPrice: awwal ? 28200 : null,
            bulkUnit: 'per trolley (4,000 pcs)',
            minOrderQty: 4000,
            rating: null,
            reviewCount: null,
            deliveryAvailable: true,
            deliveryNote: 'Same-day dispatch in Jaunpur core; scheduled to nearby districts',
            operatingStatus: 'Verified yard · Mon–Sat 8AM–6PM',
            manufacturer: true,
            wholesale: true,
            categories: ['brick-bhatta', 'manufacturer', 'first-class', 'second-class', 'wire-cut'],
            osmId: null,
            placeUrl: maps.PlaceUrl || null
        };
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var maps = window.GurukripaMaps;
        if (maps && typeof maps.calculateDistanceKm === 'function') {
            return maps.calculateDistanceKm(lat1, lon1, lat2, lon2);
        }
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }

    function inferBrickTypes(tags, name) {
        var blob = ((name || '') + ' ' + Object.values(tags || {}).join(' ')).toLowerCase();
        var found = [];
        BRICK_TYPES.forEach(function (bt) {
            if (bt.keywords.some(function (k) { return blob.indexOf(k) !== -1; })) found.push(bt.id);
        });
        if (/kiln|bhatta|भट्ठा|brick|ईंट|eent/.test(blob) && found.indexOf('first-class') === -1) {
            found.push('first-class');
        }
        if (/building.?material|hardware|construction/.test(blob) && !found.length) {
            found.push('second-class');
        }
        return found;
    }

    function inferCategories(tags, name, brickTypes) {
        var blob = ((name || '') + ' ' + Object.values(tags || {}).join(' ')).toLowerCase();
        var cats = brickTypes.slice();
        if (tags.man_made === 'kiln' || /bhatta|भट्ठा|kiln/.test(blob)) cats.push('brick-bhatta');
        if (tags.craft === 'brick' || /manufacturer|udyog|उद्योग|factory/.test(blob)) cats.push('manufacturer');
        if (tags.shop === 'building_materials' || /dealer|supplier|wholesale|depot/.test(blob)) cats.push('dealer');
        if (/wholesale|व्यापार/.test(blob)) cats.push('wholesale');
        return Array.from(new Set(cats));
    }

    function formatAddress(tags) {
        if (!tags) return '';
        if (tags['addr:full']) return tags['addr:full'];
        var parts = [
            tags['addr:housenumber'],
            tags['addr:street'] || tags['addr:road'],
            tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:locality'],
            tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
            tags['addr:district'] || tags['addr:state_district'],
            tags['addr:state'],
            tags['addr:postcode']
        ].filter(Boolean);
        return parts.join(', ');
    }

    function normalizeOsmElement(el) {
        var tags = el.tags || {};
        var lat = el.lat != null ? el.lat : (el.center && el.center.lat);
        var lng = el.lon != null ? el.lon : (el.center && el.center.lon);
        if (lat == null || lng == null) return null;
        var name = tags.name || tags['name:en'] || tags['name:hi'] || tags.brand || tags.operator;
        if (!name) {
            if (tags.man_made === 'kiln') name = 'Brick kiln (OpenStreetMap)';
            else if (tags.craft === 'brick') name = 'Brick craft (OpenStreetMap)';
            else if (tags.shop === 'building_materials') name = 'Building materials shop (OpenStreetMap)';
            else return null;
        }
        var phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null;
        if (phone) phone = String(phone).replace(/[^\d+]/g, '');
        var brickTypes = inferBrickTypes(tags, name);
        var categories = inferCategories(tags, name, brickTypes);
        return {
            id: 'osm-' + el.type + '-' + el.id,
            source: 'openstreetmap',
            verified: false,
            name: name,
            nameHi: tags['name:hi'] || null,
            lat: lat,
            lng: lng,
            address: formatAddress(tags) || null,
            locality: tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:locality'] || null,
            city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || null,
            district: tags['addr:district'] || tags['addr:state_district'] || null,
            pincode: tags['addr:postcode'] || null,
            phone: phone,
            whatsapp: phone,
            website: tags.website || tags['contact:website'] || null,
            image: null,
            brickTypes: brickTypes,
            pricePerBrick: null,
            priceConfidence: null,
            priceNote: null,
            bulkPrice: null,
            bulkUnit: null,
            minOrderQty: null,
            rating: null,
            reviewCount: null,
            deliveryAvailable: tags.delivery === 'yes' || tags['delivery:yes'] === 'yes' ? true : null,
            deliveryNote: null,
            operatingStatus: tags.opening_hours || null,
            manufacturer: categories.indexOf('manufacturer') !== -1 || categories.indexOf('brick-bhatta') !== -1,
            wholesale: categories.indexOf('wholesale') !== -1,
            categories: categories,
            osmId: el.type + '/' + el.id,
            placeUrl: 'https://www.openstreetmap.org/' + el.type + '/' + el.id
        };
    }

    function attachDistance(list, lat, lng) {
        return list.map(function (s) {
            var copy = Object.assign({}, s);
            copy.distanceKm = haversineKm(lat, lng, s.lat, s.lng);
            return copy;
        }).sort(function (a, b) { return a.distanceKm - b.distanceKm; });
    }

    function dedupeSuppliers(list) {
        var seen = Object.create(null);
        var out = [];
        list.forEach(function (s) {
            var key = (s.name || '').toLowerCase().replace(/\s+/g, ' ').trim() + '|' +
                Math.round(s.lat * 1000) + '|' + Math.round(s.lng * 1000);
            if (seen[key]) return;
            seen[key] = true;
            out.push(s);
        });
        return out;
    }

    function buildOverpassQuery(lat, lng, radiusM) {
        var r = Math.max(1000, Math.min(radiusM, 80000));
        return '[out:json][timeout:28];' +
            '(' +
            'node["man_made"="kiln"](around:' + r + ',' + lat + ',' + lng + ');' +
            'way["man_made"="kiln"](around:' + r + ',' + lat + ',' + lng + ');' +
            'node["craft"="brick"](around:' + r + ',' + lat + ',' + lng + ');' +
            'way["craft"="brick"](around:' + r + ',' + lat + ',' + lng + ');' +
            'node["shop"="building_materials"](around:' + r + ',' + lat + ',' + lng + ');' +
            'way["shop"="building_materials"](around:' + r + ',' + lat + ',' + lng + ');' +
            'node["name"~"bhatta|भट्ठा|ईंट|brick kiln|brick udyog|eent|fly ash|AAC block|wire.?cut",i](around:' + r + ',' + lat + ',' + lng + ');' +
            'way["name"~"bhatta|भट्ठा|ईंट|brick kiln|brick udyog|eent|fly ash|AAC block|wire.?cut",i](around:' + r + ',' + lat + ',' + lng + ');' +
            ');' +
            'out center tags 60;';
    }

    function fetchOverpass(query) {
        var body = 'data=' + encodeURIComponent(query);
        var errors = [];
        function tryOne(i) {
            if (i >= OVERPASS_ENDPOINTS.length) {
                return Promise.reject(new Error(errors.join('; ') || 'Overpass unavailable'));
            }
            return fetch(OVERPASS_ENDPOINTS[i], {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: body
            }).then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            }).catch(function (err) {
                errors.push(OVERPASS_ENDPOINTS[i] + ': ' + (err && err.message ? err.message : err));
                return tryOne(i + 1);
            });
        }
        return tryOne(0);
    }

    function cacheGet(key) {
        var hit = _cache[key];
        if (!hit) return null;
        if (Date.now() - hit.at > CACHE_TTL_MS) {
            delete _cache[key];
            return null;
        }
        return hit.data;
    }

    function cacheSet(key, data) {
        _cache[key] = { at: Date.now(), data: data };
    }

    /** Geolocation — permission prompted by the browser. Coords kept in-memory / session only. */
    exports.detectLocation = function (options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
            if (!navigator.geolocation) {
                reject({ code: 'UNSUPPORTED', message: 'Geolocation is not supported in this browser.' });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var loc = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        source: 'gps',
                        detectedAt: Date.now()
                    };
                    _userLocation = loc;
                    try {
                        sessionStorage.setItem(SESSION_LOC_KEY, JSON.stringify({
                            lat: loc.lat,
                            lng: loc.lng,
                            source: 'gps',
                            at: loc.detectedAt
                        }));
                    } catch (_e) { /* ignore */ }
                    resolve(loc);
                },
                function (err) {
                    var code = 'ERROR';
                    if (err && err.code === 1) code = 'PERMISSION_DENIED';
                    else if (err && err.code === 2) code = 'UNAVAILABLE';
                    else if (err && err.code === 3) code = 'TIMEOUT';
                    reject({
                        code: code,
                        message: err && err.message ? err.message : 'Unable to read location.'
                    });
                },
                {
                    enableHighAccuracy: !!options.highAccuracy,
                    timeout: options.timeout || 12000,
                    maximumAge: options.maximumAge != null ? options.maximumAge : 60000
                }
            );
        });
    };

    exports.reverseGeocode = function (lat, lng) {
        return fetch(BDC_REVERSE + '?latitude=' + encodeURIComponent(lat) +
            '&longitude=' + encodeURIComponent(lng) + '&localityLanguage=en')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('BDC failed')); })
            .then(function (data) {
                return {
                    area: data.localityInfo && data.localityInfo.administrative
                        ? (data.localityInfo.administrative[0] && data.localityInfo.administrative[0].name) : null,
                    locality: data.locality || data.city || null,
                    city: data.city || data.locality || null,
                    district: data.principalSubdivision || null,
                    state: data.principalSubdivision || null,
                    pincode: data.postcode || null,
                    country: data.countryName || null,
                    label: [data.locality || data.city, data.principalSubdivision, data.postcode]
                        .filter(Boolean).join(', ') ||
                        (Math.round(lat * 10000) / 10000 + ', ' + Math.round(lng * 10000) / 10000),
                    provider: 'bigdatacloud'
                };
            })
            .catch(function () {
                return fetch(NOMINATIM + '/reverse?format=jsonv2&lat=' + encodeURIComponent(lat) +
                    '&lon=' + encodeURIComponent(lng) + '&addressdetails=1', {
                    headers: { 'Accept': 'application/json' }
                }).then(function (r) {
                    if (!r.ok) throw new Error('Nominatim failed');
                    return r.json();
                }).then(function (data) {
                    var a = data.address || {};
                    return {
                        area: a.suburb || a.neighbourhood || a.quarter || null,
                        locality: a.suburb || a.neighbourhood || a.village || a.town || null,
                        city: a.city || a.town || a.village || a.municipality || null,
                        district: a.county || a.state_district || a.district || null,
                        state: a.state || null,
                        pincode: a.postcode || null,
                        country: a.country || null,
                        label: data.display_name || null,
                        provider: 'nominatim'
                    };
                }).catch(function () {
                    return {
                        area: null,
                        locality: null,
                        city: null,
                        district: null,
                        state: null,
                        pincode: null,
                        country: null,
                        label: Math.round(lat * 10000) / 10000 + ', ' + Math.round(lng * 10000) / 10000,
                        provider: 'coords-only'
                    };
                });
            });
    };

    exports.geocodeQuery = function (query) {
        var q = String(query || '').trim();
        if (!q) return Promise.reject(new Error('Enter a locality, city, or PIN code.'));
        var indiaBias = /india|भारत/i.test(q) ? q : (q + ', India');
        return fetch(NOMINATIM + '/search?format=jsonv2&limit=5&addressdetails=1&q=' +
            encodeURIComponent(indiaBias), {
            headers: { 'Accept': 'application/json' }
        }).then(function (r) {
            if (!r.ok) throw new Error('Location search failed');
            return r.json();
        }).then(function (rows) {
            if (!Array.isArray(rows) || !rows.length) throw new Error('No matching location found.');
            return rows.map(function (row) {
                var a = row.address || {};
                return {
                    lat: parseFloat(row.lat),
                    lng: parseFloat(row.lon),
                    label: row.display_name,
                    locality: a.suburb || a.neighbourhood || a.village || null,
                    city: a.city || a.town || a.village || a.municipality || null,
                    district: a.county || a.state_district || null,
                    state: a.state || null,
                    pincode: a.postcode || null,
                    source: 'manual'
                };
            });
        });
    };

    exports.setManualLocation = function (loc) {
        if (!loc || loc.lat == null || loc.lng == null) throw new Error('Invalid location');
        _userLocation = {
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            accuracy: null,
            source: loc.source || 'manual',
            label: loc.label || null,
            locality: loc.locality || null,
            city: loc.city || null,
            district: loc.district || null,
            pincode: loc.pincode || null,
            detectedAt: Date.now()
        };
        try {
            sessionStorage.setItem(SESSION_LOC_KEY, JSON.stringify({
                lat: _userLocation.lat,
                lng: _userLocation.lng,
                source: _userLocation.source,
                label: _userLocation.label,
                at: _userLocation.detectedAt
            }));
        } catch (_e) { /* ignore */ }
        return _userLocation;
    };

    exports.getUserLocation = function () {
        if (_userLocation) return _userLocation;
        try {
            var raw = sessionStorage.getItem(SESSION_LOC_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.lat != null) {
                    _userLocation = parsed;
                    return _userLocation;
                }
            }
        } catch (_e) { /* ignore */ }
        return null;
    };

    exports.clearSessionLocation = function () {
        _userLocation = null;
        try { sessionStorage.removeItem(SESSION_LOC_KEY); } catch (_e) { /* ignore */ }
    };

    exports.searchNearby = function (lat, lng, options) {
        options = options || {};
        var radiusKm = options.radiusKm != null ? Number(options.radiusKm) : 25;
        var radiusM = Math.round(radiusKm * 1000);
        var cacheKey = 'nb:' + Math.round(lat * 1000) + ':' + Math.round(lng * 1000) + ':' + radiusM;
        var cached = cacheGet(cacheKey);
        if (cached) {
            _lastResults = cached;
            return Promise.resolve(cached);
        }

        var query = buildOverpassQuery(lat, lng, radiusM);
        return fetchOverpass(query).then(function (json) {
            var elements = (json && json.elements) || [];
            var osm = elements.map(normalizeOsmElement).filter(Boolean);
            var gk = verifiedGurukripa();
            var merged = dedupeSuppliers([gk].concat(osm));
            var withDist = attachDistance(merged, lat, lng).filter(function (s) {
                return s.distanceKm <= radiusKm + 0.5 || s.id === 'gurukripa-verified';
            });
            cacheSet(cacheKey, withDist);
            _lastResults = withDist;
            return withDist;
        }).catch(function (err) {
            // Graceful degradation: still return verified Gurukripa yard.
            var gk = attachDistance([verifiedGurukripa()], lat, lng);
            _lastResults = gk;
            var e = new Error(err && err.message ? err.message : 'Nearby search failed');
            e.partial = gk;
            e.code = 'PARTIAL';
            throw e;
        });
    };

    exports.getLastResults = function () { return _lastResults.slice(); };

    exports.getBrickTypes = function () { return BRICK_TYPES.slice(); };

    exports.filterAndSort = function (list, filters) {
        filters = filters || {};
        var out = (list || []).slice();
        var q = (filters.query || '').toLowerCase().trim();
        var brickType = filters.brickType || '';
        var maxKm = filters.maxKm != null && filters.maxKm !== '' ? Number(filters.maxKm) : null;
        var deliveryOnly = !!filters.deliveryOnly;
        var manufacturerOnly = !!filters.manufacturerOnly;
        var wholesaleOnly = !!filters.wholesaleOnly;

        if (q) {
            out = out.filter(function (s) {
                var hay = [
                    s.name, s.nameHi, s.address, s.locality, s.city, s.district, s.pincode
                ].concat(s.brickTypes || []).concat(s.categories || []).join(' ').toLowerCase();
                return hay.indexOf(q) !== -1;
            });
        }
        if (brickType) {
            out = out.filter(function (s) {
                return (s.brickTypes || []).indexOf(brickType) !== -1 ||
                    (s.categories || []).indexOf(brickType) !== -1;
            });
        }
        if (maxKm != null && !isNaN(maxKm)) {
            out = out.filter(function (s) { return s.distanceKm <= maxKm; });
        }
        if (deliveryOnly) {
            out = out.filter(function (s) { return s.deliveryAvailable === true; });
        }
        if (manufacturerOnly) {
            out = out.filter(function (s) { return !!s.manufacturer; });
        }
        if (wholesaleOnly) {
            out = out.filter(function (s) { return !!s.wholesale; });
        }

        var sort = filters.sort || 'nearest';
        out.sort(function (a, b) {
            if (sort === 'price') {
                var pa = a.pricePerBrick != null ? a.pricePerBrick : Number.POSITIVE_INFINITY;
                var pb = b.pricePerBrick != null ? b.pricePerBrick : Number.POSITIVE_INFINITY;
                if (pa !== pb) return pa - pb;
                return a.distanceKm - b.distanceKm;
            }
            if (sort === 'rating') {
                var ra = a.rating != null ? a.rating : -1;
                var rb = b.rating != null ? b.rating : -1;
                if (rb !== ra) return rb - ra;
                return a.distanceKm - b.distanceKm;
            }
            return a.distanceKm - b.distanceKm;
        });
        return out;
    };

    /**
     * Distinct recommendation slots — nearest ≠ cheapest ≠ highest-rated.
     */
    exports.buildRecommendations = function (list) {
        var rows = (list || []).slice();
        var recs = [];
        var used = Object.create(null);

        function take(predicate, meta) {
            for (var i = 0; i < rows.length; i++) {
                var s = rows[i];
                if (used[s.id]) continue;
                if (predicate(s)) {
                    used[s.id] = true;
                    recs.push(Object.assign({ supplier: s }, meta));
                    return;
                }
            }
        }

        take(function (s) {
            return (s.categories || []).indexOf('brick-bhatta') !== -1 || /bhatta|भट्ठा|kiln/i.test(s.name || '');
        }, {
            key: 'nearest-bhatta',
            title: 'Nearest brick bhatta',
            reason: 'Closest mapped kiln / bhatta to your location.'
        });

        take(function (s) { return !!s.manufacturer; }, {
            key: 'nearest-manufacturer',
            title: 'Nearest brick manufacturer',
            reason: 'Closest manufacturer or kiln yard in the search results.'
        });

        take(function (s) { return s.rating != null; }, {
            key: 'best-rated',
            title: 'Best available rated supplier',
            reason: 'Highest verified customer rating among results that publish ratings.'
        });

        take(function (s) { return s.pricePerBrick != null && s.priceConfidence; }, {
            key: 'most-economical',
            title: 'Most economical (confirmed catalogue price)',
            reason: 'Lowest confirmed price per brick among suppliers with verified catalogue rates — not an estimate.'
        });

        take(function (s) { return s.deliveryAvailable === true; }, {
            key: 'delivery',
            title: 'Delivery available to your area',
            reason: 'Supplier publicly confirms delivery service to customers.'
        });

        // Fallbacks so the section stays useful when OSM data is sparse.
        if (!recs.some(function (r) { return r.key === 'nearest-bhatta'; }) && rows[0]) {
            var first = rows.find(function (s) { return !used[s.id]; }) || rows[0];
            if (first && !used[first.id]) {
                used[first.id] = true;
                recs.push({
                    key: 'nearest-overall',
                    title: 'Nearest supplier overall',
                    reason: 'Closest business in the current search radius.',
                    supplier: first
                });
            }
        }

        return recs;
    };

    exports.estimateTotalCost = function (opts) {
        opts = opts || {};
        var qty = Math.max(0, Number(opts.quantity) || 0);
        var price = opts.pricePerBrick;
        var transport = opts.transportCharges;
        var taxPct = opts.taxPct != null ? Number(opts.taxPct) : 5;
        var priceConfirmed = opts.priceConfidence === 'catalogue' || opts.priceConfidence === 'confirmed';
        var transportConfirmed = opts.transportConfidence === 'confirmed';

        if (price == null || isNaN(price)) {
            return {
                ok: false,
                estimated: true,
                message: 'Price per brick is not confirmed for this supplier.'
            };
        }
        if (transport == null || isNaN(transport)) {
            if (opts.distanceKm != null && window.GurukripaMaps &&
                typeof window.GurukripaMaps.calculateTransportCharge === 'function') {
                transport = window.GurukripaMaps.calculateTransportCharge(opts.distanceKm, 1);
                transportConfirmed = false;
            } else {
                transport = 0;
                transportConfirmed = false;
            }
        }

        var bricksCost = qty * Number(price);
        var taxable = bricksCost + Number(transport);
        var tax = Math.round(taxable * (taxPct / 100));
        var total = Math.round(taxable + tax);
        return {
            ok: true,
            estimated: !(priceConfirmed && transportConfirmed),
            quantity: qty,
            pricePerBrick: Number(price),
            bricksCost: Math.round(bricksCost),
            transportCharges: Math.round(Number(transport)),
            taxPct: taxPct,
            tax: tax,
            total: total,
            priceLabel: priceConfirmed ? 'confirmed' : 'estimated',
            transportLabel: transportConfirmed ? 'confirmed' : 'estimated'
        };
    };

    exports.getSavedSuppliers = function () {
        return (typeof getSafeStorage === 'function') ? getSafeStorage(SAVED_KEY, []) : [];
    };

    exports.saveSupplier = function (supplier) {
        if (!supplier || !supplier.id) return false;
        var list = exports.getSavedSuppliers();
        if (list.some(function (s) { return s.id === supplier.id; })) return true;
        list.unshift({
            id: supplier.id,
            name: supplier.name,
            address: supplier.address || null,
            phone: supplier.phone || null,
            lat: supplier.lat,
            lng: supplier.lng,
            source: supplier.source,
            savedAt: new Date().toISOString()
        });
        if (typeof setSafeStorage === 'function') setSafeStorage(SAVED_KEY, list.slice(0, 40));
        return true;
    };

    exports.removeSavedSupplier = function (id) {
        var list = exports.getSavedSuppliers().filter(function (s) { return s.id !== id; });
        if (typeof setSafeStorage === 'function') setSafeStorage(SAVED_KEY, list);
        return list;
    };

    exports.isSaved = function (id) {
        return exports.getSavedSuppliers().some(function (s) { return s.id === id; });
    };

    exports.directionsUrl = function (supplier, from) {
        if (!supplier) return '#';
        var dest = supplier.lat + ',' + supplier.lng;
        var base = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest);
        if (from && from.lat != null && from.lng != null) {
            base += '&origin=' + encodeURIComponent(from.lat + ',' + from.lng);
        }
        return base;
    };

    exports.whatsappEnquiryUrl = function (supplier, message) {
        var phone = (supplier && (supplier.whatsapp || supplier.phone)) || '919198923230';
        phone = String(phone).replace(/\D/g, '');
        if (phone.length === 10) phone = '91' + phone;
        var text = message || ('Namaste! I found ' + ((supplier && supplier.name) || 'your yard') +
            ' via Gurukripa Services nearby search. Please share brick rates and availability.');
        return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
    };

    exports.callTel = function (supplier) {
        var phone = supplier && supplier.phone;
        if (!phone) return null;
        return 'tel:+' + String(phone).replace(/\D/g, '').replace(/^0+/, '');
    };

    exports.brickTypeLabel = function (id) {
        var bt = BRICK_TYPES.find(function (b) { return b.id === id; });
        return bt ? bt.name : id;
    };

    // Expose pure helpers for unit tests
    exports._internal = {
        haversineKm: haversineKm,
        normalizeOsmElement: normalizeOsmElement,
        inferBrickTypes: inferBrickTypes,
        dedupeSuppliers: dedupeSuppliers,
        verifiedGurukripa: verifiedGurukripa,
        attachDistance: attachDistance
    };
})(window.GurukripaNearby);
