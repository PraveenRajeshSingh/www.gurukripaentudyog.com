const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('Maps & tracker honesty', () => {
    test('canonical kiln coordinates match Google Place (Newada)', () => {
        const maps = read('src/services/maps-service.js');
        assert.match(maps, /lat:\s*25\.6041031/);
        assert.match(maps, /lng:\s*82\.7939421/);
        assert.doesNotMatch(maps, /25\.7476/);
        assert.match(maps, /Newada/);
        assert.doesNotMatch(maps, /Nevada/);
    });

    test('schema.org geo matches Place coordinates', () => {
        const head = read('src/pages/partials/head.html');
        assert.match(head, /"latitude":\s*"25\.6041031"/);
        assert.match(head, /"longitude":\s*"82\.7939421"/);
    });

    test('contact embed uses Place coordinates and Newada address', () => {
        const contact = read('src/pages/partials/contact.html');
        assert.match(contact, /25\.6041031,82\.7939421/);
        assert.match(contact, /Newada/);
        assert.doesNotMatch(contact, /Nevada/);
        assert.match(contact, /maps\/dir\/\?api=1&destination=25\.6041031/);
        assert.match(contact, /contact-map-card/);
    });

    test('tracker does not fabricate live trolley GPS or demo driver', () => {
        const tracker = read('src/js/tracker.js');
        assert.doesNotMatch(tracker, /Ram Singh/);
        assert.doesNotMatch(tracker, /UP-62-BT-9412/);
        assert.doesNotMatch(tracker, /demoTrackerOrder/);
        assert.match(tracker, /Live trolley GPS is not available|live GPS|not live GPS/i);
        assert.match(tracker, /DispatchOps/);
        assert.match(tracker, /renderTrackerEmpty/);
    });

    test('tracker modal has no demo dispatch button', () => {
        const html = read('src/pages/partials/live-order-and-delivery-tracker-modal.html');
        assert.doesNotMatch(html, /demoTrackerOrder/);
        assert.doesNotMatch(html, /GBI-20260728-4912/);
        assert.match(html, /trackerMapContainer/);
    });

    test('checkout refuses fake online payment success', () => {
        const checkout = read('src/js/checkout.js');
        assert.match(checkout, /onlinePayUnavailable|Online card\/UPI/);
        assert.match(checkout, /COD — awaiting yard confirmation|codPlaced/);
        assert.doesNotMatch(checkout, /Verifying Payment/);
    });

    test('payment service does not mock Razorpay success', () => {
        const pay = read('src/services/payment-service.js');
        assert.doesNotMatch(pay, /sig_verified_mock_/);
        assert.doesNotMatch(pay, /razorpay_payment_id:\s*'pay_/);
        assert.match(pay, /Online payment is not configured|onError/);
    });

    test('admin quotation action does not fake PDF email', () => {
        const admin = read('src/js/admin-portal.js');
        assert.doesNotMatch(admin, /Quotation PDF generated and sent/);
        assert.match(admin, /shareQuotationOnWhatsApp/);
    });
});
