// ===== Authentication (Supabase) =====
(function (PMS) {

    PMS.currentUser = null;
    var callbacks = [];

    PMS.initAuth = function () {
        // Check initial session
        PMS.sb.auth.getSession().then(function (res) {
            var session = res.data.session;
            setUser(session ? session.user : null);
        });

        // Listen for auth changes
        PMS.sb.auth.onAuthStateChange(function (event, session) {
            setUser(session ? session.user : null);
        });
    };

    function setUser(user) {
        PMS.currentUser = user;
        callbacks.forEach(function (cb) { cb(user); });
        updateUI(user);
    }

    PMS.onAuth = function (cb) { callbacks.push(cb); };

    PMS.signIn = function () {
        PMS.sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        }).then(function (res) {
            if (res.error) PMS.toast('Sign in failed.', 'error');
        });
    };

    PMS.signOut = function () {
        PMS.sb.auth.signOut().then(function () {
            PMS.toast('Signed out.', 'info');
        });
    };

    PMS.isOwner = function () {
        return PMS.currentUser && PMS.currentUser.email === PMS.OWNER_EMAIL;
    };

    PMS.isLoggedIn = function () { return PMS.currentUser !== null; };

    function updateUI(user) {
        var loginBtn = document.getElementById('login-btn');
        var userBox = document.getElementById('user-menu-container');
        var adminLink = document.getElementById('admin-link');
        var cartLink = document.getElementById('cart-link');
        var homeLink = document.getElementById('home-link');
        var wishLink = document.getElementById('wish-link');

        if (user) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userBox) {
                userBox.classList.remove('hidden');
                var avatar = userBox.querySelector('.user-avatar');
                if (avatar) avatar.src = user.user_metadata.avatar_url || '';
                var name = userBox.querySelector('.name');
                if (name) name.textContent = user.user_metadata.full_name || 'User';
                var email = userBox.querySelector('.email');
                if (email) email.textContent = user.email;
            }
            if (adminLink) adminLink.classList[PMS.isOwner() ? 'remove' : 'add']('hidden');
            if (cartLink) cartLink.classList.remove('hidden');
            if (homeLink) homeLink.classList.remove('hidden');
            if (wishLink) wishLink.classList.remove('hidden');
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userBox) userBox.classList.add('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            if (cartLink) cartLink.classList.add('hidden');
            if (wishLink) wishLink.classList.add('hidden');
        }
    }

})(PMS);
