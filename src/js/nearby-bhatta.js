'use strict';
/**
 * Nearby Brick Bhatta UI controller.
 * Depends on: GurukripaNearby, GurukripaMaps, openOverlay/closeOverlay,
 * sanitizeHTML, showToast, GurukripaServices.QuotationService (optional).
 */
window.NearbyBhatta = (function () {
    var state = {
        location: null,
        placeMeta: null,
        all: [],
        filtered: [],
        compareIds: [],
        selectedBrickType: '',
        mapApi: null,
        searching: false,
        quoteSupplier: null
    };

    var els = {};

    function $(id) { return document.getElementById(id); }

    function cacheEls() {
        els.locBar = $('nearbyLocBar');
        els.locLabel = $('nearbyLocLabel');
        els.detectBtn = $('nearbyDetectBtn');
        els.changeBtn = $('nearbyChangeBtn');
        els.manual = $('nearbyManualPanel');
        els.manualInput = $('nearbyManualInput');
        els.manualSearchBtn = $('nearbyManualSearchBtn');
        els.manualHints = $('nearbyManualHints');
        els.smart = $('nearbySmartRecs');
        els.smartGrid = $('nearbySmartGrid');
        els.typeGrid = $('nearbyBrickTypeGrid');
        els.search = $('nearbySearchInput');
        els.sort = $('nearbySort');
        els.brickFilter = $('nearbyBrickFilter');
        els.radius = $('nearbyRadius');
        els.deliveryOnly = $('nearbyDeliveryOnly');
        els.mfgOnly = $('nearbyMfgOnly');
        els.wholesaleOnly = $('nearbyWholesaleOnly');
        els.list = $('nearbySupplierList');
        els.empty = $('nearbyEmpty');
        els.error = $('nearbyError');
        els.count = $('nearbyResultCount');
        els.compareBtn = $('nearbyCompareOpenBtn');
        els.compareCount = $('nearbyCompareCount');
        els.locateMe = $('nearbyLocateMeBtn');
        els.mapRefresh = $('nearbyMapRefreshBtn');
        els.mapNote = $('nearbyMapNote');
        els.quoteForm = $('nearbyQuoteForm');
    }

    function esc(s) {
        return typeof sanitizeHTML === 'function' ? sanitizeHTML(String(s == null ? '' : s)) : String(s || '');
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') showToast(msg, type || '');
    }

    function setLocStatus(mode, title, detail) {
        if (!els.locBar) return;
        els.locBar.classList.remove('is-ready', 'is-error', 'is-loading');
        if (mode) els.locBar.classList.add(mode);
        var strong = els.locBar.querySelector('strong');
        if (strong) strong.textContent = title;
        if (els.locLabel) els.locLabel.textContent = detail || '';
    }

    function currentFilters() {
        return {
            query: els.search ? els.search.value : '',
            sort: els.sort ? els.sort.value : 'nearest',
            brickType: (els.brickFilter && els.brickFilter.value) || state.selectedBrickType || '',
            maxKm: els.radius ? Number(els.radius.value) : 25,
            deliveryOnly: !!(els.deliveryOnly && els.deliveryOnly.checked),
            manufacturerOnly: !!(els.mfgOnly && els.mfgOnly.checked),
            wholesaleOnly: !!(els.wholesaleOnly && els.wholesaleOnly.checked)
        };
    }

    function brickLabels(ids) {
        if (!ids || !ids.length) return 'Brick types not listed publicly';
        return ids.map(function (id) {
            return window.GurukripaNearby.brickTypeLabel(id);
        }).join(', ');
    }

    function mediaHtml(s) {
        if (s.image) {
            return '<div class="nearby-card__media"><img src="' + esc(s.image) + '" alt="" loading="lazy" width="96" height="96"></div>';
        }
        var initials = String(s.name || 'B').trim().slice(0, 1).toUpperCase();
        return '<div class="nearby-card__media" aria-hidden="true">' + esc(initials) + '<br>BHATTA</div>';
    }

    function metaPills(s) {
        var pills = [];
        if (s.verified) pills.push('<span class="nearby-pill is-verified">Verified yard</span>');
        if (s.source === 'openstreetmap') pills.push('<span class="nearby-pill">OpenStreetMap</span>');
        if (s.manufacturer) pills.push('<span class="nearby-pill">Manufacturer</span>');
        if (s.wholesale) pills.push('<span class="nearby-pill">Wholesale</span>');
        if (s.deliveryAvailable === true) pills.push('<span class="nearby-pill">Delivery available</span>');
        if (s.pricePerBrick != null && s.priceConfidence) {
            pills.push('<span class="nearby-pill">₹' + esc(String(s.pricePerBrick)) + '/pc (' + esc(s.priceConfidence) + ')</span>');
        }
        if (s.rating != null) {
            pills.push('<span class="nearby-pill">★ ' + esc(String(s.rating)) +
                (s.reviewCount != null ? ' (' + esc(String(s.reviewCount)) + ')' : '') + '</span>');
        }
        if (s.minOrderQty != null) pills.push('<span class="nearby-pill">MOQ ' + esc(String(s.minOrderQty)) + '</span>');
        if (s.operatingStatus) pills.push('<span class="nearby-pill">' + esc(s.operatingStatus) + '</span>');
        return pills.join('');
    }

    function actionButtons(s, compact) {
        var saved = window.GurukripaNearby.isSaved(s.id);
        var inCompare = state.compareIds.indexOf(s.id) !== -1;
        var call = window.GurukripaNearby.callTel(s);
        var html = '';
        html += '<button type="button" class="btn btn-outline btn-sm" data-nb-act="details" data-id="' + esc(s.id) + '">View Details</button>';
        if (call) {
            html += '<a class="btn btn-outline btn-sm" href="' + esc(call) + '">Call Supplier</a>';
        }
        html += '<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="' +
            esc(window.GurukripaNearby.directionsUrl(s, state.location)) + '">Get Directions</a>';
        if (s.phone || s.whatsapp || s.verified) {
            html += '<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="' +
                esc(window.GurukripaNearby.whatsappEnquiryUrl(s)) + '">WhatsApp Enquiry</a>';
        }
        html += '<button type="button" class="btn btn-outline btn-sm" data-nb-act="compare-toggle" data-id="' +
            esc(s.id) + '" aria-pressed="' + (inCompare ? 'true' : 'false') + '">' +
            (inCompare ? 'In Compare' : 'Compare Prices') + '</button>';
        html += '<button type="button" class="btn btn-outline btn-sm" data-nb-act="save" data-id="' +
            esc(s.id) + '">' + (saved ? 'Saved' : 'Save Supplier') + '</button>';
        html += '<button type="button" class="btn btn-primary btn-sm" data-nb-act="quote" data-id="' +
            esc(s.id) + '">Request Quotation</button>';
        if (compact) return html;
        return html;
    }

    function renderList() {
        if (!els.list) return;
        var rows = state.filtered;
        els.list.innerHTML = rows.map(function (s) {
            return '<article class="nearby-card" data-supplier-id="' + esc(s.id) + '">' +
                mediaHtml(s) +
                '<div class="nearby-card__body">' +
                '<div class="nearby-card__top">' +
                '<h3 class="nearby-card__name">' + esc(s.name) + '</h3>' +
                '<span class="nearby-card__dist">' + (s.distanceKm != null ? esc(String(s.distanceKm)) + ' km' : '') + '</span>' +
                '</div>' +
                '<p class="nearby-card__addr">' + esc(s.address || [s.locality, s.city, s.pincode].filter(Boolean).join(', ') || 'Address not listed publicly') + '</p>' +
                '<div class="nearby-card__meta">' + metaPills(s) +
                '<span class="nearby-pill">' + esc(brickLabels(s.brickTypes)) + '</span></div>' +
                '<div class="nearby-card__actions">' + actionButtons(s) + '</div>' +
                '</div></article>';
        }).join('');

        if (els.count) {
            els.count.textContent = rows.length + (rows.length === 1 ? ' supplier' : ' suppliers');
        }
        if (els.empty) els.empty.hidden = rows.length > 0;
        if (els.compareCount) els.compareCount.textContent = String(state.compareIds.length);
        if (els.compareBtn) els.compareBtn.disabled = state.compareIds.length < 2;
    }

    function renderSmart() {
        if (!els.smart || !els.smartGrid) return;
        var recs = window.GurukripaNearby.buildRecommendations(state.filtered.length ? state.filtered : state.all);
        if (!recs.length) {
            els.smart.hidden = true;
            els.smartGrid.innerHTML = '';
            return;
        }
        els.smart.hidden = false;
        els.smartGrid.innerHTML = recs.map(function (r) {
            var s = r.supplier;
            return '<button type="button" class="nearby-smart-card" data-nb-act="details" data-id="' + esc(s.id) + '">' +
                '<span class="nearby-smart-card__eyebrow">' + esc(r.title) + '</span>' +
                '<div class="nearby-smart-card__name">' + esc(s.name) +
                (s.distanceKm != null ? ' · ' + esc(String(s.distanceKm)) + ' km' : '') + '</div>' +
                '<div class="nearby-smart-card__reason">' + esc(r.reason) + '</div></button>';
        }).join('');
    }

    function renderBrickTypes() {
        if (!els.typeGrid) return;
        var types = window.GurukripaNearby.getBrickTypes();
        els.typeGrid.innerHTML = types.map(function (bt) {
            var active = state.selectedBrickType === bt.id ? ' is-active' : '';
            return '<button type="button" class="nearby-type-card' + active + '" data-nb-act="brick-type" data-type="' + esc(bt.id) + '">' +
                '<img src="' + esc(bt.img) + '" alt="" width="88" height="88" loading="lazy">' +
                '<span><strong>' + esc(bt.name) + '</strong>' +
                '<span>' + esc(bt.desc) + '</span>' +
                '<span>Apps: ' + esc(bt.applications.join(' · ')) + '</span>' +
                '<span>Dims: ' + esc(bt.dimensions) + '</span></span></button>';
        }).join('');
    }

    function applyFilters() {
        if (!window.GurukripaNearby) return;
        state.filtered = window.GurukripaNearby.filterAndSort(state.all, currentFilters());
        renderList();
        renderSmart();
        refreshMap();
    }

    function refreshMap() {
        if (!state.location || !window.GurukripaMaps || typeof window.GurukripaMaps.initNearbyMap !== 'function') return;
        window.GurukripaMaps.initNearbyMap('nearbyMap', {
            user: state.location,
            suppliers: state.filtered.slice(0, 40),
            onSelect: function (s) { openDetail(s.id); }
        }).then(function (api) {
            state.mapApi = api;
            if (els.mapNote && api) {
                els.mapNote.textContent = api.provider === 'google'
                    ? 'Google Maps markers · tap a pin for name, distance and address.'
                    : api.provider === 'leaflet'
                        ? 'OpenStreetMap tiles · pinch to zoom · tap markers for details.'
                        : 'Static map preview (interactive tiles unavailable).';
            }
        });
    }

    function findSupplier(id) {
        return state.all.find(function (s) { return s.id === id; }) ||
            state.filtered.find(function (s) { return s.id === id; }) || null;
    }

    function openDetail(id) {
        var s = findSupplier(id);
        if (!s) return;
        var title = $('nearbyDetailTitle');
        var sub = $('nearbyDetailSub');
        var body = $('nearbyDetailBody');
        var foot = $('nearbyDetailFoot');
        if (title) title.textContent = s.name;
        if (sub) {
            sub.textContent = (s.distanceKm != null ? s.distanceKm + ' km away · ' : '') +
                (s.verified ? 'Verified Gurukripa yard' : 'Public map listing — fields shown only when published');
        }
        if (body) {
            var nearbyForType = '';
            if (state.selectedBrickType) {
                var matches = state.all.filter(function (x) {
                    return (x.brickTypes || []).indexOf(state.selectedBrickType) !== -1;
                }).slice(0, 5);
                nearbyForType = '<div class="nearby-detail-grid">' +
                    matches.map(function (m) {
                        return '<div><strong>Nearby for selected type</strong>' + esc(m.name) +
                            (m.distanceKm != null ? ' (' + esc(String(m.distanceKm)) + ' km)' : '') + '</div>';
                    }).join('') + '</div>';
            }
            body.innerHTML =
                '<div class="nearby-detail-hero">' + mediaHtml(s) +
                '<div><p>' + esc(s.address || 'Address not listed publicly') + '</p>' +
                '<div class="nearby-card__meta">' + metaPills(s) + '</div></div></div>' +
                '<div class="nearby-detail-grid">' +
                '<div><strong>Brick types</strong>' + esc(brickLabels(s.brickTypes)) + '</div>' +
                '<div><strong>Price / brick</strong>' +
                (s.pricePerBrick != null
                    ? ('₹' + esc(String(s.pricePerBrick)) + ' <em>(' + esc(s.priceConfidence || 'unconfirmed') + ')</em>')
                    : 'Not publicly confirmed') + '</div>' +
                '<div><strong>Bulk / trolley</strong>' +
                (s.bulkPrice != null ? ('₹' + esc(String(s.bulkPrice)) + (s.bulkUnit ? ' · ' + esc(s.bulkUnit) : '')) : 'Ask supplier') + '</div>' +
                '<div><strong>Min. order</strong>' + (s.minOrderQty != null ? esc(String(s.minOrderQty)) + ' pcs' : 'Not listed') + '</div>' +
                '<div><strong>Rating</strong>' + (s.rating != null ? esc(String(s.rating)) : 'No verified public rating') + '</div>' +
                '<div><strong>Delivery</strong>' +
                (s.deliveryAvailable === true ? esc(s.deliveryNote || 'Available') :
                    s.deliveryAvailable === false ? 'Not available' : 'Not confirmed publicly') + '</div>' +
                '<div><strong>Phone</strong>' + (s.phone ? esc(s.phone) : 'Not listed publicly') + '</div>' +
                '<div><strong>Status</strong>' + esc(s.operatingStatus || 'Not listed') + '</div>' +
                '</div>' +
                (s.priceNote ? '<p class="nearby-privacy-note">' + esc(s.priceNote) + '</p>' : '') +
                nearbyForType;
        }
        if (foot) foot.innerHTML = actionButtons(s);
        if (typeof openOverlay === 'function') openOverlay('nearbyDetailModal');
    }

    function closeDetail() {
        if (typeof closeOverlay === 'function') closeOverlay('nearbyDetailModal');
    }

    function toggleCompare(id) {
        var idx = state.compareIds.indexOf(id);
        if (idx >= 0) state.compareIds.splice(idx, 1);
        else {
            if (state.compareIds.length >= 4) {
                toast('Compare up to 4 suppliers at a time.', 'info');
                return;
            }
            state.compareIds.push(id);
        }
        renderList();
    }

    function openCompare() {
        var body = $('nearbyCompareBody');
        if (!body) return;
        var cols = state.compareIds.map(findSupplier).filter(Boolean);
        if (cols.length < 2) {
            toast('Select at least two suppliers to compare.', 'info');
            return;
        }
        var fields = [
            { key: 'name', label: 'Supplier' },
            { key: 'distanceKm', label: 'Distance', fmt: function (v) { return v != null ? v + ' km' : '—'; } },
            { key: 'brickTypes', label: 'Brick type', fmt: function (v) { return brickLabels(v); } },
            { key: 'pricePerBrick', label: 'Price / brick', fmt: function (v, s) {
                return v != null ? ('₹' + v + ' (' + (s.priceConfidence || 'unconfirmed') + ')') : 'Not confirmed';
            } },
            { key: 'bulkPrice', label: 'Bulk / trolley', fmt: function (v, s) {
                return v != null ? ('₹' + v + (s.bulkUnit ? ' · ' + s.bulkUnit : '')) : '—';
            } },
            { key: 'transport', label: 'Transport (est.)', fmt: function (_v, s) {
                if (s.distanceKm == null || !window.GurukripaMaps) return '—';
                return '₹' + window.GurukripaMaps.calculateTransportCharge(s.distanceKm, 1) + ' (estimated)';
            } },
            { key: 'minOrderQty', label: 'Min quantity', fmt: function (v) { return v != null ? v : '—'; } },
            { key: 'deliveryAvailable', label: 'Delivery', fmt: function (v) {
                return v === true ? 'Yes' : v === false ? 'No' : 'Not confirmed';
            } },
            { key: 'rating', label: 'Ratings', fmt: function (v) { return v != null ? v : 'No verified rating'; } }
        ];

        var qty = 4000;
        var thead = '<tr><th>Field</th>' + cols.map(function (s) {
            return '<th>' + esc(s.name) + '</th>';
        }).join('') + '</tr>';
        var rows = fields.map(function (f) {
            return '<tr><th>' + esc(f.label) + '</th>' + cols.map(function (s) {
                var raw = f.key === 'transport' ? null : s[f.key];
                var val = f.fmt ? f.fmt(raw, s) : (raw != null ? raw : '—');
                return '<td>' + esc(String(val)) + '</td>';
            }).join('') + '</tr>';
        }).join('');

        var costRow = '<tr><th>Est. total (qty ' + qty + ' + transport + 5% GST)</th>' + cols.map(function (s) {
            var est = window.GurukripaNearby.estimateTotalCost({
                quantity: qty,
                pricePerBrick: s.pricePerBrick,
                priceConfidence: s.priceConfidence,
                distanceKm: s.distanceKm
            });
            if (!est.ok) return '<td>' + esc(est.message) + '</td>';
            return '<td>₹' + esc(String(est.total)) +
                ' <em>(' + (est.estimated ? 'estimated' : 'confirmed inputs') + ')</em></td>';
        }).join('') + '</tr>';

        body.innerHTML = '<div class="nearby-compare-wrap"><table class="nearby-compare-table"><thead>' +
            thead + '</thead><tbody>' + rows + costRow + '</tbody></table></div>' +
            '<p class="nearby-privacy-note">Estimated totals use catalogue prices only when verified. Transport uses Gurukripa freight estimate when supplier freight is unpublished.</p>';
        if (typeof openOverlay === 'function') openOverlay('nearbyCompareModal');
    }

    function closeCompare() {
        if (typeof closeOverlay === 'function') closeOverlay('nearbyCompareModal');
    }

    function saveSupplier(id) {
        var s = findSupplier(id);
        if (!s) return;
        window.GurukripaNearby.saveSupplier(s);
        toast('Supplier saved on this device.', 'success');
        renderList();
    }

    function openQuote(id) {
        var s = findSupplier(id);
        if (!s) return;
        state.quoteSupplier = s;
        closeDetail();
        var sid = $('nqSupplierId');
        var sname = $('nqSupplierName');
        var sub = $('nearbyQuoteSub');
        if (sid) sid.value = s.id;
        if (sname) sname.value = s.name;
        if (sub) sub.textContent = 'Quotation for ' + s.name + ' · saved to your existing enquiry list';
        if (state.placeMeta && $('nqAddress') && !$('nqAddress').value) {
            $('nqAddress').value = state.placeMeta.label || '';
        }
        updateQuoteCost();
        if (typeof openOverlay === 'function') openOverlay('nearbyQuoteModal');
        // Prefill signed-in profile if available
        try {
            if (window.GBApi && GBApi.session) {
                var sess = GBApi.session();
                var u = sess && sess.user;
                if (u) {
                    if (u.name && $('nqName')) $('nqName').value = u.name;
                    if (u.phone && $('nqPhone')) $('nqPhone').value = String(u.phone).replace(/\D/g, '').slice(-10);
                }
            }
        } catch (_e) { /* ignore */ }
    }

    function closeQuote() {
        if (typeof closeOverlay === 'function') closeOverlay('nearbyQuoteModal');
        state.quoteSupplier = null;
    }

    function updateQuoteCost() {
        var box = $('nqCostPreview');
        var s = state.quoteSupplier;
        if (!box || !s) return;
        var qty = Number(($('nqQty') && $('nqQty').value) || 0);
        var est = window.GurukripaNearby.estimateTotalCost({
            quantity: qty,
            pricePerBrick: s.pricePerBrick,
            priceConfidence: s.priceConfidence,
            distanceKm: s.distanceKm
        });
        if (!est.ok) {
            box.hidden = false;
            box.innerHTML = esc(est.message) + ' Submit the enquiry to receive a confirmed quote.';
            return;
        }
        box.hidden = false;
        box.innerHTML = '<strong>' + (est.estimated ? 'Estimated' : 'Calculated') + ' total:</strong> ₹' +
            esc(String(est.total)) +
            ' <span>(bricks ₹' + esc(String(est.bricksCost)) +
            ' + transport ₹' + esc(String(est.transportCharges)) + ' [' + esc(est.transportLabel) + ']' +
            ' + GST ₹' + esc(String(est.tax)) + ')</span>';
    }

    function submitQuote(e) {
        e.preventDefault();
        var err = $('nqError');
        if (err) { err.hidden = true; err.textContent = ''; }
        var name = ($('nqName') && $('nqName').value || '').trim();
        var phone = ($('nqPhone') && $('nqPhone').value || '').replace(/\D/g, '');
        var brick = $('nqBrickType') && $('nqBrickType').value;
        var qty = Number($('nqQty') && $('nqQty').value);
        var site = ($('nqAddress') && $('nqAddress').value || '').trim();
        var supplierName = ($('nqSupplierName') && $('nqSupplierName').value) || '';
        if (!name || phone.length !== 10 || !brick || !qty || !site) {
            if (err) {
                err.hidden = false;
                err.textContent = 'Please fill name, 10-digit mobile, brick type, quantity and delivery address.';
            }
            return;
        }

        var payload = {
            name: name,
            phone: phone,
            company: supplierName ? ('Nearby enquiry → ' + supplierName) : 'Nearby Bhatta Finder',
            product: brick,
            qty: qty,
            site: site,
            roadAccess: 'wide',
            unloadingReq: 'self',
            supplierId: $('nqSupplierId') && $('nqSupplierId').value,
            supplierName: supplierName,
            source: 'nearby-bhatta'
        };

        var quote = null;
        if (window.GurukripaServices && window.GurukripaServices.QuotationService) {
            quote = window.GurukripaServices.QuotationService.submitRFQ(payload);
        }

        if (window.GBApi && GBApi.enabled && GBApi.enabled() && typeof GBApi.submitEnquiry === 'function') {
            GBApi.submitEnquiry({
                name: name,
                phone: phone,
                message: 'Nearby supplier quotation request for ' + supplierName +
                    '. Brick: ' + brick + '. Qty: ' + qty + '. Site: ' + site,
                source: 'nearby-bhatta',
                meta: payload
            }).catch(function () { /* local ledger already saved */ });
        }

        toast(quote && quote.id
            ? ('Enquiry ' + quote.id + ' logged. Track it under My Enquiries.')
            : 'Enquiry logged on this device.', 'success');

        if (state.quoteSupplier && (state.quoteSupplier.phone || state.quoteSupplier.verified)) {
            var wa = window.GurukripaNearby.whatsappEnquiryUrl(state.quoteSupplier,
                'Namaste! Quotation request via Gurukripa Services.\n' +
                'Ref: ' + (quote && quote.id ? quote.id : 'local') + '\n' +
                'Name: ' + name + '\nPhone: ' + phone + '\nBrick: ' + brick +
                '\nQty: ' + qty + '\nDelivery: ' + site);
            window.open(wa, '_blank', 'noopener');
        }

        closeQuote();
        if (typeof renderEnquiryList === 'function') {
            try { renderEnquiryList(); } catch (_e) { /* optional */ }
        }
    }

    function runSearch() {
        if (!state.location || !window.GurukripaNearby) return;
        state.searching = true;
        setLocStatus('is-loading', 'Searching nearby…', 'Looking up brick bhattas and material dealers around you.');
        if (els.error) { els.error.hidden = true; els.error.textContent = ''; }

        var radiusKm = els.radius ? Number(els.radius.value) : 25;
        window.GurukripaNearby.searchNearby(state.location.lat, state.location.lng, { radiusKm: radiusKm })
            .then(function (list) {
                state.all = list;
                state.searching = false;
                var label = (state.placeMeta && state.placeMeta.label) ||
                    (Math.round(state.location.lat * 10000) / 10000 + ', ' +
                        Math.round(state.location.lng * 10000) / 10000);
                setLocStatus('is-ready', 'Searching near your location', label);
                applyFilters();
            })
            .catch(function (err) {
                state.searching = false;
                if (err && err.partial) {
                    state.all = err.partial;
                    applyFilters();
                    setLocStatus('is-error', 'Partial results',
                        'Live map search had an issue. Showing verified Gurukripa yard. You can retry.');
                } else {
                    setLocStatus('is-error', 'Search failed',
                        (err && err.message) || 'Could not load nearby suppliers.');
                }
                if (els.error) {
                    els.error.hidden = false;
                    els.error.textContent = (err && err.message) || 'Nearby supplier search failed.';
                }
            });
    }

    function afterLocationSet(loc, meta) {
        state.location = loc;
        state.placeMeta = meta || null;
        if (els.manual) els.manual.hidden = true;
        var label = (meta && meta.label) || '';
        setLocStatus('is-ready', 'Location ready', label || 'Coordinates captured for this session.');
        runSearch();
    }

    function detectGps() {
        if (!window.GurukripaNearby) return;
        setLocStatus('is-loading', 'Requesting permission…', 'Your browser will ask to share location.');
        window.GurukripaNearby.detectLocation({ timeout: 12000 })
            .then(function (loc) {
                return window.GurukripaNearby.reverseGeocode(loc.lat, loc.lng).then(function (meta) {
                    afterLocationSet(loc, meta);
                });
            })
            .catch(function (err) {
                var msg = 'Location unavailable.';
                if (err && err.code === 'PERMISSION_DENIED') {
                    msg = 'Location permission denied. Enter locality or PIN manually.';
                } else if (err && err.code === 'UNAVAILABLE') {
                    msg = 'GPS unavailable. Enter your area manually.';
                } else if (err && err.code === 'TIMEOUT') {
                    msg = 'Location request timed out. Try again or enter manually.';
                }
                setLocStatus('is-error', 'Could not use GPS', msg);
                if (els.manual) els.manual.hidden = false;
                toast(msg, 'warning');
            });
    }

    function manualSearch() {
        var q = els.manualInput && els.manualInput.value;
        if (!window.GurukripaNearby) return;
        setLocStatus('is-loading', 'Looking up place…', 'Resolving locality / PIN without storing it on our servers.');
        window.GurukripaNearby.geocodeQuery(q)
            .then(function (rows) {
                if (!els.manualHints) return;
                els.manualHints.innerHTML = rows.map(function (row, i) {
                    return '<button type="button" class="nearby-manual__hint" role="option" data-nb-act="pick-place" data-idx="' +
                        i + '">' + esc(row.label) + '</button>';
                }).join('');
                els.manualHints._rows = rows;
            })
            .catch(function (err) {
                toast((err && err.message) || 'Place not found', 'warning');
            });
    }

    function pickPlace(idx) {
        var rows = els.manualHints && els.manualHints._rows;
        if (!rows || !rows[idx]) return;
        var row = rows[idx];
        var loc = window.GurukripaNearby.setManualLocation(row);
        afterLocationSet(loc, row);
    }

    function onClick(e) {
        var btn = e.target.closest && e.target.closest('[data-nb-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-nb-act');
        var id = btn.getAttribute('data-id');
        if (act === 'details') openDetail(id);
        else if (act === 'compare-toggle') toggleCompare(id);
        else if (act === 'save') saveSupplier(id);
        else if (act === 'quote') openQuote(id);
        else if (act === 'brick-type') {
            var type = btn.getAttribute('data-type');
            state.selectedBrickType = state.selectedBrickType === type ? '' : type;
            if (els.brickFilter) els.brickFilter.value = state.selectedBrickType;
            renderBrickTypes();
            applyFilters();
        } else if (act === 'pick-place') {
            pickPlace(Number(btn.getAttribute('data-idx')));
        }
    }

    function bind() {
        cacheEls();
        if (!els.detectBtn) return;

        els.detectBtn.addEventListener('click', detectGps);
        if (els.changeBtn) {
            els.changeBtn.addEventListener('click', function () {
                if (els.manual) els.manual.hidden = !els.manual.hidden;
                if (els.manual && !els.manual.hidden && els.manualInput) els.manualInput.focus();
            });
        }
        if (els.manualSearchBtn) els.manualSearchBtn.addEventListener('click', manualSearch);
        if (els.manualInput) {
            els.manualInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); manualSearch(); }
            });
        }
        ['input', 'change'].forEach(function (evt) {
            if (els.search) els.search.addEventListener(evt, applyFilters);
            if (els.sort) els.sort.addEventListener(evt, applyFilters);
            if (els.brickFilter) els.brickFilter.addEventListener(evt, function () {
                state.selectedBrickType = els.brickFilter.value;
                renderBrickTypes();
                applyFilters();
            });
            if (els.deliveryOnly) els.deliveryOnly.addEventListener(evt, applyFilters);
            if (els.mfgOnly) els.mfgOnly.addEventListener(evt, applyFilters);
            if (els.wholesaleOnly) els.wholesaleOnly.addEventListener(evt, applyFilters);
        });
        if (els.radius) {
            els.radius.addEventListener('change', function () {
                if (state.location) runSearch();
                else applyFilters();
            });
        }
        if (els.compareBtn) els.compareBtn.addEventListener('click', openCompare);
        if (els.locateMe) {
            els.locateMe.addEventListener('click', function () {
                if (state.mapApi && state.mapApi.locateMe) state.mapApi.locateMe();
                else if (!state.location) detectGps();
            });
        }
        if (els.mapRefresh) els.mapRefresh.addEventListener('click', function () {
            if (state.location) runSearch();
            else detectGps();
        });
        if (els.quoteForm) {
            els.quoteForm.addEventListener('submit', submitQuote);
            if ($('nqQty')) $('nqQty').addEventListener('input', updateQuoteCost);
        }

        var root = $('nearby-bhatta') || document;
        root.addEventListener('click', onClick);
        var detailFoot = $('nearbyDetailFoot');
        if (detailFoot) detailFoot.addEventListener('click', onClick);
        if (els.smartGrid) els.smartGrid.addEventListener('click', onClick);
        if (els.typeGrid) els.typeGrid.addEventListener('click', onClick);
        if (els.manualHints) els.manualHints.addEventListener('click', onClick);

        renderBrickTypes();

        // Resume session location if present (coords only, no server persistence).
        var existing = window.GurukripaNearby.getUserLocation();
        if (existing && existing.lat != null) {
            state.location = existing;
            window.GurukripaNearby.reverseGeocode(existing.lat, existing.lng).then(function (meta) {
                afterLocationSet(existing, meta);
            }).catch(function () {
                afterLocationSet(existing, null);
            });
        } else {
            setLocStatus('', 'Location not set', 'Allow location or enter your area to search nearby bhattas.');
        }

        // Soft auto-prompt once when section enters view (still requires user permission dialog).
        if ('IntersectionObserver' in window && $('nearby-bhatta')) {
            var seen = false;
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (seen || !entry.isIntersecting) return;
                    seen = true;
                    if (!state.location) {
                        // Do not auto-call geolocation (must ask first via button) — reveal manual option.
                        if (els.manual) els.manual.hidden = false;
                    }
                    io.disconnect();
                });
            }, { threshold: 0.2 });
            io.observe($('nearby-bhatta'));
        }
    }

    function init() {
        if (!document.getElementById('nearby-bhatta')) return;
        if (!window.GurukripaNearby) {
            console.warn('GurukripaNearby service missing');
            return;
        }
        bind();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init: init,
        detectGps: detectGps,
        openDetail: openDetail,
        closeDetail: closeDetail,
        openCompare: openCompare,
        closeCompare: closeCompare,
        openQuote: openQuote,
        closeQuote: closeQuote,
        refresh: runSearch
    };
})();
