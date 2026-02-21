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

})(PMS);
