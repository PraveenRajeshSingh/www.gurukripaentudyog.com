'use strict';
// ══════════════════════════════════════════════════════════════════
// SITE INSPECTION CAMERA (native + web)
// Gurukripa Bricks Industry — access photos for trolley dispatch
// ══════════════════════════════════════════════════════════════════
// On Capacitor builds the native camera plugin is used (needs the CAMERA
// permission declared in AndroidManifest.xml / Info.plist). On the plain
// web build we fall back to <input type="file" capture="environment">,
// which opens the phone camera directly and needs no permission prompt.
//
// Photos are downscaled before storage so a site visit does not fill the
// device quota, then kept in IndexedDB (offline) and listed for the buyer.
// ══════════════════════════════════════════════════════════════════

const SiteInspection = (function () {
    const MAX_EDGE = 1440;
    const JPEG_QUALITY = 0.72;

    let pending = null;

    function cameraPlugin() {
        try {
            return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.Camera : null;
        } catch (_e) {
            return null;
        }
    }

    function readFile(file) {
        return new Promise((resolve) => {
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    // Web fallback — capture="environment" opens the rear camera on Android
    // and iOS without any runtime permission dialog.
    function pickWithInput() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.setAttribute('capture', 'environment');
            input.style.position = 'fixed';
            input.style.left = '-9999px';
            document.body.appendChild(input);

            let settled = false;
            const finish = (value) => {
                if (settled) return;
                settled = true;
                try { input.remove(); } catch (_e) { /* ignore */ }
                resolve(value);
            };

            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                readFile(file).then(finish);
            });
            input.addEventListener('cancel', () => finish(null));
            input.click();
        });
    }

    // Downscale via canvas; returns the original data URL if anything fails.
    function compress(dataUrl) {
        if (!dataUrl) return Promise.resolve(null);
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve(dataUrl); return; }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
                } catch (_e) {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    function capture() {
        const Camera = cameraPlugin();
        if (!Camera || typeof Camera.getPhoto !== 'function') return pickWithInput();
        return Camera.getPhoto({
            quality: 72,
            allowEditing: false,
            resultType: 'dataUrl',
            source: 'CAMERA',
            saveToGallery: true,
            correctOrientation: true,
            width: MAX_EDGE,
            height: MAX_EDGE
        }).then((photo) => {
            if (photo && photo.dataUrl) return photo.dataUrl;
            if (photo && photo.webPath) {
                return fetch(photo.webPath).then((res) => res.blob()).then((blob) => readFile(blob));
            }
            return null;
        }).catch(() => null);
    }

    function renderPreview() {
        const box = document.getElementById('coSitePhotoPreview');
        if (!box) return;
        if (!pending) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }
        box.style.display = 'block';
        box.innerHTML = `
            <div class="site-photo-chip">
                <img src="${pending.dataUrl}" alt="Site inspection photo" class="site-photo-thumb">
                <div class="site-photo-text">
                    <strong>Site photo attached</strong>
                    <span>Saved on this device — attach it in the WhatsApp chat if the yard asks.</span>
                </div>
                <button type="button" class="site-photo-remove" onclick="SiteInspection.clear()" aria-label="Remove site photo">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`;
    }

    function captureForCheckout() {
        return capture().then((raw) => {
            if (!raw) return null;
            return compress(raw).then((small) => {
                const payload = { dataUrl: small, label: 'Site inspection', source: 'checkout', createdAt: Date.now() };
                pending = payload;
                renderPreview();
                if (window.OfflineStore) {
                    OfflineStore.savePhoto(payload).then((row) => {
                        if (row && pending === payload) pending.id = row.id;
                    });
                }
                if (typeof showToast === 'function') {
                    showToast('Site photo saved on this device.', 'success');
                }
                return small;
            });
        });
    }

    function clear() {
        pending = null;
        renderPreview();
    }

    function getPending() {
        return pending;
    }

    function listSaved(limit) {
        if (!window.OfflineStore) return Promise.resolve([]);
        return OfflineStore.listPhotos(limit);
    }

    return {
        capture,
        captureForCheckout,
        compress,
        clear,
        getPending,
        listSaved,
        renderPreview
    };
})();

window.SiteInspection = SiteInspection;
