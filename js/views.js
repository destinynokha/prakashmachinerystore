// ===== Views (Home, Store, Product, Cart, Admin) =====
(function (PMS) {

    var wishlistIds = [];
    var curCat = 'All', curSort = 'newest', curSearch = '';

    // ==================== HOME PAGE ====================
    PMS.renderHome = function (el) {
        el.innerHTML =
            '<section class="hero-banner"><div class="container">' +
            '<h1>Prakash Machinery Store</h1>' +
            '<p>Your Trusted Partner for Quality Machinery Tools & Equipment</p>' +
            '<div class="hero-actions">' +
            '<a href="#" onclick="event.preventDefault();PMS.go(\'store\')" class="btn btn-primary btn-lg">Browse Store</a>' +
            '<a href="' + PMS.waUrl("Hello Prakash Machinery Store, I'm interested in your products") + '" target="_blank" class="btn btn-whatsapp btn-lg">\uD83D\uDCAC WhatsApp Us</a>' +
            '</div>' +
            '</div></section>' +
            '<section class="latest-section"><div class="container">' +
            '<div class="section-header"><h2>\uD83C\uDD95 Latest Products</h2><a href="#" onclick="event.preventDefault();PMS.go(\'store\')" class="btn btn-outline btn-sm">View All \u2192</a></div>' +
            '<div class="product-grid" id="latest-grid"></div>' +
            '</div></section>' +
            renderAbout();

        // Load latest 6 products
        var grid = document.getElementById('latest-grid');
        PMS.skeletons(grid);
        PMS.getLatestProducts(6).then(function (products) {
            if (!products.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCE6</div><h3>No products yet</h3></div>'; return; }
            grid.innerHTML = products.map(function (p) { return cardHTML(p); }).join('');
            bindCards(grid);
        }).catch(function () {
            grid.innerHTML = '<div class="empty-state"><div class="empty-icon">\u26A0\uFE0F</div><h3>Failed to load</h3></div>';
        });
    };

    // ==================== STORE PAGE ====================
    PMS.renderStore = function (el) {
        var wlPromise = PMS.isLoggedIn() ? PMS.getWishlist(PMS.currentUser.id).catch(function () { return []; }) : Promise.resolve([]);
        wlPromise.then(function (wl) {
            wishlistIds = wl;
            el.innerHTML =
                '<section class="store-page"><div class="container"><div class="store-layout">' +
                '<aside class="store-sidebar" id="store-sidebar"><h3 class="sidebar-title">\uD83D\uDCC2 Categories</h3><div class="sidebar-cats" id="sidebar-cats"></div></aside>' +
                '<div class="store-main">' +
                '<div class="store-toolbar">' +
                '<div class="store-search"><input class="form-input" id="search-input-store" placeholder="\uD83D\uDD0D Search products...">' +
                '</div>' +
                '<select class="form-select" id="sort-sel-store"><option value="newest">Newest</option><option value="name">Name A-Z</option><option value="price-low">Price: Low-High</option><option value="price-high">Price: High-Low</option></select>' +
                '</div>' +
                '<div class="catalog-header"><h2 id="cat-title">All Products</h2><span class="catalog-count" id="cat-count"></span></div>' +
                '<div class="product-grid" id="pgrid"></div>' +
                '<div id="cat-empty" class="empty-state hidden"><div class="empty-icon">\uD83D\uDD0D</div><h3>No products found</h3><p>Try changing your search or filter.</p></div>' +
                '</div></div></div></section>';

            loadSidebarCats();
            loadGrid();

            var si = document.getElementById('search-input-store');
            if (si) si.oninput = PMS.debounce(function (e) { curSearch = e.target.value; loadGrid(); });

            var ss = document.getElementById('sort-sel-store');
            if (ss) { ss.value = curSort; ss.onchange = function () { curSort = ss.value; loadGrid(); }; }

            // Also bind navbar search
            var sn = document.getElementById('search-input');
            if (sn) sn.oninput = PMS.debounce(function (e) { curSearch = e.target.value; if (si) si.value = curSearch; loadGrid(); });
        });
    };

    function loadSidebarCats() {
        var sc = document.getElementById('sidebar-cats');
        if (!sc) return;
        PMS.getCategories().then(function (cats) {
            var h = '<button class="sidebar-cat-btn ' + (curCat === 'All' ? 'active' : '') + '" data-c="All">All Products</button>';
            cats.forEach(function (c) {
                h += '<button class="sidebar-cat-btn ' + (curCat === c.name ? 'active' : '') + '" data-c="' + PMS.esc(c.name) + '">' + PMS.esc(c.name) + '</button>';
            });
            sc.innerHTML = h;
            sc.querySelectorAll('.sidebar-cat-btn').forEach(function (btn) {
                btn.onclick = function () {
                    curCat = btn.dataset.c;
                    sc.querySelectorAll('.sidebar-cat-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var ttl = document.getElementById('cat-title');
                    if (ttl) ttl.textContent = curCat === 'All' ? 'All Products' : curCat;
                    loadGrid();
                };
            });
        }).catch(function () {
            sc.innerHTML = '<p style="color:var(--text-muted);padding:8px">Loading...</p>';
        });
    }

    function loadGrid() {
        var grid = document.getElementById('pgrid'), empty = document.getElementById('cat-empty'), cnt = document.getElementById('cat-count');
        if (!grid) return;
        PMS.skeletons(grid);
        PMS.getProducts({ category: curCat, sortBy: curSort, search: curSearch }).then(function (products) {
            if (cnt) cnt.textContent = products.length + ' product' + (products.length !== 1 ? 's' : '');
            if (!products.length) { grid.innerHTML = ''; if (empty) empty.classList.remove('hidden'); return; }
            if (empty) empty.classList.add('hidden');
            grid.innerHTML = products.map(function (p) { return cardHTML(p); }).join('');
            bindCards(grid);
        }).catch(function (err) {
            console.error(err);
            grid.innerHTML = '<div class="empty-state"><div class="empty-icon">\u26A0\uFE0F</div><h3>Failed to load</h3><p>Check connection.</p></div>';
        });
    }

    function cardHTML(p) {
        var price = PMS.formatPrice(p.price), mrp = PMS.formatPrice(p.mrp), disc = PMS.calcDiscount(p.price, p.mrp);
        var wl = wishlistIds.includes(p.id);
        var img = (p.images && p.images[0]) || '';
        var priceH = price ? '<div class="product-card-price"><span class="price-current">' + price + '</span>' + (mrp && disc > 0 ? '<span class="price-mrp">' + mrp + '</span>' : '') + '</div>' : '<div class="product-card-price"><span class="price-contact">Contact for Price</span></div>';
        var badges = '';
        if (!p.in_stock) badges = '<span class="card-badge card-badge-outofstock">Out of Stock</span>';
        else if (disc > 0) badges = '<span class="card-badge card-badge-discount">' + disc + '% OFF</span>';
        return '<div class="product-card" data-id="' + p.id + '">' +
            '<div class="product-card-image">' +
            (img ? '<img src="' + PMS.esc(img) + '" alt="' + PMS.esc(p.name) + '" loading="lazy">' : '<div class="no-image">\uD83D\uDCE6</div>') +
            (badges ? '<div class="card-badges">' + badges + '</div>' : '') +
            '<div class="card-quick-actions"><button class="quick-action-btn wl-btn ' + (wl ? 'wishlisted' : '') + '" data-id="' + p.id + '">' + (wl ? '\u2764\uFE0F' : '\uD83E\uDD0D') + '</button></div>' +
            '</div>' +
            '<div class="product-card-body">' +
            '<div class="product-card-category">' + PMS.esc(p.category || '') + '</div>' +
            '<h3 class="product-card-title">' + PMS.esc(p.name) + '</h3>' +
            (p.brand ? '<div class="product-card-brand">' + PMS.esc(p.brand) + '</div>' : '') +
            priceH +
            '<div class="stock-indicator ' + (p.in_stock ? 'stock-in' : 'stock-out') + '"><span class="stock-dot"></span>' + (p.in_stock ? 'In Stock' : 'Out of Stock') + '</div>' +
            '<div class="product-card-footer">' +
            (p.in_stock ? '<button class="btn btn-primary btn-sm cart-btn" data-id="' + p.id + '">' + (price ? '\uD83D\uDED2 Add to Cart' : '\uD83D\uDCAC Enquire') + '</button>' : '<button class="btn btn-outline btn-sm" disabled>Out of Stock</button>') +
            '</div>' +
            '</div></div>';
    }

    function bindCards(grid) {
        grid.querySelectorAll('.product-card').forEach(function (card) {
            card.onclick = function (e) { if (!e.target.closest('.quick-action-btn') && !e.target.closest('.btn')) PMS.go('product', { id: card.dataset.id }); };
        });
        grid.querySelectorAll('.wl-btn').forEach(function (btn) {
            btn.onclick = function (e) {
                e.stopPropagation();
                if (!PMS.isLoggedIn()) { PMS.toast('Sign in to save items.', 'warning'); return; }
                var pid = btn.dataset.id, uid = PMS.currentUser.id;
                if (wishlistIds.includes(pid)) {
                    PMS.removeFromWishlist(uid, pid); wishlistIds = wishlistIds.filter(function (i) { return i !== pid; }); btn.classList.remove('wishlisted'); btn.innerHTML = '\uD83E\uDD0D';
                } else {
                    PMS.ensureProfile(function () {
                        PMS.addToWishlist(uid, pid); wishlistIds.push(pid); btn.classList.add('wishlisted'); btn.innerHTML = '\u2764\uFE0F';
                    });
                }
            };
        });
        grid.querySelectorAll('.cart-btn').forEach(function (btn) {
            btn.onclick = function (e) {
                e.stopPropagation(); var pid = btn.dataset.id;
                if (btn.textContent.includes('Enquire')) {
                    PMS.ensureProfile(function () {
                        var n = btn.closest('.product-card').querySelector('.product-card-title').textContent;
                        var msg = PMS.buildWaMessage('\uD83D\uDCE9 Product Enquiry', [{ name: n }]);
                        window.open(PMS.waUrl(msg), '_blank');
                    });
                    return;
                }
                PMS.ensureProfile(function () {
                    PMS.getProduct(pid).then(function (p) { if (p) PMS.addToCartItem(p); });
                });
            };
        });
    }

    function renderAbout() {
        return '<section class="about-section" id="about"><div class="container"><h2>About Us</h2><div class="section-divider"></div><div class="about-grid">' +
            '<div class="about-card"><h3>Who We Are</h3><p style="color:var(--text-secondary);line-height:1.8;font-size:.92rem">Prakash Machinery Store is your trusted partner for quality tools and machinery. We specialize in INGCO tools, welding machines, angle grinders, cutting wheels, and power tools.</p></div>' +
            '<div class="about-card" id="contact"><h3>Contact Us</h3>' +
            '<div class="contact-detail"><span class="icon">\uD83D\uDCCD</span><p>' + PMS.STORE.address + '</p></div>' +
            '<div class="contact-detail"><span class="icon">\uD83D\uDCDE</span><p><a href="tel:' + PMS.STORE.phone + '">' + PMS.STORE.phone + '</a></p></div>' +
            '<div class="contact-detail"><span class="icon">\u2709\uFE0F</span><p><a href="mailto:' + PMS.STORE.ordersEmail + '">' + PMS.STORE.ordersEmail + '</a></p></div>' +
            '<div class="contact-detail"><span class="icon">\uD83D\uDCAC</span><p><a href="https://wa.me/' + PMS.STORE.whatsapp + '" target="_blank">WhatsApp: ' + PMS.STORE.phone + '</a></p></div>' +
            '<div class="contact-detail"><span class="icon">\uD83D\uDD52</span><p>' + PMS.STORE.hours + '</p></div>' +
            '<div class="map-upi-row">' +
            '<iframe class="map-embed" src="' + PMS.STORE.mapUrl + '" allowfullscreen loading="lazy"></iframe>' +
            '<div class="upi-card-mini" onclick="PMS.go(\'pay\')">' +
            '<div class="upi-card-mini-header">\uD83D\uDCB3 Pay via UPI</div>' +
            '<img src="' + PMS.STORE.upiQr + '" alt="UPI QR Code" class="upi-qr-mini" onerror="this.src=\'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=' + encodeURIComponent(PMS.STORE.upiId) + '%26pn=' + encodeURIComponent(PMS.STORE.upiName) + '\'">' +
            '<div class="upi-id-mini">' + PMS.STORE.upiId + '</div>' +
            '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Tap to view full page</div>' +
            '</div></div>' +
            '</div></div></div></section>';
    }

    // ==================== PAY PAGE ====================
    PMS.renderPay = function (el) {
        el.innerHTML =
            '<section class="pay-page"><div class="container">' +
            '<div class="pay-card">' +
            '<div class="pay-header"><h1>\uD83D\uDCB3 Pay Prakash Machinery Store</h1><p style="color:var(--text-secondary)">Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)</p></div>' +
            '<div class="pay-body">' +
            '<div class="pay-qr-box">' +
            '<img src="' + PMS.STORE.upiQr + '" alt="UPI QR Code" class="pay-qr-img" onerror="this.src=\'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=upi://pay?pa=' + encodeURIComponent(PMS.STORE.upiId) + '%26pn=' + encodeURIComponent(PMS.STORE.upiName) + '\'">' +
            '</div>' +
            '<div class="pay-info">' +
            '<div class="pay-detail"><span class="pay-label">Payee Name</span><span class="pay-value">' + PMS.esc(PMS.STORE.upiName) + '</span></div>' +
            '<div class="pay-detail"><span class="pay-label">UPI ID</span><span class="pay-value" style="font-family:monospace;font-size:0.95rem">' + PMS.esc(PMS.STORE.upiId) + '</span></div>' +
            '<button class="btn btn-primary btn-lg" id="copy-upi" style="width:100%;margin-top:16px">\uD83D\uDCCB Copy UPI ID</button>' +
            '<a href="upi://pay?pa=' + encodeURIComponent(PMS.STORE.upiId) + '&pn=' + encodeURIComponent(PMS.STORE.upiName) + '" class="btn btn-whatsapp btn-lg" style="width:100%;margin-top:8px">\uD83D\uDCF1 Open UPI App</a>' +
            '</div></div>' +
            '<div class="pay-footer"><p>\u26A0\uFE0F After payment, share the screenshot on <a href="https://wa.me/' + PMS.STORE.whatsapp + '" target="_blank" style="color:var(--whatsapp);font-weight:600">WhatsApp</a> for order confirmation.</p></div>' +
            '</div></div></section>';

        document.getElementById('copy-upi').onclick = function () {
            navigator.clipboard.writeText(PMS.STORE.upiId).then(function () {
                PMS.toast('UPI ID copied!', 'success');
            }).catch(function () {
                // Fallback
                var t = document.createElement('textarea');
                t.value = PMS.STORE.upiId;
                document.body.appendChild(t);
                t.select();
                document.execCommand('copy');
                document.body.removeChild(t);
                PMS.toast('UPI ID copied!', 'success');
            });
        };
    };

    // ==================== PRODUCT DETAIL ====================
    PMS.renderProduct = function (el, params) {
        var pid = params.id;
        if (!pid) { el.innerHTML = '<div class="empty-state"><h3>Product not found</h3></div>'; return; }
        el.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Loading...</p></div>';
        PMS.getProduct(pid).then(function (p) {
            if (!p) { el.innerHTML = '<div class="container" style="padding:60px 0"><div class="empty-state"><div class="empty-icon">\uD83D\uDCE6</div><h3>Product Not Found</h3><button class="btn btn-primary" onclick="PMS.go(\'home\')">Back to Store</button></div></div>'; return; }
            var wlP = PMS.isLoggedIn() ? PMS.getWishlist(PMS.currentUser.id).catch(function () { return []; }) : Promise.resolve([]);
            wlP.then(function (wl) {
                var isWl = wl.includes(pid);
                var price = PMS.formatPrice(p.price), mrp = PMS.formatPrice(p.mrp), disc = PMS.calcDiscount(p.price, p.mrp);
                var imgs = (p.images && p.images.length) ? p.images : [];
                var mainImg = imgs[0] || '';
                var priceH = price ? '<div class="product-detail-price"><span class="detail-price-current">' + price + '</span>' + (mrp && disc > 0 ? '<span class="detail-price-mrp">' + mrp + '</span><span class="detail-price-discount">' + disc + '% OFF</span>' : '') + '</div>' : '<div class="product-detail-price"><span class="price-contact" style="font-size:1.2rem">Contact for Price</span></div>';
                var specsH = '';
                if (p.specifications && Object.keys(p.specifications).length) {
                    specsH = '<div><h3 style="font-size:1.05rem;font-weight:700;margin-bottom:12px">Specifications</h3><table class="specs-table">';
                    Object.entries(p.specifications).forEach(function (kv) { specsH += '<tr><td>' + PMS.esc(kv[0]) + '</td><td>' + PMS.esc(kv[1]) + '</td></tr>'; });
                    specsH += '</table></div>';
                }
                var waMsg = "Hi, I'm interested in: " + p.name + (price ? ' (' + price + ')' : '') + ". Please share details.";
                el.innerHTML = '<section class="product-detail"><div class="container">' +
                    '<div class="breadcrumb"><a href="#" onclick="event.preventDefault();PMS.go(\'home\')">Home</a><span class="sep">\u203A</span><a href="#" onclick="event.preventDefault();PMS.go(\'store\')">Store</a><span class="sep">\u203A</span><span>' + PMS.esc(p.name) + '</span></div>' +
                    '<div class="product-detail-grid"><div class="product-gallery"><div class="gallery-main" id="gmain">' + (mainImg ? '<img src="' + PMS.esc(mainImg) + '" alt="' + PMS.esc(p.name) + '">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem">\uD83D\uDCE6</div>') + '</div>' +
                    (imgs.length > 1 ? '<div class="gallery-thumbs">' + imgs.map(function (im, i) { return '<div class="gallery-thumb ' + (i === 0 ? 'active' : '') + '" data-src="' + PMS.esc(im) + '"><img src="' + PMS.esc(im) + '" alt="Thumb"></div>'; }).join('') + '</div>' : '') +
                    '</div>' +
                    '<div class="product-info-section">' +
                    (p.category ? '<div class="product-detail-category">' + PMS.esc(p.category) + '</div>' : '') +
                    '<h1 class="product-detail-title">' + PMS.esc(p.name) + '</h1>' +
                    (p.brand ? '<div class="product-detail-brand">by ' + PMS.esc(p.brand) + '</div>' : '') +
                    priceH +
                    '<div class="stock-indicator ' + (p.in_stock ? 'stock-in' : 'stock-out') + '"><span class="stock-dot"></span>' + (p.in_stock ? 'In Stock' : 'Out of Stock') + '</div>' +
                    '<p class="product-detail-desc">' + PMS.esc(p.description || '') + '</p>' +
                    specsH +
                    '<div class="product-detail-actions">' +
                    (p.in_stock && price ? '<button class="btn btn-primary btn-lg" id="d-cart">\uD83D\uDED2 Add to Cart</button>' : '') +
                    '<a href="' + PMS.waUrl(waMsg) + '" target="_blank" class="btn btn-whatsapp btn-lg">\uD83D\uDCAC ' + (price ? 'Ask on WhatsApp' : 'Enquire') + '</a>' +
                    '<button class="btn btn-outline" id="d-wl">' + (isWl ? '\u2764\uFE0F Saved' : '\uD83E\uDD0D Save') + '</button>' +
                    '</div></div></div></div></section>';

                el.querySelectorAll('.gallery-thumb').forEach(function (th) {
                    th.onclick = function () { document.getElementById('gmain').innerHTML = '<img src="' + th.dataset.src + '" alt="">'; el.querySelectorAll('.gallery-thumb').forEach(function (t) { t.classList.remove('active'); }); th.classList.add('active'); };
                });
                var cb = document.getElementById('d-cart');
                if (cb) cb.onclick = function () { PMS.ensureProfile(function () { PMS.addToCartItem(p); }); };
                var wb = document.getElementById('d-wl');
                if (wb) wb.onclick = function () {
                    if (!PMS.isLoggedIn()) { PMS.toast('Sign in to save.', 'warning'); return; }
                    if (isWl) { PMS.removeFromWishlist(PMS.currentUser.id, pid); isWl = false; wb.innerHTML = '\uD83E\uDD0D Save'; PMS.toast('Removed.', 'info'); }
                    else { PMS.ensureProfile(function () { PMS.addToWishlist(PMS.currentUser.id, pid); isWl = true; wb.innerHTML = '\u2764\uFE0F Saved'; PMS.toast('Saved!', 'success'); }); }
                };
            });
        });
    };

    // ==================== CART PAGE ====================
    PMS.renderCart = function (el) {
        if (!PMS.isLoggedIn()) { el.innerHTML = '<div class="container" style="padding:60px 0"><div class="empty-state"><div class="empty-icon">\uD83D\uDD12</div><h3>Sign in to view cart</h3><button class="btn btn-primary" onclick="PMS.go(\'home\')">Back</button></div></div>'; return; }
        var cart = PMS.getCart();
        if (!cart.length) { el.innerHTML = '<section class="cart-page"><div class="container"><h1>\uD83D\uDED2 Your Cart</h1><div class="cart-empty"><div class="empty-icon">\uD83D\uDED2</div><h3>Cart is empty</h3><p>Browse products and add items.</p><button class="btn btn-primary" onclick="PMS.go(\'store\')">Browse</button></div></div></section>'; return; }
        var total = PMS.cartTotal(), unp = PMS.hasUnpriced();
        var itemsH = cart.map(function (it) {
            return '<div class="cart-item" data-id="' + it.productId + '"><div class="cart-item-image">' + (it.image ? '<img src="' + PMS.esc(it.image) + '" alt="">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">\uD83D\uDCE6</div>') + '</div><div class="cart-item-info"><div class="cart-item-title">' + PMS.esc(it.name) + '</div><div class="cart-item-price">' + (it.price ? PMS.formatPrice(it.price) : '<span style="color:var(--accent)">Contact for Price</span>') + '</div><div class="cart-item-actions"><div class="qty-control"><button class="qm" data-id="' + it.productId + '">−</button><span>' + it.qty + '</span><button class="qp" data-id="' + it.productId + '">+</button></div><button class="btn btn-ghost btn-sm" style="color:var(--danger);margin-left:auto" data-rm="' + it.productId + '">Remove</button></div></div></div>';
        }).join('');
        el.innerHTML = '<section class="cart-page"><div class="container"><h1>\uD83D\uDED2 Your Cart (' + PMS.cartCount() + ' items)</h1><div class="cart-grid"><div class="cart-items">' + itemsH + '</div>' +
            '<div class="cart-summary"><h3>Order Summary</h3>' +
            cart.filter(function (i) { return i.price; }).map(function (i) { return '<div class="cart-summary-row"><span>' + PMS.esc(i.name) + ' \u00D7 ' + i.qty + '</span><span>' + PMS.formatPrice(i.price * i.qty) + '</span></div>'; }).join('') +
            (unp ? '<div class="cart-summary-row" style="color:var(--accent)"><span>Contact-price items</span><span>' + cart.filter(function (i) { return !i.price; }).length + '</span></div>' : '') +
            '<div class="cart-summary-row total"><span>Estimated Total</span><span>' + (total > 0 ? PMS.formatPrice(total) : 'Contact for pricing') + '</span></div>' +
            '<button class="btn btn-primary btn-lg" id="place-btn">\uD83D\uDCE6 Place Order</button>' +
            '<button class="btn btn-whatsapp" id="wa-btn" style="margin-top:8px">\uD83D\uDCAC Order via WhatsApp</button>' +
            '<button class="btn btn-ghost" id="clr-btn" style="margin-top:8px;color:var(--danger);width:100%">Clear Cart</button>' +
            '</div></div></div></section>';
        el.querySelectorAll('.qm').forEach(function (b) { b.onclick = function () { var c = PMS.getCart(), it = c.find(function (i) { return i.productId === b.dataset.id; }); if (it) PMS.updateCartQty(b.dataset.id, it.qty - 1); PMS.renderCart(el); }; });
        el.querySelectorAll('.qp').forEach(function (b) { b.onclick = function () { var c = PMS.getCart(), it = c.find(function (i) { return i.productId === b.dataset.id; }); if (it) PMS.updateCartQty(b.dataset.id, it.qty + 1); PMS.renderCart(el); }; });
        el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { PMS.removeFromCart(b.dataset.rm); PMS.toast('Removed.', 'info'); PMS.renderCart(el); }; });
        document.getElementById('clr-btn').onclick = function () { if (confirm('Clear cart?')) { PMS.clearCart(); PMS.renderCart(el); } };
        document.getElementById('wa-btn').onclick = function () { PMS.ensureProfile(function () { sendWA(); }); };
        document.getElementById('place-btn').onclick = function () { PMS.ensureProfile(function () { placeOrder(el); }); };
    };

    function sendWA(ordId) {
        var cart = PMS.getCart(), total = PMS.cartTotal();
        var title = '\uD83D\uDED2 New Order' + (ordId ? ' #' + ordId.substring(0, 8).toUpperCase() : '');
        var msg = PMS.buildWaMessage(title, cart, total);
        window.open(PMS.waUrl(msg), '_blank');
    }

    function placeOrder(el) {
        var user = PMS.currentUser, cart = PMS.getCart(), total = PMS.cartTotal();
        var profile = PMS.getCustomerProfile() || {};
        var btn = document.getElementById('place-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Placing...'; }
        PMS.createOrder({
            user_id: user.id, customer_name: profile.name || user.user_metadata.full_name || '', customer_email: user.email, items: cart.map(function (i) { return { productId: i.productId, name: i.name, price: i.price, qty: i.qty }; }), total: total > 0 ? total : null
        }).then(function (ref) {
            sendWA(ref.id);
            PMS.clearCart();
            PMS.toast('Order placed! \uD83C\uDF89', 'success');
            el.querySelector('.cart-page .container').innerHTML = '<div class="empty-state" style="padding:40px 0"><div class="empty-icon" style="font-size:5rem;opacity:1">\uD83C\uDF89</div><h3 style="font-size:1.5rem">Order Placed!</h3><p>Your order has been sent to the store owner via WhatsApp.</p><button class="btn btn-primary" onclick="PMS.go(\'home\')">Continue Shopping</button></div>';
        }).catch(function (err) { console.error(err); PMS.toast('Order failed. Try WhatsApp.', 'error'); if (btn) { btn.disabled = false; btn.textContent = '\uD83D\uDCE6 Place Order'; } });
    }

    // ==================== WISHLIST PAGE ====================
    PMS.renderWishlist = function (el) {
        if (!PMS.isLoggedIn()) { el.innerHTML = '<div class="container" style="padding:60px 0"><div class="empty-state"><div class="empty-icon">\uD83D\uDD12</div><h3>Sign in to view wishlist</h3><button class="btn btn-primary" onclick="PMS.go(\'home\')">Back</button></div></div>'; return; }
        el.innerHTML = '<section class="cart-page"><div class="container"><h1>\u2764\uFE0F My Wishlist</h1><div class="loading-screen"><div class="spinner"></div></div></div></section>';

        Promise.all([
            PMS.getWishlist(PMS.currentUser.id),
            PMS.getProducts()
        ]).then(function (results) {
            var wlIds = results[0], allProducts = results[1];
            var items = allProducts.filter(function (p) { return wlIds.includes(p.id); });

            if (!items.length) {
                el.querySelector('.cart-page .container').innerHTML = '<h1>\u2764\uFE0F My Wishlist</h1><div class="empty-state"><div class="empty-icon">\u2764\uFE0F</div><h3>Wishlist is empty</h3><p>Browse products and save items you like.</p><button class="btn btn-primary" onclick="PMS.go(\'store\')">Browse Store</button></div>';
                return;
            }

            var itemsH = items.map(function (p) {
                var price = PMS.formatPrice(p.price);
                var img = (p.images && p.images[0]) || '';
                return '<div class="cart-item" data-id="' + p.id + '">' +
                    '<div class="cart-item-image">' + (img ? '<img src="' + PMS.esc(img) + '" alt="">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">\uD83D\uDCE6</div>') + '</div>' +
                    '<div class="cart-item-info">' +
                    '<div class="cart-item-title" style="cursor:pointer" onclick="PMS.go(\'product\',{id:\'' + p.id + '\'})">' + PMS.esc(p.name) + '</div>' +
                    '<div class="cart-item-price">' + (price || '<span style="color:var(--accent)">Contact for Price</span>') + '</div>' +
                    '<div class="cart-item-actions">' +
                    (p.in_stock ? '<button class="btn btn-primary btn-sm wl-cart-btn" data-id="' + p.id + '">\uD83D\uDED2 Add to Cart</button>' : '<span class="btn btn-outline btn-sm" style="opacity:0.5">Out of Stock</span>') +
                    '<button class="btn btn-ghost btn-sm" style="color:var(--danger);margin-left:auto" data-rmwl="' + p.id + '">Remove</button>' +
                    '</div></div></div>';
            }).join('');

            el.querySelector('.cart-page .container').innerHTML =
                '<h1>\u2764\uFE0F My Wishlist (' + items.length + ' items)</h1>' +
                '<div class="cart-grid"><div class="cart-items">' + itemsH + '</div>' +
                '<div class="cart-summary"><h3>Wishlist Actions</h3>' +
                '<p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:16px">Send your entire wishlist to the store owner via WhatsApp for pricing and availability.</p>' +
                '<button class="btn btn-whatsapp btn-lg" id="wl-wa-btn" style="width:100%">\uD83D\uDCAC Share via WhatsApp</button>' +
                '<button class="btn btn-outline" id="wl-all-cart" style="margin-top:8px;width:100%">\uD83D\uDED2 Add All to Cart</button>' +
                '</div></div>';

            // Bind actions
            el.querySelectorAll('[data-rmwl]').forEach(function (b) {
                b.onclick = function () {
                    PMS.removeFromWishlist(PMS.currentUser.id, b.dataset.rmwl).then(function () {
                        PMS.toast('Removed.', 'info'); PMS.renderWishlist(el);
                    });
                };
            });
            el.querySelectorAll('.wl-cart-btn').forEach(function (b) {
                b.onclick = function () {
                    var prod = items.find(function (p) { return p.id === b.dataset.id; });
                    if (prod) { PMS.ensureProfile(function () { PMS.addToCartItem(prod); }); }
                };
            });
            document.getElementById('wl-wa-btn').onclick = function () {
                PMS.ensureProfile(function () {
                    var msg = PMS.buildWaMessage('\u2764\uFE0F Wishlist Enquiry', items.map(function (p) { return { name: p.name, price: p.price, qty: 1 }; }));
                    window.open(PMS.waUrl(msg), '_blank');
                });
            };
            document.getElementById('wl-all-cart').onclick = function () {
                PMS.ensureProfile(function () {
                    items.forEach(function (p) { if (p.in_stock) PMS.addToCartItem(p); });
                    PMS.toast('Added all in-stock items to cart!', 'success');
                });
            };
        }).catch(function (err) {
            console.error(err);
            el.querySelector('.cart-page .container').innerHTML = '<h1>\u2764\uFE0F My Wishlist</h1><div class="empty-state"><div class="empty-icon">\u26A0\uFE0F</div><h3>Failed to load</h3></div>';
        });
    };

    // ==================== ADMIN ====================
    PMS.renderAdmin = function (el) {
        if (!PMS.isOwner()) { el.innerHTML = '<div class="container" style="padding:60px 0"><div class="empty-state"><div class="empty-icon">\uD83D\uDD12</div><h3>Access Denied</h3><button class="btn btn-primary" onclick="PMS.go(\'home\')">Back</button></div></div>'; return; }
        var tab = 'products';
        el.innerHTML = '<section class="admin-page"><div class="container"><div class="admin-header"><h1>\uD83D\uDCCB Admin Dashboard</h1><button class="btn btn-primary" id="add-btn">+ Add Product</button></div>' +
            '<div class="admin-tabs"><button class="admin-tab active" data-t="products">Products</button><button class="admin-tab" data-t="categories">Categories</button><button class="admin-tab" data-t="orders">Orders</button></div>' +
            '<div id="admin-c"></div></div></section>' +
            '<div class="modal-overlay" id="pf-modal"><div class="modal-box" style="max-width:700px"><div class="modal-box-header"><h3 id="pf-title">Add Product</h3><button class="modal-close" id="pf-close">\u2715</button></div><div class="modal-box-body"><form id="pf-form">' +
            '<div class="form-grid">' +
            '<div class="form-group full-width"><label class="form-label">Name *</label><input class="form-input" id="pf-n" required placeholder="Product name"></div>' +
            '<div class="form-group"><label class="form-label">Category *</label><select class="form-select" id="pf-cat" required><option value="">Select</option></select></div>' +
            '<div class="form-group"><label class="form-label">Brand <span class="optional">(opt)</span></label><input class="form-input" id="pf-br" placeholder="Brand"></div>' +
            '<div class="form-group"><label class="form-label">Price \u20B9 <span class="optional">(opt)</span></label><input type="number" class="form-input" id="pf-pr" placeholder="0" min="0"></div>' +
            '<div class="form-group"><label class="form-label">MRP \u20B9 <span class="optional">(opt)</span></label><input type="number" class="form-input" id="pf-mrp" placeholder="0" min="0"></div>' +
            '<div class="form-group full-width"><label class="form-label">Description *</label><textarea class="form-textarea" id="pf-desc" required placeholder="Description"></textarea></div>' +
            '<div class="form-group full-width"><label class="form-label">Product Images</label>' +
            '<div class="image-upload-area" id="img-area"><div class="upload-icon">\uD83D\uDCF8</div><p>Click or drag to upload photos (max 4)</p><input type="file" id="pf-files" multiple accept="image/*" style="display:none"></div>' +
            '<div class="image-preview-grid" id="img-prev"></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">In Stock</label><label class="toggle-switch"><input type="checkbox" id="pf-stock" checked><div class="toggle-track"></div><span class="toggle-label">Available</span></label></div>' +
            '<div class="form-group full-width"><label class="form-label">Specs <span class="optional">(Key: Value, one per line)</span></label><textarea class="form-textarea" id="pf-specs" placeholder="Power: 900W" style="min-height:70px"></textarea></div>' +
            '</div>' +
            '<div class="form-actions"><button type="button" class="btn btn-ghost" id="pf-cancel">Cancel</button><button type="submit" class="btn btn-primary" id="pf-save">Save</button></div>' +
            '</form></div></div></div>' +
            '<div class="modal-overlay" id="del-modal"><div class="modal-box" style="max-width:400px"><div class="modal-box-header"><h3>Delete</h3><button class="modal-close" id="del-close">\u2715</button></div><div class="modal-box-body"><p>Delete <strong id="del-name"></strong>?</p></div><div class="modal-box-footer"><button class="btn btn-ghost" id="del-no">Cancel</button><button class="btn btn-danger" id="del-yes">Delete</button></div></div></div>';

        // Tab switching
        el.querySelectorAll('.admin-tab').forEach(function (t) {
            t.onclick = function () {
                tab = t.dataset.t;
                el.querySelectorAll('.admin-tab').forEach(function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                document.getElementById('add-btn').style.display = tab === 'orders' ? 'none' : '';
                document.getElementById('add-btn').textContent = tab === 'categories' ? '+ Add Category' : '+ Add Product';
                loadTab();
            };
        });

        var imgItems = [];
        var editProd = null;

        document.getElementById('add-btn').onclick = function () { if (tab === 'categories') openCatForm(); else openForm(); };
        document.getElementById('pf-close').onclick = closeForm;
        document.getElementById('pf-cancel').onclick = closeForm;
        document.getElementById('pf-modal').onclick = function (e) { if (e.target === e.currentTarget) closeForm(); };
        document.getElementById('del-close').onclick = closeDel;
        document.getElementById('del-no').onclick = closeDel;
        document.getElementById('del-modal').onclick = function (e) { if (e.target === e.currentTarget) closeDel(); };
        document.getElementById('pf-form').onsubmit = submitForm;

        var uploadArea = document.getElementById('img-area');
        var fileInput = document.getElementById('pf-files');
        uploadArea.onclick = function () { fileInput.click(); };
        uploadArea.ondragover = function (e) { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary)'; };
        uploadArea.ondragleave = function () { uploadArea.style.borderColor = ''; };
        uploadArea.ondrop = function (e) { e.preventDefault(); uploadArea.style.borderColor = ''; handleFiles(e.dataTransfer.files); };
        fileInput.onchange = function () { handleFiles(fileInput.files); fileInput.value = ''; };

        function handleFiles(files) {
            Array.from(files).forEach(function (f) {
                if (imgItems.length >= 4) { PMS.toast('Max 4 images.', 'warning'); return; }
                if (!f.type.startsWith('image/')) return;
                var r = new FileReader();
                r.onload = function (e) { imgItems.push({ type: 'file', file: f, preview: e.target.result }); renderPrev(); };
                r.readAsDataURL(f);
            });
        }

        function renderPrev() {
            var c = document.getElementById('img-prev'); if (!c) return;
            c.innerHTML = imgItems.map(function (im, i) {
                var src = im.type === 'url' ? im.url : im.preview;
                return '<div class="image-preview"><img src="' + PMS.esc(src) + '" onerror="this.style.opacity=0.3"><button type="button" class="remove-btn" data-i="' + i + '">\u2715</button></div>';
            }).join('');
            c.querySelectorAll('.remove-btn').forEach(function (b) { b.onclick = function () { imgItems.splice(parseInt(b.dataset.i), 1); renderPrev(); }; });
        }

        function openForm(product) {
            editProd = product; imgItems = [];
            PMS.getCategories().then(function (cats) {
                var sel = document.getElementById('pf-cat');
                sel.innerHTML = '<option value="">Select</option>' + cats.map(function (c) { return '<option value="' + PMS.esc(c.name) + '">' + PMS.esc(c.name) + '</option>'; }).join('');
                if (product) {
                    document.getElementById('pf-title').textContent = 'Edit Product';
                    document.getElementById('pf-save').textContent = 'Update';
                    document.getElementById('pf-n').value = product.name || '';
                    sel.value = product.category || '';
                    document.getElementById('pf-br').value = product.brand || '';
                    document.getElementById('pf-pr').value = product.price || '';
                    document.getElementById('pf-mrp').value = product.mrp || '';
                    document.getElementById('pf-desc').value = product.description || '';
                    document.getElementById('pf-stock').checked = product.in_stock !== false;
                    document.getElementById('pf-specs').value = product.specifications ? Object.entries(product.specifications).map(function (kv) { return kv[0] + ': ' + kv[1]; }).join('\n') : '';
                    imgItems = (product.images || []).map(function (u) { return { type: 'url', url: u }; });
                    renderPrev();
                } else {
                    document.getElementById('pf-title').textContent = 'Add Product';
                    document.getElementById('pf-save').textContent = 'Save';
                    document.getElementById('pf-form').reset();
                    document.getElementById('pf-stock').checked = true;
                    document.getElementById('img-prev').innerHTML = '';
                }
                document.getElementById('pf-modal').classList.add('open');
            });
        }
        function closeForm() { document.getElementById('pf-modal').classList.remove('open'); editProd = null; imgItems = []; }

        function submitForm(e) {
            e.preventDefault();
            var btn = document.getElementById('pf-save'); btn.disabled = true; btn.textContent = 'Saving...';
            var specs = {};
            document.getElementById('pf-specs').value.trim().split('\n').forEach(function (l) { var ci = l.indexOf(':'); if (ci > 0) { var k = l.substring(0, ci).trim(), v = l.substring(ci + 1).trim(); if (k && v) specs[k] = v; } });
            var data = {
                name: document.getElementById('pf-n').value.trim(),
                category: document.getElementById('pf-cat').value,
                brand: document.getElementById('pf-br').value.trim(),
                price: document.getElementById('pf-pr').value ? parseFloat(document.getElementById('pf-pr').value) : null,
                mrp: document.getElementById('pf-mrp').value ? parseFloat(document.getElementById('pf-mrp').value) : null,
                description: document.getElementById('pf-desc').value.trim(),
                in_stock: document.getElementById('pf-stock').checked,
                specifications: specs
            };

            var existingUrls = imgItems.filter(function (i) { return i.type === 'url'; }).map(function (i) { return i.url; });
            var newFiles = imgItems.filter(function (i) { return i.type === 'file'; }).map(function (i) { return i.file; });

            var savePromise;
            if (editProd) {
                savePromise = (newFiles.length > 0 ? PMS.uploadImages(newFiles, editProd.id) : Promise.resolve([])).then(function (newUrls) {
                    data.images = existingUrls.concat(newUrls);
                    return PMS.updateProduct(editProd.id, data);
                });
            } else {
                savePromise = PMS.addProduct(data).then(function (product) {
                    if (newFiles.length > 0) {
                        return PMS.uploadImages(newFiles, product.id).then(function (urls) {
                            return PMS.updateProduct(product.id, { images: existingUrls.concat(urls) });
                        });
                    } else if (existingUrls.length > 0) {
                        return PMS.updateProduct(product.id, { images: existingUrls });
                    }
                });
            }

            savePromise.then(function () { PMS.toast(editProd ? 'Updated!' : 'Added!', 'success'); closeForm(); loadTab(); })
                .catch(function (err) { console.error(err); PMS.toast('Save failed.', 'error'); })
                .finally(function () { btn.disabled = false; btn.textContent = editProd ? 'Update' : 'Save'; });
        }

        // ---- Category form (uses prompt for simplicity) ----
        function openCatForm(cat) {
            var name = prompt(cat ? 'Edit category name:' : 'New category name:', cat ? cat.name : '');
            if (!name || !name.trim()) return;
            var order = cat ? cat.sort_order : 99;
            var orderStr = prompt('Sort order (number):', String(order));
            var sortOrder = parseInt(orderStr) || 0;

            if (cat) {
                PMS.updateCategory(cat.id, { name: name.trim(), sort_order: sortOrder }).then(function () { PMS.toast('Updated!', 'success'); loadTab(); }).catch(function () { PMS.toast('Failed.', 'error'); });
            } else {
                PMS.addCategory({ name: name.trim(), sort_order: sortOrder }).then(function () { PMS.toast('Added!', 'success'); loadTab(); }).catch(function () { PMS.toast('Failed.', 'error'); });
            }
        }

        var delId, delType;
        function openDel(id, name, type) {
            delId = id; delType = type || 'product';
            document.getElementById('del-name').textContent = name;
            document.getElementById('del-modal').classList.add('open');
            document.getElementById('del-yes').onclick = function () {
                var p = delType === 'category' ? PMS.deleteCategory(delId) : PMS.deleteProduct(delId);
                p.then(function () { PMS.toast('Deleted.', 'success'); closeDel(); loadTab(); }).catch(function () { PMS.toast('Delete failed.', 'error'); });
            };
        }
        function closeDel() { document.getElementById('del-modal').classList.remove('open'); }

        function loadTab() {
            var c = document.getElementById('admin-c');
            if (tab === 'products') loadProds(c);
            else if (tab === 'categories') loadCats(c);
            else loadOrds(c);
        }

        function loadProds(c) {
            c.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';
            PMS.getProducts().then(function (prods) {
                if (!prods.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCE6</div><h3>No products</h3><button class="btn btn-primary" id="seed-btn">\uD83C\uDF31 Import Demo</button></div>'; document.getElementById('seed-btn').onclick = function () { PMS.seedProducts().then(function () { PMS.toast('Imported!', 'success'); loadProds(c); }); }; return; }
                c.innerHTML = '<div class="admin-product-list">' + prods.map(function (p) {
                    return '<div class="admin-product-item"><div class="admin-product-thumb">' + (p.images && p.images[0] ? '<img src="' + PMS.esc(p.images[0]) + '" alt="">' : '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">\uD83D\uDCE6</div>') + '</div><div class="admin-product-info"><h4>' + PMS.esc(p.name) + '</h4><div class="meta">' + PMS.esc(p.category || '') + ' \u00B7 ' + (p.price ? PMS.formatPrice(p.price) : 'No price') + ' \u00B7 <span class="stock-indicator ' + (p.in_stock ? 'stock-in' : 'stock-out') + '" style="display:inline-flex"><span class="stock-dot"></span>' + (p.in_stock ? 'In Stock' : 'Out') + '</span></div></div><div class="admin-product-actions"><button class="btn btn-outline btn-sm ed-btn" data-id="' + p.id + '">\u270F\uFE0F Edit</button><button class="btn btn-sm dl-btn" style="color:var(--danger)" data-id="' + p.id + '" data-nm="' + PMS.esc(p.name) + '">\uD83D\uDDD1\uFE0F</button></div></div>';
                }).join('') + '</div>';
                c.querySelectorAll('.ed-btn').forEach(function (b) { b.onclick = function () { var pr = prods.find(function (x) { return x.id === b.dataset.id; }); if (pr) openForm(pr); }; });
                c.querySelectorAll('.dl-btn').forEach(function (b) { b.onclick = function () { openDel(b.dataset.id, b.dataset.nm, 'product'); }; });
            });
        }

        function loadCats(c) {
            c.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';
            PMS.getCategories().then(function (cats) {
                if (!cats.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCC2</div><h3>No categories</h3></div>'; return; }
                c.innerHTML = '<div class="admin-product-list">' + cats.map(function (cat) {
                    return '<div class="admin-product-item"><div class="admin-product-thumb" style="background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:var(--primary)">' + (cat.sort_order || 0) + '</div><div class="admin-product-info"><h4>' + PMS.esc(cat.name) + '</h4><div class="meta">Order: ' + (cat.sort_order || 0) + '</div></div><div class="admin-product-actions"><button class="btn btn-outline btn-sm ec-btn" data-id="' + cat.id + '">\u270F\uFE0F Edit</button><button class="btn btn-sm dc-btn" style="color:var(--danger)" data-id="' + cat.id + '" data-nm="' + PMS.esc(cat.name) + '">\uD83D\uDDD1\uFE0F</button></div></div>';
                }).join('') + '</div>';
                c.querySelectorAll('.ec-btn').forEach(function (b) { b.onclick = function () { var ct = cats.find(function (x) { return x.id === b.dataset.id; }); if (ct) openCatForm(ct); }; });
                c.querySelectorAll('.dc-btn').forEach(function (b) { b.onclick = function () { openDel(b.dataset.id, b.dataset.nm, 'category'); }; });
            });
        }

        function loadOrds(c) {
            c.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';
            PMS.getOrders().then(function (ords) {
                if (!ords.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCCB</div><h3>No orders yet</h3></div>'; return; }
                c.innerHTML = '<div class="order-list">' + ords.map(function (o) {
                    return '<div class="order-card"><div class="order-card-header"><div><span class="order-id">#' + o.id.substring(0, 8).toUpperCase() + '</span> <span class="order-date">' + PMS.formatDateTime(o.created_at) + '</span></div><div style="display:flex;gap:8px;align-items:center"><span class="order-status order-status-' + (o.status || 'new') + '">' + (o.status || 'new') + '</span><select class="form-select" style="padding:4px 8px;font-size:.78rem" data-oid="' + o.id + '"><option value="new"' + (o.status === 'new' ? ' selected' : '') + '>New</option><option value="processing"' + (o.status === 'processing' ? ' selected' : '') + '>Processing</option><option value="completed"' + (o.status === 'completed' ? ' selected' : '') + '>Completed</option></select></div></div><div class="order-card-body"><div class="order-customer"><strong>' + PMS.esc(o.customer_name || '') + '</strong>' + (o.customer_email ? ' \u00B7 ' + PMS.esc(o.customer_email) : '') + '</div><div class="order-items-list">' + (o.items || []).map(function (i) { return PMS.esc(i.name) + ' \u00D7 ' + i.qty + (i.price ? ' \u00B7 ' + PMS.formatPrice(i.price) : ''); }).join('<br>') + '</div>' + (o.total ? '<div style="margin-top:8px;font-weight:700">Total: ' + PMS.formatPrice(o.total) + '</div>' : '') + '</div></div>';
                }).join('') + '</div>';
                c.querySelectorAll('[data-oid]').forEach(function (s) { s.onchange = function () { PMS.updateOrderStatus(s.dataset.oid, s.value).then(function () { PMS.toast('Status updated.', 'success'); loadOrds(c); }); }; });
            });
        }

        loadTab();
    };

})(PMS);
