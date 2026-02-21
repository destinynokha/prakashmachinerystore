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

    PMS.openWA = function (msg) {
        var url = PMS.waUrl(msg);
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
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
    var COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia", "Bosnia", "Botswana", "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Madagascar", "Malaysia", "Maldives", "Mali", "Malta", "Mauritius", "Mexico", "Moldova", "Mongolia", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

    PMS.getCustomerProfile = function () {
        try { return JSON.parse(localStorage.getItem('pms_profile') || 'null'); } catch (e) { return null; }
    };

    PMS.saveCustomerProfile = function (profile) {
        localStorage.setItem('pms_profile', JSON.stringify(profile));
    };

    PMS.hasCustomerProfile = function () {
        var p = PMS.getCustomerProfile();
        return p && p.firmName && p.phone && p.country;
    };

    // Show profile modal and call back when done
    PMS.ensureProfile = function (callback, itemContext) {
        if (PMS.hasCustomerProfile()) { callback(); return; }

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
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Country *</label><div class="country-search-wrap" style="position:relative"><input class="form-input" id="prof-country" required placeholder="Type to search..." autocomplete="off"><input type="hidden" id="prof-country-val"><div class="country-dropdown" id="country-dd" style="display:none;position:absolute;top:100%;left:0;right:0;max-height:180px;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:100"></div></div></div>' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Contact Number *</label><input class="form-input" id="prof-phone" required placeholder="e.g. 9876543210" type="tel"></div>' +
            '<div class="form-group" style="margin-bottom:12px"><label class="form-label">Address <span class="optional">(opt)</span></label><textarea class="form-textarea" id="prof-addr" placeholder="City, State" style="min-height:50px"></textarea></div>' +
            '<div class="form-actions"><button type="submit" class="btn btn-primary" style="width:100%">Save & Continue</button></div>' +
            '</form></div></div>';

        document.body.appendChild(div);

        // Country searchable dropdown
        var cInput = document.getElementById('prof-country');
        var cVal = document.getElementById('prof-country-val');
        var cDd = document.getElementById('country-dd');

        function renderCountries(filter) {
            var f = (filter || '').toLowerCase();
            var matches = f ? COUNTRIES.filter(function (c) { return c.toLowerCase().indexOf(f) !== -1; }) : COUNTRIES;
            if (!matches.length) { cDd.innerHTML = '<div style="padding:10px;color:var(--text-muted);font-size:0.85rem">No match</div>'; cDd.style.display = 'block'; return; }
            cDd.innerHTML = matches.map(function (c) {
                return '<div class="country-opt" data-c="' + PMS.esc(c) + '" style="padding:8px 14px;cursor:pointer;font-size:0.9rem;transition:background 0.1s">' + PMS.esc(c) + '</div>';
            }).join('');
            cDd.style.display = 'block';
            cDd.querySelectorAll('.country-opt').forEach(function (opt) {
                opt.onmouseenter = function () { opt.style.background = 'var(--primary-50)'; };
                opt.onmouseleave = function () { opt.style.background = ''; };
                opt.onclick = function () {
                    cInput.value = opt.dataset.c;
                    cVal.value = opt.dataset.c;
                    cDd.style.display = 'none';
                };
            });
        }

        cInput.onfocus = function () { renderCountries(cInput.value); };
        cInput.oninput = function () { cVal.value = ''; renderCountries(cInput.value); };
        document.addEventListener('click', function closeDD(e) {
            if (!e.target.closest('.country-search-wrap')) { cDd.style.display = 'none'; }
        });

        document.getElementById('prof-close').onclick = function () { div.remove(); };
        div.onclick = function (e) { if (e.target === div) div.remove(); };

        document.getElementById('prof-form').onsubmit = function (e) {
            e.preventDefault();
            var country = cVal.value || cInput.value.trim();
            // Validate country is in list
            var matched = COUNTRIES.find(function (c) { return c.toLowerCase() === country.toLowerCase(); });
            if (!matched) { PMS.toast('Please select a valid country.', 'warning'); cInput.focus(); return; }

            var profile = {
                name: document.getElementById('prof-name').value.trim(),
                firmName: document.getElementById('prof-firm').value.trim(),
                country: matched,
                phone: document.getElementById('prof-phone').value.trim(),
                address: document.getElementById('prof-addr').value.trim()
            };
            PMS.saveCustomerProfile(profile);

            if (PMS.createLead) {
                PMS.createLead({
                    user_id: PMS.currentUser ? PMS.currentUser.id : null,
                    name: profile.name,
                    firm_name: profile.firmName,
                    phone: profile.phone,
                    address: profile.address,
                    country: profile.country,
                    item_enquired: itemContext || 'Account Setup'
                }).catch(function (err) { console.error('Lead capture failed', err); });
            }

            div.remove();
            PMS.toast('Details saved!', 'success');
            callback();
        };
    };

    // Build WhatsApp message with sender profile + items
    PMS.buildWaMessage = function (title, items, total) {
        var p = PMS.getCustomerProfile() || {};
        var user = PMS.currentUser;
        var isInternational = p.country && p.country !== 'India';
        var msg = '*' + title + '*\n';
        if (isInternational) msg += '\n\uD83C\uDF0D *INTERNATIONAL — ' + p.country + '*\n';
        msg += '\n*Customer:* ' + (p.name || (user ? user.user_metadata.full_name : '') || 'N/A') + '\n';
        if (p.firmName) msg += '*Firm:* ' + p.firmName + '\n';
        msg += '*Phone:* ' + (p.phone || 'N/A') + '\n';
        if (user) msg += '*Email:* ' + user.email + '\n';
        var addr = p.address || '';
        if (!isInternational && p.country) addr = addr ? addr + ', ' + p.country : p.country;
        if (addr) msg += '*Address:* ' + addr + '\n';
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
    PMS.buildEmailMessage = function (title, items, total) {
        var p = PMS.getCustomerProfile() || {};
        var user = PMS.currentUser;
        var msg = title + '\n\n';
        msg += 'Customer: ' + (p.name || (user ? user.user_metadata.full_name : '') || 'N/A') + '\n';
        if (p.firmName) msg += 'Firm: ' + p.firmName + '\n';
        if (p.country) msg += 'Country: ' + p.country + '\n';
        msg += 'Phone: ' + (p.phone || 'N/A') + '\n';
        if (user) msg += 'Email: ' + user.email + '\n';
        var addr = p.address || '';
        if (addr) msg += 'Address: ' + addr + '\n';
        msg += '\nItems:\n';
        items.forEach(function (i, idx) {
            msg += (idx + 1) + '. ' + i.name;
            if (i.qty && i.qty > 1) msg += ' \u00D7 ' + i.qty;
            if (i.price) msg += ' \u2014 ' + PMS.formatPrice(i.price * (i.qty || 1));
            msg += '\n';
        });
        if (total && total > 0) msg += '\nTotal: ' + PMS.formatPrice(total);
        msg += '\n\nPlease confirm. Thank you!';
        return 'mailto:' + PMS.STORE.ordersEmail + '?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(msg);
    };

    PMS.chooseSendMethod = function (callback) {
        var existing = document.getElementById('method-modal');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.id = 'method-modal';
        div.className = 'modal-overlay open';
        div.innerHTML =
            '<div class="modal-box" style="max-width:400px;text-align:center"><div class="modal-box-header"><h3>\uD83D\uDCE4 Send Via</h3><button class="modal-close" id="meth-close">\u2715</button></div>' +
            '<div class="modal-box-body"><p style="color:var(--text-secondary);margin-bottom:24px">How would you like to send this to the store?</p>' +
            '<div style="display:flex;gap:16px;flex-direction:column">' +
            '<button class="btn btn-whatsapp btn-lg" id="btn-wa">\uD83D\uDCAC WhatsApp</button>' +
            '<button class="btn btn-outline btn-lg" id="btn-email">\u2709\uFE0F Email</button>' +
            '</div></div></div>';

        document.body.appendChild(div);

        document.getElementById('meth-close').onclick = function () { div.remove(); };
        div.onclick = function (e) { if (e.target === div) div.remove(); };

        document.getElementById('btn-wa').onclick = function () { div.remove(); callback('wa'); };
        document.getElementById('btn-email').onclick = function () { div.remove(); callback('email'); };
    };

})(PMS);
