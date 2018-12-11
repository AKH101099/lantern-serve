"use strict";

const LC = window.LC || {}; if (!window.LC) window.LC = LC;

/**
* Leaflet Map Interface
*/
LC.leaflet_map = {
    zoomDelta: 1.4,
    wheelPxPerZoomLevel: 100,
    contextmenu: true,
    contextmenuWidth: 140,
    zoomControl: false,
    maxZoom: 18
};

/**
* MapTiles Service
*/
LC.maptiler = {
    id: "ade1b05a-496f-40d1-ae23-5d5aeca37da2",
    key: "ZokpyarACItmA6NqGNhr",
    map: "streets"
};


/**
* PouchDB Cache for MapTiles
*/
LC.leaflet_tiles = {
    attribution: false,
    dbName: "lx-tiles",
    minZoom: 3,
    maxZoom: 20,
    useCache:  true,
    useOnlyCache: false,
    cacheMaxAge: 365*24*3600*1000,
    crossOrigin: true
};

/**
* Locate Control for Leaflet
*/
LC.leaflet_locatecontrol = {
    returnToPreviousBounds: true,
    cacheLocation: true,
    showCompass: true,
    flyTo: false,
    showPopup: false,
    setView: "untilPanOrZoom",
    position: "bottomright"
}
