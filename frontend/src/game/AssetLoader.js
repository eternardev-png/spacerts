export class AssetLoader {
    constructor() {
        this.assets = {};
    }

    loadAssets(assetList) {
        const promises = Object.entries(assetList).map(([key, url]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    this.assets[key] = img;
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error("Failed to load asset:", url, e);
                    // Resolve anyway to avoid blocking everything (checking logic needed)
                    resolve(null);
                };
            });
        });
        return Promise.all(promises);
    }

    get(key) {
        return this.assets[key];
    }
}
