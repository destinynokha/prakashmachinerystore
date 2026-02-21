// ===== Cart (localStorage) =====
(function (PMS) {
    var KEY = 'pms_cart';

    PMS.getCart = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    function save(c) { localStorage.setItem(KEY, JSON.stringify(c)); PMS.updateCartBadge(); }

    PMS.addToCartItem = function (product, qty) {
        qty = qty || 1;
        if (!PMS.isLoggedIn()) { PMS.toast('Please sign in to add items.', 'warning'); return false; }
        var cart = PMS.getCart();
        var ex = cart.find(function (i) { return i.productId === product.id; });
        if (ex) { ex.qty += qty; }
        else { cart.push({ productId: product.id, name: product.name, price: product.price || null, image: (product.images && product.images[0]) || '', category: product.category || '', qty: qty }); }
        save(cart);
        PMS.toast(product.name + ' added to cart!', 'success');
        return true;
    };

    PMS.removeFromCart = function (pid) { save(PMS.getCart().filter(function (i) { return i.productId !== pid; })); };
    PMS.updateCartQty = function (pid, qty) {
        if (qty <= 0) { PMS.removeFromCart(pid); return; }
        var c = PMS.getCart(); var it = c.find(function (i) { return i.productId === pid; });
        if (it) { it.qty = qty; save(c); }
    };
    PMS.clearCart = function () { localStorage.removeItem(KEY); PMS.updateCartBadge(); };
    PMS.cartCount = function () { return PMS.getCart().reduce(function (s, i) { return s + i.qty; }, 0); };
    PMS.cartTotal = function () { return PMS.getCart().reduce(function (s, i) { return s + ((i.price || 0) * i.qty); }, 0); };
    PMS.hasUnpriced = function () { return PMS.getCart().some(function (i) { return !i.price; }); };
    PMS.updateCartBadge = function () {
        var b = document.getElementById('cart-badge');
        var n = PMS.cartCount();
        if (b) { b.textContent = n; b.style.display = n > 0 ? 'flex' : 'none'; }
    };
})(PMS);
