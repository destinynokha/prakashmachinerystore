// ===== App Router & Initialization (Supabase) =====
(function (PMS) {

    PMS.go = function (page, params) {
        params = params || {};
        var el = document.getElementById('app-content');
        if (!el) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        var qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        history.pushState({ page: page, params: params }, '', '#' + page + qs);

        render(el, page, params);
    };

    function render(el, page, params) {
        switch (page) {
            case 'store': PMS.renderStore(el); break;
            case 'product': PMS.renderProduct(el, params); break;
            case 'cart': PMS.renderCart(el); break;
            case 'wishlist': PMS.renderWishlist(el); break;
            case 'pay': PMS.renderPay(el); break;
            case 'admin': PMS.renderAdmin(el); break;
            default: PMS.renderHome(el);
        }
    }

    window.addEventListener('popstate', function (e) {
        var el = document.getElementById('app-content');
        if (e.state) render(el, e.state.page, e.state.params);
        else render(el, 'home', {});
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Initialize Supabase client
        PMS.sb = supabase.createClient(PMS.supabaseUrl, PMS.supabaseKey);

        // Initialize auth
        PMS.initAuth();

        // Navbar bindings
        var logo = document.getElementById('navbar-logo');
        if (logo) logo.onclick = function (e) { e.preventDefault(); PMS.go('home'); };

        var loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = function () { PMS.signIn(); };

        var avatarBtn = document.getElementById('user-avatar-btn');
        var userMenu = document.getElementById('user-menu');
        if (avatarBtn && userMenu) {
            avatarBtn.onclick = function (e) { e.stopPropagation(); userMenu.classList.toggle('open'); };
            document.addEventListener('click', function () { userMenu.classList.remove('open'); });
        }

        var signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) signOutBtn.onclick = function () { PMS.signOut(); PMS.go('home'); };

        var cartLink = document.getElementById('cart-link');
        if (cartLink) cartLink.onclick = function (e) { e.preventDefault(); PMS.go('cart'); };

        var adminLink = document.getElementById('admin-link');
        if (adminLink) adminLink.onclick = function (e) { e.preventDefault(); PMS.go('admin'); };

        var homeLink = document.getElementById('home-link');
        if (homeLink) homeLink.onclick = function (e) { e.preventDefault(); PMS.go('home'); };

        var storeLink = document.getElementById('store-link');
        if (storeLink) storeLink.onclick = function (e) { e.preventDefault(); PMS.go('store'); };

        var wishLink = document.getElementById('wish-link');
        if (wishLink) wishLink.onclick = function (e) { e.preventDefault(); PMS.go('wishlist'); };

        var payLink = document.getElementById('pay-link');
        if (payLink) payLink.onclick = function (e) { e.preventDefault(); PMS.go('pay'); };

        var searchToggle = document.getElementById('mobile-search-toggle');
        var searchBar = document.querySelector('.navbar-search');
        if (searchToggle && searchBar) {
            searchToggle.onclick = function () { searchBar.classList.toggle('open'); if (searchBar.classList.contains('open')) searchBar.querySelector('input').focus(); };
        }

        PMS.updateCartBadge();
        PMS.onAuth(function () { PMS.updateCartBadge(); });

        // Parse initial hash
        var hash = location.hash.replace('#', '');
        if (hash) {
            var parts = hash.split('?'), page = parts[0], params = {};
            if (parts[1]) new URLSearchParams(parts[1]).forEach(function (v, k) { params[k] = v; });
            PMS.go(page || 'home', params);
        } else {
            PMS.go('home');
        }
    });

})(PMS);
