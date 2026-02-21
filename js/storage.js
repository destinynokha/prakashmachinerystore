// ===== Supabase Storage =====
(function (PMS) {

    PMS.uploadImage = function (file, productId) {
        return PMS.compressImage(file).then(function (blob) {
            var path = 'products/' + productId + '/' + Date.now() + '.jpg';
            return PMS.sb.storage.from('product-images').upload(path, blob, {
                contentType: 'image/jpeg',
                upsert: false
            }).then(function (res) {
                if (res.error) throw res.error;
                var urlRes = PMS.sb.storage.from('product-images').getPublicUrl(path);
                return urlRes.data.publicUrl;
            });
        });
    };

    PMS.uploadImages = function (files, productId) {
        var urls = [];
        var p = Promise.resolve();
        Array.from(files).forEach(function (f) {
            p = p.then(function () {
                return PMS.uploadImage(f, productId).then(function (url) { urls.push(url); });
            });
        });
        return p.then(function () { return urls; });
    };

})(PMS);
