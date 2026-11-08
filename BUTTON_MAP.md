# BUTTON_MAP — Gurukripa Bricks Industry

Generated: 2026-11-08T08:08:09.550Z

Inventory source: built `index.html` (onclick + data-action + dead hrefs).
Dynamic product/cart/order buttons are covered by `action-delegate.js` (`data-action`).

| Element | Location | Label / key | Selector | Handler | Expected | Status before | Status after | Notes |
|---|---|---|---|---|---|---|---|---|
| <div> | #lb | lbClose(event) | #lb | lbClose(event) | lbClose | wired | OK | global function |
| <button> | .lb-close | lbClose() | .lb-close | lbClose() | lbClose | wired | OK | global function |
| <button> | .topbar-ops-btn | topbar.ops | .topbar-ops-btn | openAdminPortal() | openAdminPortal | wired | OK | global function |
| <a> | .nav-brand | Gurukripa Bricks Industry Home | .nav-brand | setActiveNav(this) | setActiveNav | wired | OK | global function |
| <button> | #voiceSearchBtn | Voice search | #voiceSearchBtn | toggleVoiceSearch() | toggleVoiceSearch | wired | OK | global function |
| <a> | .nav-link | nav.home | .nav-link.active | setActiveNav(this) | setActiveNav | wired | OK | global function |
| <a> | .nav-link | nav.products | .nav-link | setActiveNav(this) | setActiveNav | wired | OK | global function |
| <button> | .btn | nav.getQuote | .btn.btn-primary | openBulkQuoteModal() | openBulkQuoteModal | wired | OK | global function |
| <button> | .nav-icon-btn | Order and rate alerts | .nav-icon-btn.nav-alert-btn | openNotificationCenter() | openNotificationCenter | wired | OK | global function |
| <button> | .nav-icon-btn | Shopping Cart | .nav-icon-btn | openCart() | openCart | wired | OK | global function |
| <button> | .nav-icon-btn | Wishlist | .nav-icon-btn | openWishlistDrawer() | openWishlistDrawer | wired | OK | global function |
| <button> | #userMenuBtn | Account Menu | #userMenuBtn | toggleUserDropdown() | toggleUserDropdown | wired | OK | global function |
| <button> | .account-popup__close | Close account menu | .account-popup__close | closeUserDropdown() | closeUserDropdown | wired | OK | global function |
| <button> | .ud-item | RoleAccess.goCustomerDashboard();closeUs | .ud-item | RoleAccess.goCustomerDashboard() | RoleAccess.goCustomerDashboard | wired | OK | namespaced export |
| <button> | .ud-item | RoleAccess.goEstimator();closeUserDropdo | .ud-item | RoleAccess.goEstimator() | RoleAccess.goEstimator | wired | OK | namespaced export |
| <button> | .ud-item | RoleAccess.goBulkQuote();closeUserDropdo | .ud-item | RoleAccess.goBulkQuote() | RoleAccess.goBulkQuote | wired | OK | namespaced export |
| <button> | .ud-item | openProfile();closeUserDropdown() | .ud-item | openProfile() | openProfile | wired | OK | global function |
| <button> | .ud-item | openAccountEditProfile() | .ud-item | openAccountEditProfile() | openAccountEditProfile | wired | OK | global function |
| <button> | .ud-item | closeUserDropdown();handleForgotPw() | .ud-item | closeUserDropdown() | closeUserDropdown | wired | OK | global function |
| <button> | .ud-item | openTrackerModal();closeUserDropdown() | .ud-item | openTrackerModal() | openTrackerModal | wired | OK | global function |
| <button> | .ud-item | openNotificationCenter();closeUserDropdo | .ud-item | openNotificationCenter() | openNotificationCenter | wired | OK | global function |
| <button> | .ud-item | openWishlistDrawer();closeUserDropdown() | .ud-item | openWishlistDrawer() | openWishlistDrawer | wired | OK | global function |
| <button> | .ud-item | requestSignOut(this) | .ud-item.ud-logout | requestSignOut(this) | requestSignOut | wired | OK | global function |
| <div> | #accountPopupBackdrop | closeUserDropdown() | #accountPopupBackdrop | closeUserDropdown() | closeUserDropdown | wired | OK | global function |
| <button> | #navToggle | Open Navigation Menu | #navToggle | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <div> | #drawerOverlay | toggleDrawer() | #drawerOverlay | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-close | Close Navigation Menu | .drawer-close | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <a> | .drawer-link | toggleDrawer();setActiveNav(this) | .drawer-link.active | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <a> | .drawer-link | toggleDrawer();setActiveNav(this) | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();openBulkQuoteModal() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();openWishlistDrawer() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();openTrackerModal() | .drawer-link.drawer-track-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();openNotificationCenter() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();handleMobileProfile() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();RoleAccess.goBulkQuote() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .drawer-link | toggleDrawer();openAdminPortal() | .drawer-link | toggleDrawer() | toggleDrawer | wired | OK | global function |
| <button> | .btn | nav.getQuote | .btn.btn-outline | openBulkQuoteModal() | openBulkQuoteModal | wired | OK | global function |
| <button> | .filter-sheet-close | Close filters | .filter-sheet-close | toggleFilterSheet(false) | toggleFilterSheet | wired | OK | global function |
| <button> | .btn | openBulkQuoteModal() | .btn.btn-primary | openBulkQuoteModal() | openBulkQuoteModal | wired | OK | global function |
| <button> | .btn | toggleFilterSheet(false) | .btn.btn-primary | toggleFilterSheet(false) | toggleFilterSheet | wired | OK | global function |
| <button> | .btn | toggleFilterSheet() | .btn.btn-outline | toggleFilterSheet() | toggleFilterSheet | wired | OK | global function |
| <div> | #filterSheetBackdrop | toggleFilterSheet(false) | #filterSheetBackdrop | toggleFilterSheet(false) | toggleFilterSheet | wired | OK | global function |
| <button> | #calcRefreshRatesBtn | refreshCalcRates() | #calcRefreshRatesBtn | refreshCalcRates() | refreshCalcRates | wired | OK | global function |
| <button> | #studioCalculate | runEstimate() | #studioCalculate | runEstimate() | runEstimate | wired | OK | global function |
| <button> | .studio-btn | resetCalc() | .studio-btn.studio-btn--ghost | resetCalc() | resetCalc | wired | OK | global function |
| <button> | #pincodeCheckBtn | calculator.pinBtn | #pincodeCheckBtn | runEstimatorPincodeCheck() | runEstimatorPincodeCheck | wired | OK | global function |
| <button> | .calc-saved-clear | calculator.savedClear | .calc-saved-clear | clearSavedEstimates() | clearSavedEstimates | wired | OK | global function |
| <button> | .btn | calculator.saveSiteBtn | .btn.btn-primary | saveConstructionSite() | saveConstructionSite | wired | OK | global function |
| <button> | .studio-mobile-bar__btn | scrollToCalcResult() | .studio-mobile-bar__btn | scrollToCalcResult() | scrollToCalcResult | wired | OK | global function |
| <button> | .btn | openBulkQuoteModal() | .btn.btn-outline | openBulkQuoteModal() | openBulkQuoteModal | wired | OK | global function |
| <button> | .faq-q | toggleFaq(this) | .faq-q | toggleFaq(this) | toggleFaq | wired | OK | global function |
| <button> | .compliance-copy | Copy GSTIN | .compliance-copy | copyFooterGstin() | copyFooterGstin | wired | OK | global function |
| <button> | inline | nav.trackOrder | onclick=openTrackerModal | openTrackerModal() | openTrackerModal | wired | OK | global function |
| <div> | #cartOverlay | closeCart() | #cartOverlay | closeCart() | closeCart | wired | OK | global function |
| <button> | .cart-close | Close cart | .cart-close | closeCart() | closeCart | wired | OK | global function |
| <button> | .cart-coupon-btn | cart.apply | .cart-coupon-btn | applyCoupon() | applyCoupon | wired | OK | global function |
| <button> | #checkoutBtn | openCheckout() | #checkoutBtn | openCheckout() | openCheckout | wired | OK | global function |
| <button> | .cart-wa-btn | WhatsAppOrder.orderFromCart() | .cart-wa-btn | WhatsAppOrder.orderFromCart() | WhatsAppOrder.orderFromCart | wired | OK | namespaced export |
| <div> | #wishlistOverlay | closeWishlistDrawer() | #wishlistOverlay | closeWishlistDrawer() | closeWishlistDrawer | wired | OK | global function |
| <button> | .cart-close | Close wishlist | .cart-close | closeWishlistDrawer() | closeWishlistDrawer | wired | OK | global function |
| <button> | .cart-checkout-btn | moveAllWishlistToCart() | .cart-checkout-btn | moveAllWishlistToCart() | moveAllWishlistToCart | wired | OK | global function |
| <div> | #authModal | Login or register | #authModal | handleAuthOverlayClick(event) | handleAuthOverlayClick | wired | OK | global function |
| <button> | .modal-close-btn | Close sign in | .modal-close-btn | closeAuth() | closeAuth | wired | OK | global function |
| <button> | .auth-forgot | auth.forgot | .auth-forgot | handleForgotPw() | handleForgotPw | wired | OK | global function |
| <button> | #googleCustomBtn | handleGoogleSignIn() | #googleCustomBtn | handleGoogleSignIn() | handleGoogleSignIn | wired | OK | global function |
| <button> | #googleCustomBtnReg | handleGoogleSignIn() | #googleCustomBtnReg | handleGoogleSignIn() | handleGoogleSignIn | wired | OK | global function |
| <div> | #profileModal | handleProfileOverlayClick(event) | #profileModal | handleProfileOverlayClick(event) | handleProfileOverlayClick | wired | OK | global function |
| <button> | .modal-close-btn | Close My Account | .modal-close-btn.profile-close-btn | closeProfile() | closeProfile | wired | OK | global function |
| <button> | .hub-tile | closeProfile();RoleAccess.goEstimator() | .hub-tile | closeProfile() | closeProfile | wired | OK | global function |
| <button> | .hub-tile | closeProfile();openTrackerModal() | .hub-tile | closeProfile() | closeProfile | wired | OK | global function |
| <button> | .hub-tile | closeProfile();RoleAccess.goBulkQuote() | .hub-tile | closeProfile() | closeProfile | wired | OK | global function |
| <button> | #profileEditBtn | switchToEditProfile() | #profileEditBtn | switchToEditProfile() | switchToEditProfile | wired | OK | global function |
| <button> | .hub-nav__row | openNotificationCenter() | .hub-nav__row | openNotificationCenter() | openNotificationCenter | wired | OK | global function |
| <button> | .btn | requestProfileSignOut() | .btn.btn-outline | requestProfileSignOut() | requestProfileSignOut | wired | OK | global function |
| <button> | #profileCancelEditBtn | cancelEditProfile() | #profileCancelEditBtn | cancelEditProfile() | cancelEditProfile | wired | OK | global function |
| <button> | .btn | openBulkQuoteModal() | .btn.btn-primary | openBulkQuoteModal() | openBulkQuoteModal | wired | OK | global function |
| <button> | .btn | addSiteFromProfile() | .btn.btn-primary | addSiteFromProfile() | addSiteFromProfile | wired | OK | global function |
| <button> | .btn | saveBuyerProfileType() | .btn.btn-primary | saveBuyerProfileType() | saveBuyerProfileType | wired | OK | global function |
| <div> | #checkoutModal | handleCheckoutOverlayClick(event) | #checkoutModal | handleCheckoutOverlayClick(event) | handleCheckoutOverlayClick | wired | OK | global function |
| <button> | .modal-close-btn | Close Checkout | .modal-close-btn | closeCheckout() | closeCheckout | wired | OK | global function |
| <button> | .co-photo-btn | SiteInspection.captureForCheckout() | .co-photo-btn | SiteInspection.captureForCheckout() | SiteInspection.captureForCheckout | wired | OK | namespaced export |
| <button> | .btn | toggleCheckoutSaveSite() | .btn.btn-outline | toggleCheckoutSaveSite() | toggleCheckoutSaveSite | wired | OK | global function |
| <button> | .btn | saveConstructionSite() | .btn.btn-primary | saveConstructionSite() | saveConstructionSite | wired | OK | global function |
| <div> | .pay-method | selectPayMethod(this) | .pay-method.selected | selectPayMethod(this) | selectPayMethod | wired | OK | global function |
| <div> | .pay-method | selectPayMethod(this) | .pay-method | selectPayMethod(this) | selectPayMethod | wired | OK | global function |
| <div> | .pay-method | selectPayMethod(this) | .pay-method.is-disabled | selectPayMethod(this) | selectPayMethod | wired | OK | global function |
| <button> | .upi-copy-btn | copyUpiId() | .upi-copy-btn | copyUpiId() | copyUpiId | wired | OK | global function |
| <button> | .btn | backToDetails() | .btn.btn-ghost | backToDetails() | backToDetails | wired | OK | global function |
| <button> | .btn | closeCheckout() | .btn.btn-outline | closeCheckout() | closeCheckout | wired | OK | global function |
| <button> | #coFootWa | confirmOrderOnWhatsApp() | #coFootWa | confirmOrderOnWhatsApp() | confirmOrderOnWhatsApp | wired | OK | global function |
| <button> | #coFootPrimary | coFootPrimaryAction() | #coFootPrimary | coFootPrimaryAction() | coFootPrimaryAction | wired | OK | global function |
| <div> | #bulkQuoteModal | if(event.target===this)closeBulkQuoteMod | #bulkQuoteModal | if(event.target===this)closeBulkQuoteModal() | if | BROKEN | NEEDS FIX | NOT FOUND |
| <button> | .modal-close-btn | Close dialog | .modal-close-btn | closeBulkQuoteModal() | closeBulkQuoteModal | wired | OK | global function |
| <button> | .btn | sendBulkQuoteViaWhatsApp() | .btn.btn-full | sendBulkQuoteViaWhatsApp() | sendBulkQuoteViaWhatsApp | wired | OK | global function |
| <div> | #adminPortalModal | if(event.target===this)closeAdminPortal( | #adminPortalModal | if(event.target===this)closeAdminPortal() | if | BROKEN | NEEDS FIX | NOT FOUND |
| <button> | .modal-close-btn | Close Admin Portal | .modal-close-btn.admin-close | closeAdminPortal() | closeAdminPortal | wired | OK | global function |
| <div> | #productModal | Product details | #productModal | handleProductModalClick(event) | handleProductModalClick | wired | OK | global function |
| <button> | .modal-close-btn | Close product details | .modal-close-btn | closeProductModal() | closeProductModal | wired | OK | global function |
| <div> | #compareModal | if(event.target===this)CatalogDiscovery. | #compareModal | if(event.target===this)CatalogDiscovery.closeCompareModal() | if | BROKEN | NEEDS FIX | NOT FOUND |
| <button> | .modal-close-btn | Close comparison | .modal-close-btn | CatalogDiscovery.closeCompareModal() | CatalogDiscovery.closeCompareModal | wired | OK | namespaced export |
| <div> | #pincodeModal | Delivery availability check | #pincodeModal | if(event.target===this)closePincodeModal() | if | BROKEN | NEEDS FIX | NOT FOUND |
| <button> | .modal-close-btn | Close delivery modal | .modal-close-btn | closePincodeModal() | closePincodeModal | wired | OK | global function |
| <button> | .btn | runModalPincodeCheck() | .btn.btn-primary | runModalPincodeCheck() | runModalPincodeCheck | wired | OK | global function |
| <button> | .btn | closePincodeModal() | .btn.btn-outline | closePincodeModal() | closePincodeModal | wired | OK | global function |
| <button> | #modalPincodeWaBtn | whatsappModalDeliveryQuote() | #modalPincodeWaBtn | whatsappModalDeliveryQuote() | whatsappModalDeliveryQuote | wired | OK | global function |
| <button> | .modal-close-btn | Close tracker | .modal-close-btn | closeTrackerModal() | closeTrackerModal | wired | OK | global function |
| <button> | .btn | trackOrderSubmit() | .btn.btn-primary | trackOrderSubmit() | trackOrderSubmit | wired | OK | global function |
| <button> | .modal-close-btn | closeGstInvoice() | .modal-close-btn | closeGstInvoice() | closeGstInvoice | wired | OK | global function |
| <button> | .btn | closeGstInvoice() | .btn.btn-outline | closeGstInvoice() | closeGstInvoice | wired | OK | global function |
| <button> | .btn | window.print() | .btn.btn-primary | window.print() | window.print | wired | OK | browser API |
| <button> | .modal-close-btn | Close | .modal-close-btn | closeInvoicePdf() | closeInvoicePdf | wired | OK | global function |
| <button> | .btn | printCurrentInvoice() | .btn.btn-outline | printCurrentInvoice() | printCurrentInvoice | wired | OK | global function |
| <button> | .btn | downloadCurrentInvoice() | .btn.btn-outline | downloadCurrentInvoice() | downloadCurrentInvoice | wired | OK | global function |
| <button> | .btn | shareCurrentInvoice() | .btn.btn-outline | shareCurrentInvoice() | shareCurrentInvoice | wired | OK | global function |
| <button> | .btn | resendCurrentInvoice() | .btn.btn-outline | resendCurrentInvoice() | resendCurrentInvoice | wired | OK | global function |
| <button> | .btn | closeInvoicePdf() | .btn.btn-primary | closeInvoicePdf() | closeInvoicePdf | wired | OK | global function |
| <button> | .modal-close-btn | Close | .modal-close-btn | closeCompanyProfile() | closeCompanyProfile | wired | OK | global function |
| <button> | .link-btn | clearCompanyLogo() | .link-btn | clearCompanyLogo() | clearCompanyLogo | wired | OK | global function |
| <button> | .btn | resetCompanyProfileForm() | .btn.btn-outline | resetCompanyProfileForm() | resetCompanyProfileForm | wired | OK | global function |
| <button> | .btn | closeCompanyProfile() | .btn.btn-outline | closeCompanyProfile() | closeCompanyProfile | wired | OK | global function |
| <button> | .btn | saveCompanyProfileForm() | .btn.btn-primary | saveCompanyProfileForm() | saveCompanyProfileForm | wired | OK | global function |
| <button> | .modal-close-btn | Close modal | .modal-close-btn | closeLegalModal() | closeLegalModal | wired | OK | global function |
| <button> | .btn | closeLegalModal() | .btn.btn-primary | closeLegalModal() | closeLegalModal | wired | OK | global function |
| <button> | .modal-close-btn | Close alerts | .modal-close-btn | closeNotificationCenter() | closeNotificationCenter | wired | OK | global function |
| <button> | #alertEnableBtn | PushNotifications.enableAlerts() | #alertEnableBtn | PushNotifications.enableAlerts() | PushNotifications.enableAlerts | wired | OK | namespaced export |
| <button> | .btn | PushNotifications.downloadRateCard() | .btn.btn-outline | PushNotifications.downloadRateCard() | PushNotifications.downloadRateCard | wired | OK | namespaced export |
| <button> | .btn | PushNotifications.checkAlertsNow() | .btn.btn-outline | PushNotifications.checkAlertsNow() | PushNotifications.checkAlertsNow | wired | OK | namespaced export |
| <button> | inline | PushNotifications.markAllRead() | onclick=PushNotifications.markAllRead | PushNotifications.markAllRead() | PushNotifications.markAllRead | wired | OK | namespaced export |
| <button> | inline | PushNotifications.clearAlerts() | onclick=PushNotifications.clearAlerts | PushNotifications.clearAlerts() | PushNotifications.clearAlerts | wired | OK | namespaced export |
| <button> | .chatbot-head-min | Minimize chat | .chatbot-head-min | minimizeChatbot() | minimizeChatbot | wired | OK | global function |
| <button> | .chatbot-head-close | Close chat | .chatbot-head-close | toggleChatbot(false) | toggleChatbot | wired | OK | global function |
| <button> | .chat-chip | openWhatsAppBhattaManager() | .chat-chip.chat-chip--wa | openWhatsAppBhattaManager() | openWhatsAppBhattaManager | wired | OK | global function |
| <button> | #chatSendBtn | Send message | #chatSendBtn | sendChat() | sendChat | wired | OK | global function |
| <button> | .fab-stack__menu-btn | Open kiln assistant chat | .fab-stack__menu-btn | toggleChatbot(true) | toggleChatbot | wired | OK | global function |
| <button> | #fabHelpBtn | Open help and chat | #fabHelpBtn | toggleFabHelp() | toggleFabHelp | wired | OK | global function |
| <button> | #scrollTopBtn | Back to top | #scrollTopBtn | scrollDocumentTop() | scrollDocumentTop | wired | OK | global function |
| <a> | .mn-item | Home | .mn-item.active | setMNActive(this) | setMNActive | wired | OK | global function |
| <a> | .mn-item | Product catalog | .mn-item | setMNActive(this) | setMNActive | wired | OK | global function |
| <button> | .mn-item | Brick estimator | .mn-item | openMobileEstimator(this) | openMobileEstimator | wired | OK | global function |
| <button> | .mn-item | Shopping cart | .mn-item.mn-item-cart | setMNActive(this, false) | setMNActive | wired | OK | global function |
| <button> | .mn-item | My account and profile | .mn-item | handleMobileProfile() | handleMobileProfile | wired | OK | global function |
| [data-action] | delegated | copy-diagnostics | [data-action="copy-diagnostics"] | action-delegate.js → copy-diagnostics | copy-diagnostics | dynamic/onclick | OK (delegated) | polish §1 |

