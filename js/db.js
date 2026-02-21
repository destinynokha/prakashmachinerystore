// ===== Supabase Database =====
(function (PMS) {

    // ==================== PRODUCTS ====================
    PMS.addProduct = function (data) {
        data.created_at = new Date().toISOString();
        data.updated_at = new Date().toISOString();
        return PMS.sb.from('products').insert(data).select().single().then(function (res) {
            if (res.error) throw res.error;
            return res.data;
        });
    };

    PMS.updateProduct = function (id, data) {
        data.updated_at = new Date().toISOString();
        return PMS.sb.from('products').update(data).eq('id', id).then(function (res) {
            if (res.error) throw res.error;
        });
    };

    PMS.deleteProduct = function (id) {
        return PMS.sb.from('products').delete().eq('id', id).then(function (res) {
            if (res.error) throw res.error;
        });
    };

    PMS.getProduct = function (id) {
        return PMS.sb.from('products').select('*').eq('id', id).single().then(function (res) {
            if (res.error) return null;
            return res.data;
        });
    };

    PMS.getProducts = function (opts) {
        opts = opts || {};
        var q = PMS.sb.from('products').select('*');

        if (opts.category && opts.category !== 'All') q = q.eq('category', opts.category);

        if (opts.sortBy === 'price-low') q = q.order('price', { ascending: true, nullsFirst: false });
        else if (opts.sortBy === 'price-high') q = q.order('price', { ascending: false, nullsFirst: true });
        else if (opts.sortBy === 'name') q = q.order('name', { ascending: true });
        else q = q.order('created_at', { ascending: false });

        return q.then(function (res) {
            if (res.error) throw res.error;
            var list = res.data || [];
            if (opts.search) {
                var s = opts.search.toLowerCase();
                list = list.filter(function (p) {
                    return (p.name || '').toLowerCase().includes(s) ||
                        (p.description || '').toLowerCase().includes(s) ||
                        (p.brand || '').toLowerCase().includes(s) ||
                        (p.category || '').toLowerCase().includes(s);
                });
            }
            return list;
        });
    };

    PMS.getCategories = function () {
        return PMS.sb.from('products').select('category').then(function (res) {
            var cats = new Set(PMS.CATEGORIES);
            if (res.data) res.data.forEach(function (r) { if (r.category) cats.add(r.category); });
            return Array.from(cats).sort();
        });
    };

    // ==================== ORDERS ====================
    PMS.createOrder = function (data) {
        data.status = 'new';
        data.created_at = new Date().toISOString();
        return PMS.sb.from('orders').insert(data).select().single().then(function (res) {
            if (res.error) throw res.error;
            return res.data;
        });
    };

    PMS.getOrders = function () {
        return PMS.sb.from('orders').select('*').order('created_at', { ascending: false }).then(function (res) {
            if (res.error) throw res.error;
            return res.data || [];
        });
    };

    PMS.updateOrderStatus = function (id, status) {
        return PMS.sb.from('orders').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id).then(function (res) {
            if (res.error) throw res.error;
        });
    };

    // ==================== WISHLIST ====================
    PMS.addToWishlist = function (uid, pid) {
        return PMS.sb.from('wishlists').upsert({ user_id: uid, product_id: pid }, { onConflict: 'user_id,product_id' }).then(function (res) {
            if (res.error) throw res.error;
        });
    };

    PMS.removeFromWishlist = function (uid, pid) {
        return PMS.sb.from('wishlists').delete().eq('user_id', uid).eq('product_id', pid).then(function (res) {
            if (res.error) throw res.error;
        });
    };

    PMS.getWishlist = function (uid) {
        return PMS.sb.from('wishlists').select('product_id').eq('user_id', uid).then(function (res) {
            if (res.error) return [];
            return (res.data || []).map(function (r) { return r.product_id; });
        });
    };

    // ==================== SEED DATA ====================
    PMS.seedProducts = function () {
        var seeds = [
            { name: "INGCO Tools", description: "Complete range of INGCO power tools and hand tools. Premium quality for professional applications.", category: "INGCO Tools", brand: "INGCO", images: ["img/img1.png"], price: null, mrp: null, in_stock: true, specifications: {} },
            { name: "Welding Machines", description: "Professional welding equipment. Arc, MIG, TIG welders with accessories and consumables.", category: "Welding Machines", brand: "", images: ["img/img2.png"], price: null, mrp: null, in_stock: true, specifications: {} },
            { name: "Cutting Wheels", description: "High-quality cutting discs and grinding wheels for metal, stone, and concrete.", category: "Cutting Wheels", brand: "", images: ["img/img3.png"], price: null, mrp: null, in_stock: true, specifications: {} },
            { name: "Angle Grinders", description: "Powerful angle grinders for cutting, grinding, and polishing with safety features.", category: "Angle Grinders", brand: "", images: ["img/img4.png"], price: null, mrp: null, in_stock: true, specifications: {} },
            { name: "Power Tools", description: "Wide selection of drills, sanders, saws, and other professional-grade power tools.", category: "Power Tools", brand: "", images: ["img/img5.png"], price: null, mrp: null, in_stock: true, specifications: {} },
            { name: "Machinery Equipment", description: "Industrial machinery and equipment with technical support and spare parts.", category: "Machinery Equipment", brand: "", images: ["img/img6.png"], price: null, mrp: null, in_stock: true, specifications: {} }
        ];
        return PMS.sb.from('products').insert(seeds).then(function (res) {
            if (res.error) throw res.error;
            console.log('Seeded products.');
        });
    };

})(PMS);
