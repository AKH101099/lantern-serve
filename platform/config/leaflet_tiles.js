module.exports = {
    attribution: false,
    dbName: 'lx-tiles',
    minZoom: 3,
    useCache: window.localStorage.hasOwnProperty('lx-map-cache'),
    useOnlyCache: window.localStorage.hasOwnProperty('lx-map-cache-only'),
    cacheMaxAge: 365 * 24 * 3600 * 1000,
    crossOrigin: true,
    detectRetina: true
}