## Summary

- Total mapped interactive patterns: **142**
- Initially broken / unresolved: **4**
- Product card / cart row buttons: migrated to `data-action` + delegation (Add to Cart, open product, wishlist, qty, remove).
- Namespaced handlers (`RoleAccess.*`, `WhatsAppOrder.*`, `PushNotifications.*`, `SiteInspection.*`, `CatalogDiscovery.*`) resolve via namespace exports + `action-delegate` aliases (`closeCompareModal`, `orderFromCart`).
- Diagnostics: Account Settings → **Diagnostics (copy for support)** (`data-action="copy-diagnostics"`).

## Could not fully migrate / open items

1. **Full onclick → data-action conversion for all ~260 static HTML handlers** — high regression risk in one pass. Static chrome still uses onclick calling the same function names; dynamic lists use delegation. Remaining static onclick are wired and verified by handler-existence audit.
2. **Live trigger of every control at 6 viewports × EN/HI × touch/keyboard** — partial smoke run documented in CHANGELOG; not every cell executed in this session.
3. **iOS Safari / installed PWA / Firefox / Edge matrix** — not run on physical devices in this environment; Chrome desktop smoke only.
4. **AVIF/WebP image encodes** — System.Drawing JPEG pipeline only; AVIF/WebP left open (see SHOT_LIST / CHANGELOG).

## Remaining unresolved handlers

None after review. The four `if(event.target===this)…` rows are **false positives** from the static audit (parser took `if` as the function name). Backdrop click-to-close calls `closeBulkQuoteModal`, `closeAdminPortal`, `CatalogDiscovery.closeCompareModal`, and `closePincodeModal` correctly.
