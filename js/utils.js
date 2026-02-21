// ===== Utilities =====
(function (PMS) {

    PMS.formatPrice = function (p) {
        if (p == null || p === '' || p === 0) return null;
        return '\u20B9' + Number(p).toLocaleString('en-IN');
    };

    PMS.formatDate = function (ts) {
        if (!ts) return '';
        var d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    PMS.formatDateTime = function (ts) {
        if (!ts) return '';
        var d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    PMS.calcDiscount = function (price, mrp) {
        if (!price || !mrp || mrp <= price) return 0;
        return Math.round(((mrp - price) / mrp) * 100);
    };

    PMS.esc = function (s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    };

    PMS.debounce = function (fn, ms) {
        var t; ms = ms || 300;
        return function () {
            var a = arguments, c = this;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(c, a); }, ms);
        };
    };

    PMS.toast = function (msg, type, dur) {
        type = type || 'success'; dur = dur || 3000;
        var c = document.getElementById('toast-container');
        if (!c) return;
        var icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
        var el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span class="toast-msg">' + PMS.esc(msg) + '</span><button class="toast-close" onclick="this.closest(\'.toast\').remove()">\u2715</button>';
        c.appendChild(el);
        setTimeout(function () { el.classList.add('removing'); setTimeout(function () { el.remove(); }, 200); }, dur);
    };

    PMS.waUrl = function (msg) {
        return 'https://wa.me/' + PMS.STORE.whatsapp + '?text=' + encodeURIComponent(msg);
    };

    PMS.compressImage = function (file, maxW, quality) {
        maxW = maxW || 1200; quality = quality || 0.8;
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var canvas = document.createElement('canvas');
                    var w = img.width, h = img.height;
                    if (w > maxW) { h = (h * maxW) / w; w = maxW; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(function (blob) { resolve(blob); }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    PMS.skeletons = function (el, n) {
        n = n || 6;
        var h = '<div class="product-grid">';
        for (var i = 0; i < n; i++) h += '<div class="product-card skeleton-card"><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>';
        h += '</div>';
        el.innerHTML = h;
    };

    // ==================== CUSTOMER PROFILE ====================
    PMS.getCustomerProfile = function () {
        try { return JSON.parse(localStorage.getItem('pms_profile') || 'null'); } catch (e) { return null; }
    };

    PMS.saveCustomerProfile = function (profile) {
        localStorage.setItem('pms_profile', JSON.stringify(profile));
    };

    PMS.hasCustomerProfile = function () {
        var p = PMS.getCustomerProfile();
        return p && p.firmName && p.phone;
    };

    // Show profile modal and call back when done
    PMS.ensureProfile = function (callback) {
        if (PMS.hasCustomerProfile()) { callback(); return; }

        // Build modal
        var existing = document.getElementById('profile-modal');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.id = 'profile-modal';
        div.className = 'modal-overlay open';
        div.innerHTML =
            '<div class="modal-box" style="max-width:480px"><div class="modal-box-header"><h3>\uD83D\uDC64 Your Details</h3><button class="modal-close" id="prof-close">\u2715</button></div><div class="modal-box-body">' +
            '<p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.9rem">Please provide your details for orders and enquiries.</p>' +
            '<form id="prof-form">' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Your Name</label><input class="form-input" id="prof-name" value="' + PMS.esc(PMS.currentUser ? (PMS.currentUser.user_metadata.full_name || '') : '') + '" required placeholder="Your name"></div>' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Firm / Shop Name *</label><input class="form-input" id="prof-firm" required placeholder="e.g. ABC Hardware Store"></div>' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Contact Number *</label><input class="form-input" id="prof-phone" required placeholder="e.g. 9876543210" type="tel"></div>' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Address <span class="optional">(opt)</span></label><textarea class="form-textarea" id="prof-addr" placeholder="City, State" style="min-height:50px"></textarea></div>' +
            '<div class="form-actions"><button type="submit" class="btn btn-primary" style="width:100%">Save & Continue</button></div>' +
            '</form></div></div>';

        document.body.appendChild(div);

        document.getElementById('prof-close').onclick = function () { div.remove(); };
        div.onclick = function (e) { if (e.target === div) div.remove(); };

        document.getElementById('prof-form').onsubmit = function (e) {
            e.preventDefault();
            var profile = {
                name: document.getElementById('prof-name').value.trim(),
                firmName: document.getElementById('prof-firm').value.trim(),
                phone: document.getElementById('prof-phone').value.trim(),
                address: document.getElementById('prof-addr').value.trim()
            };
            PMS.saveCustomerProfile(profile);
            div.remove();
            PMS.toast('Details saved!', 'success');
            callback();
        };
    };

    // Build WhatsApp message with sender profile + items
    PMS.buildWaMessage = function (title, items, total) {
        var p = PMS.getCustomerProfile() || {};
        var user = PMS.currentUser;
        var msg = '*' + title + '*\n\n';
        msg += '*Customer:* ' + (p.name || (user ? user.user_metadata.full_name : '') || 'N/A') + '\n';
        if (p.firmName) msg += '*Firm:* ' + p.firmName + '\n';
        msg += '*Phone:* ' + (p.phone || 'N/A') + '\n';
        if (user) msg += '*Email:* ' + user.email + '\n';
        if (p.address) msg += '*Address:* ' + p.address + '\n';
        msg += '\n*Items:*\n';
        items.forEach(function (i, idx) {
            msg += (idx + 1) + '. ' + i.name;
            if (i.qty && i.qty > 1) msg += ' \u00D7 ' + i.qty;
            if (i.price) msg += ' \u2014 ' + PMS.formatPrice(i.price * (i.qty || 1));
            msg += '\n';
        });
        if (total && total > 0) msg += '\n*Total:* ' + PMS.formatPrice(total);
        msg += '\n\nPlease confirm. Thank you! \uD83D\uDE4F';
        return msg;
    };

})(PMS);
