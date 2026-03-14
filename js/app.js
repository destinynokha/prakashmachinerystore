// ===== App Router & Initialization (Supabase) =====
(function (PMS) {

    PMS.go = function (page, params) {
        params = params || {};
        var el = document.getElementById('app-content');
        if (!el) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        var qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        history.pushState({ page: page, params: params }, '', '#' + page + qs);
        updateActiveLinks(page);
        render(el, page, params);
    };

    function updateActiveLinks(page) {
        // Desktop/Mobile Drawer
        ['home', 'store', 'pay', 'wish', 'cart', 'admin'].forEach(function (p) {
            var l = document.getElementById(p + '-link'), ml = document.getElementById('m-' + p + '-link'), bl = document.getElementById('b-' + p);
            if (l) l.classList[page === p ? 'add' : 'remove']('active');
            if (ml) ml.classList[page === p ? 'add' : 'remove']('active');
            if (bl) bl.classList[page === (p === 'wish' ? 'wishlist' : p) ? 'add' : 'remove']('active');
        });
        // Bottom nav specific
        ['home', 'store', 'pay', 'cart'].forEach(function (p) {
            var bl = document.getElementById('b-' + p);
            if (bl) bl.classList[page === p ? 'add' : 'remove']('active');
        });
    }

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

        // --- Mobile Drawer Logic ---
        var mToggle = document.getElementById('mobile-menu-toggle');
        var mDrawer = document.getElementById('mobile-drawer');
        var mClose = document.getElementById('mobile-drawer-close');

        function closeDrawer() { if (mDrawer) mDrawer.classList.remove('open'); }
        if (mToggle && mDrawer) mToggle.onclick = function () { mDrawer.classList.add('open'); };
        if (mClose) mClose.onclick = closeDrawer;
        if (mDrawer) mDrawer.onclick = function (e) { if (e.target === mDrawer) closeDrawer(); };

        ['home', 'store', 'pay', 'wish', 'cart', 'admin'].forEach(function (k) {
            var el = document.getElementById('m-' + k + '-link');
            if (el) el.onclick = function (e) { e.preventDefault(); closeDrawer(); PMS.go(k === 'wish' ? 'wishlist' : k); };
        });

        var mLoginBtn = document.getElementById('m-login-btn');
        if (mLoginBtn) mLoginBtn.onclick = function () { closeDrawer(); PMS.signIn(); };

        var mSignOutBtn = document.getElementById('m-signout-btn');
        if (mSignOutBtn) mSignOutBtn.onclick = function () { closeDrawer(); PMS.signOut(); PMS.go('home'); };

        var mOrdersBtn = document.getElementById('m-orders-btn');
        if (mOrdersBtn) mOrdersBtn.onclick = function () { closeDrawer(); PMS.toast('Orders page coming soon!', 'info'); };

        // Bottom Nav Bindings
        ['home', 'store', 'cart', 'pay'].forEach(function (k) {
            var el = document.getElementById('b-' + k);
            if (el) el.onclick = function (e) { e.preventDefault(); PMS.go(k); };
        });
        // ---------------------------

        PMS.updateCartBadge();
        PMS.onAuth(function (user) {
            PMS.updateCartBadge();

            // Update Mobile Drawer Auth UI
            var mLogin = document.getElementById('m-login-btn');
            var mUserSec = document.getElementById('m-user-section');
            var mWish = document.getElementById('m-wish-link');
            var mCart = document.getElementById('m-cart-link');
            var mAdmin = document.getElementById('m-admin-link');

            if (user) {
                if (mLogin) mLogin.classList.add('hidden');
                if (mUserSec) mUserSec.classList.remove('hidden');
                if (mWish) mWish.classList.remove('hidden');
                if (mCart) mCart.classList.remove('hidden');
                document.getElementById('m-user-name').textContent = user.user_metadata.full_name || 'User';
                document.getElementById('m-user-email').textContent = user.email;
                document.getElementById('m-user-avatar').src = user.user_metadata.avatar_url || 'https://ui-avatars.com/api/?name=' + user.email;
                if (mAdmin && PMS.isOwner()) mAdmin.classList.remove('hidden');
            } else {
                if (mLogin) mLogin.classList.remove('hidden');
                if (mUserSec) mUserSec.classList.add('hidden');
                if (mWish) mWish.classList.add('hidden');
                if (mCart) mCart.classList.add('hidden');
                if (mAdmin) mAdmin.classList.add('hidden');
            }
        });

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
