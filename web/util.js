"use strict"

/**
* Lantern Utilities
*
*/


const path = require("path");
const fs = require("fs-extra");
const self = {};



//----------------------------------------------------------------------
fs.ensureDirSync(path.resolve(__dirname, "logs"));



//----------------------------------------------------------------------
/**
* Custom build of PouchDB Server to meet our SQLite requirements
* Also removes extras we do not need that are in full "pouchdb" library
*/
self.PouchDB = require('pouchdb-core')
    .plugin(require('pouchdb-adapter-node-websql'))
    .plugin(require('pouchdb-adapter-http'))
    .plugin(require('pouchdb-mapreduce'))
    .plugin(require('pouchdb-replication'))

/**
* Log facility
*/
self.Logger = require("simple-node-logger").createSimpleLogger({
    logFilePath: path.resolve(__dirname, 'logs', 'http.log'),
    dateFormat:'YYYY.MM.DD'
});


/**
* Get HTTP Non-Secure Port
*/
self.getHttpPort = () => {
    return (process.env.TERM_PROGRAM ? 9090 : 80);
}

/**
* Get HTTPS Secure Port
*/
self.getHttpsPort = () => {
    return (process.env.TERM_PROGRAM ? 9443 : 443);
}

/**
* Get HTTP Non-Secure Localhost URL
*/
self.getHttpAddress = () => {
    return "http://localhost:"+self.getHttpPort();
}

/**
* Get HTTPS Secure Localhost URL
*/
self.getHttpsAddress = () => {
    return "http://localhost:"+self.getHttpsPort();
}

/**
* Check for internet access
*/
self.checkInternet = () =>{
    return new Promise((resolve, reject) => {
        require('dns').lookup('google.com',(err) => {
            if (err && err.code == "ENOTFOUND") {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
* Extract IP address from request object
*/
self.getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

/**
* Check if this is a remote client requesting a resource
*/
self.isRemoteClient = (req) => {
    let ip = self.getClientIP(req);
    return ip && (ip.indexOf("127.0.0.1") === -1);
}


//----------------------------------------------------------------------
/**
* Make sure we are always working with a valid short unique device identifier
*/
self.getDeviceIdentifier = () => {
    let db_config_path = path.join(__dirname,  "db", "db-conf.json");
    let obj = JSON.parse(fs.readFileSync(db_config_path, "utf8"));
    return obj.couchdb.uuid;
}


/**
* Ensures device is registered on the file system and in-database
*/
self.registerDevice = (status) => {

    // get or create unique device identifier first
    let id = self.getDeviceIdentifier();


    // identify device type
    let tag = [];
    if (process.env.CLOUD == "true") {
        tag.push("cloud");
    }
    else if(process.env.DEV == "true") {
        tag.push("dev");
    }

    // file system up-to-date, now save database document
    let doc = {
        "_id": "d:"+id,
        "tt": id.substr(0,3).toUpperCase(),
        "st": (status ?  1 : 0),
        "gp": [],
        "tg": tag
    }

     return self.CoreDatabase.get(doc._id).then((existing_doc) => {
        self.Logger.debug("device already registered: " + doc._id);
        self.Logger.debug("device name is: " + existing_doc.tt);

     }).catch((err) => {
        if (err.error == "not_found") {
            self.Logger.debug("registering device in database: " + doc._id);
            self.Logger.debug("device name is: " + doc.tt);
            return self.CoreDatabase.put(doc);
        }
        else {
            self.Logger.error(err);
        }
    });
}

/**
* Save device name to database and network
*/
self.saveDeviceName = (name) => {
    let id = self.getDeviceIdentifier();
    return self.CoreDatabase.get("d:"+ id)
        .then((doc) => {
            if (name == doc.tt) {
                return true;
            }
            else {
                doc.tt = name;
                return self.CoreDatabase.post(doc);
            }
        });
}

self.getDeviceName = () => {
    let id = self.getDeviceIdentifier();
    return self.CoreDatabase.get("d:"+ id)
        .then((doc) => {
            return doc.tt || doc._id.replace("d:", "");
        });
}

/**
* Save device geolocation to database and network
*/
self.saveDeviceLocation = (geo) => {
    let id = self.getDeviceIdentifier();
    return self.CoreDatabase.get("d:"+ id)
        .then((doc) => {
            if (doc.gp[doc.gp.length-1] == geo) {
                return true;
            }
            else {
                doc.gp.push(geo);
            }
            return self.CoreDatabase.post(doc);
        });
}



//----------------------------------------------------------------------  
/**
* Primary database for supplies, status, etc.
*/
self.CoreDatabase = self.PouchDB(self.getHttpAddress() + "/db/lnt");


/**
* Reference database to replicate from for network / community aggregated data
*/
self.CoreDatabaseSeed = self.PouchDB(process.env.CORE_DB_SEED || "https://37bd9e99-2780-4965-8da8-b6b1ebb682bc-bluemix.cloudant.com/lantern-us-demo");


/**
* Map specific database for tiles
*/
self.MapDatabase = self.PouchDB(self.getHttpAddress() + "/db/map");


/**
* Reference database to replicate from for maps
*/
self.MapDatabaseSeed = self.PouchDB(process.env.MAP_DB_SEED || "https://37bd9e99-2780-4965-8da8-b6b1ebb682bc-bluemix.cloudant.com/lantern-us-maps");



//----------------------------------------------------------------------  
/**
* Display memory usage over time
*/
self.watchMemory = () => {
      setInterval(() =>{
        log.debug("---");
        let arr = [1, 2, 3, 4, 5, 6, 9, 7, 8, 9, 10];
        arr.reverse();
        let used = process.memoryUsage();
        for (const key in used) {
          log.debug(key + " "  + Math.round(used[key] / 1024 / 1024 * 100) / 100 + " MB");
        }
        log.debug("---");
    }, 45000);
}
  

module.exports = self;