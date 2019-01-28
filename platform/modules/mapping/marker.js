const Geohash = require('latlon-geohash')
const LXItem = require('../data/item')

module.exports = class LXMarkerItem extends LXItem {
    constructor (db) {
    // now set defaults for key compression
        super(db, {
            'geohash': ['g'],
            'ping': ['p', []],
            'score': ['s']
        })

        this._icon = null
        this._set = null
        this.layer = null

        this.on('remove', () => {
            this.hide()
        })
        this.on('mode', (mode) => {
            if (this.layer) {
                // keep dom updated to reflect mode
                this.layer.setIcon(this.getDivIcon())
                // console.log(`${this.logPrefix} mode = `, mode);
            }
        })
    }

    // -------------------------------------------------------------------------
    /**
    * Defines geographic position on map
    *
    * Automatically create a new map layer if not already defined
    */
    set geohash (val) {
        if (val) {
            let startingVal = this._data.geohash

            try {
                if (val === startingVal) {
                    return
                }

                this._new.geohash = true
                this._data.geohash = val
                // console.log(`${this.logPrefix} location = ${this.geohash}`);

                if (this.layer) {
                    this.layer.setLatLng(this.latlng)
                }
                if (startingVal) {
                    this.emit('move', val)
                }
            } catch (e) {
                console.error(`${this.logPrefix} error with geohash`, e)
            }
        }
    }

    get latlng () {
        return Geohash.decode(this._data.geohash)
    }

    get geohash () {
        return this._data.geohash
    }

    // -------------------------------------------------------------------------
    get score () {
        if (this._data.score && isFinite(this._data.score)) {
            return Math.round(parseFloat(this._data.score) * 100) / 100
        }
        else {
            return 0.00
        }
    }

    set score (val) {
        if (val !== undefined) {
            try {
                // cast to number
                let number = val
                if (typeof (val) !== 'Number') {
                    number = Math.round(parseFloat(val) * 100) / 100
                }
                this._data.score = number
                this._new.score = true
            } catch (e) {
                // could not make a number out of this score. skip...
                console.error(`${this.logPrefix} error with score`, val)
            }
        }
    }

    // -------------------------------------------------------------------------
    /**
    * Get the identity of most recent ping
    */
    get ping () {
        return this._data.ping
    }

    /**
    * Ping should identify username of ping source
    */
    set ping (val) {
        if (val && typeof (val) === 'object' && val.toString() !== this._data.ping.toString()) {
            this._data.ping = val
            this._new.ping = true
        }
    }

    // -------------------------------------------------------------------------
    /**
    * Computes a marker title based on available categories
    */
    getCategory (categories) {
        let title = ''
        let cat = ''
        for (var idx in categories) {
            let item = categories[idx]
            for (var idy in item) {
                let tag = item[idy].tag
                if (this.tags.indexOf(tag) != -1) {
                    if (idx == 'main') {
                        cat = item[idy].label
                    } else {
                        title = item[idy].label
                        return title
                    }
                }
            }
        }
        return 'Unknown Category'
    }

    // -------------------------------------------------------------------------
    /**
    * Show on map
    */
    show () {
        if (this.layer !== null) {
            return
        } else if (!this.latlng) {
            console.error(`${this.logPrefix} cannot show marker with missing geolocation`)
            return
        }

        // console.log(`${this.logPrefix} showing marker`, this);

        let self = this
        this.layer = window.L.marker(this.latlng, {
            icon: this.getDivIcon(),
            draggable: false,
            autoPan: true
        })

        window.LT.atlas.addToMap(this)

        // console.log(`${this.logPrefix} Show`, this.layer);

        this.layer.on('dragend', function (e) {
            let latlng = e.target._latlng
            self.geohash = Geohash.encode(latlng.lat, latlng.lng)
        })
        this.emit('show', self)
    }

    /**
    * Hide from the map without altering stored data
    */
    hide () {
    // console.log(`${this.logPrefix} Hide`);
        if (this.layer && this.layer._map) {
            window.LT.atlas.removeFromMap(this)
            this.emit('hide', this)
        }
    }

    /**
    * Selects this marker for interaction
    */
    focus () {
        this.emit('focus', this)
    }

    // -------------------------------------------------------------------------
    getDivIcon () {
        let cls = 'fa'
        if (this._icon) {
            cls += ' fa-' + this._icon
        }
        return window.L.divIcon({
            html: `<i class="${cls}"></i>`,
            className: `lx-marker lx-marker-${this.mode} ${this.tags.join(' ')}`
        })
    }

    getIcon () {
        return this._icon
    }

    setIcon (value) {
        if (!this.layer) {
            console.error(`${this.logPrefix} marker must have layer before icon can be set`)
            return
        }

        if (value) {
            // console.log(`${this.logPrefix} icon = ${value}`);
        } else {
            // console.log(`${this.logPrefix} clearing icon`);
        }
        this._icon = value
        this.layer.setIcon(this.getDivIcon())
    }

    /**
    * Display custom icon based on marker class names
    */
    setIcons (map) {
        this.tags.forEach((tag) => {
            if (map.hasOwnProperty(tag)) {
                this.setIcon(map[tag])
            }
        })
    }
}
