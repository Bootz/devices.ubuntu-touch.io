const express = require('express');
const request = require('request');
const router = express.Router();

const time = () => Math.floor(new Date() / 1000)

var cache = {
  devices: {expire:0}
}

// Internal
const getDevices = () => {
  return new Promise(function(resolve, reject) {
    console.log("devices request");
    var now=time();

    // Cache baby cache!!! :D :D
    if (cache.devices.expire > now) {
      console.log("use cache");
      resolve(cache.devices.data);
      return;
    }

    console.log("get new");
    request({
      method: "get",
      url: "https://devices.ubports.com/api/devices",
      json: true,
      headers: {
        'User-Agent': 'client request: server ubuntu-touch.io'
      }
    }, (err, res, body) => {
      // If we hit an error, try using cache!
      if (err)
        resolve(cache.devices.data)
      resolve(body);
      // 3 munutes cache!
      cache.devices.expire = time()+180;
      cache.devices.data = body;
    });
  });
}

const getDevice = (device) => {
  return new Promise(function(resolve, reject) {
    console.log("devices request");
    var now=time();

    if (!cache[device])
      cache[device] = {expire:0};

    // Cache baby cache!!! :D :D
    if (cache[device].expire > now) {
      console.log("use cache")
      resolve(cache[device].data);
      return;
    }

    console.log("get new");
    request({
      method: "get",
      url: "https://devices.ubports.com/api/device/"+device,
      json: true,
      headers: {
        'User-Agent': 'client request: server ubuntu-touch.io'
      }
    }, (err, res, body) => {
      // If we hit an error, try using cache!
      if (err) {
        if(res.statusCode === 404)
          reject();
        else
          resolve(cache[device].data)
        return;
      }
      resolve(body);
      // 3 munutes cache!
      cache[device].expire = time()+180;
      cache[device].data = body;
    });
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/apps', function(req, res, next) {
  res.render('apps');
});

router.get('/features', function(req, res, next) {
  res.render('features')
})

router.get('/install', function(req, res, next) {
  res.render('install')
})

router.get('/convergence', function(req, res, next) {
  res.render('convergence')
})

router.get('/design', function(req, res, next) {
  res.render('design')
})

router.get('/privacy', function(req, res, next) {
  res.render('privacy')
})

router.get('/devices', function(req, res, next) {
  res.render('devices')
})

router.get('/api/devices', function(req, res, next) {
  getDevices().then(r => res.send(r));
})

router.get('/api/device/:device', function(req, res, next) {
  getDevice(req.params.device).then(r => res.send(r)).catch(() => res.send(404));
})

router.get('/device/:device', function(req, res, next) {
  getDevice(req.params.device).then(r => res.render('device', { data: r })).catch(() => res.send(404));
})

router.get('/telegram', function(req, res, next) {
  res.redirect("https://telegram.me/ubports");
});

module.exports = router;
