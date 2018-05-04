const express = require('express');
const request = require('request');
const router = express.Router();
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const time = () => Math.floor(new Date() / 1000)
const BASE_URL = "https://api.ubports.com/v1/"

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
      url: BASE_URL+"devices",
      json: true,
      headers: {
        'User-Agent': 'client request: server devices.ubuntu-touch.io'
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
      url: BASE_URL+"devices/"+device,
      json: true,
      headers: {
        'User-Agent': 'client request: server devices.ubuntu-touch.io'
      }
    }, (err, res, body) => {

      // Device not found, send reject!
      if(res.statusCode === 404)
        return reject();

      // If we hit an error, try using cache!
      if (err)
        return resolve(cache[device].data);

      if (body.about)
        body.about = md.render(body.about);

      resolve(body);

      // 3 munutes cache!
      cache[device].expire = time()+180;
      cache[device].data = body;
    });
  });
}

function notFound(res) {
  res.status(404);
  res.render('error', {
    message: "Device not found",
    error: {status: 404}
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('devices')
});

router.get('/apps', function(req, res, next) {
  res.redirect("https://open-store.io");
});

router.get('/features', function(req, res, next) {
  res.redirect("https://ubuntu-touch.io/features"); // TODO confirm URL
})

router.get('/install', function(req, res, next) {
  res.redirect("https://ubuntu-touch.io/install"); // TODO confirm URL
})

router.get('/convergence', function(req, res, next) {
  res.redirect("https://ubuntu-touch.io/features"); // TODO confirm URL
})

router.get('/design', function(req, res, next) {
  res.redirect("https://ubuntu-touch.io/design"); // TODO confirm URL
})

router.get('/privacy', function(req, res, next) {
  res.redirect("https://ubuntu-touch.io/features"); // TODO confirm URL
})

router.get('/devices', function(req, res, next) {
  res.redirect('/');
})

router.get('/api/devices', function(req, res, next) {
  getDevices().then(r => res.send(r));
})

router.get('/api/device/:device', function(req, res, next) {
  getDevice(req.params.device).then(r => res.send(r)).catch(() => res.send(404));
})

router.get('/device/:device', function(req, res, next) {
  getDevice(req.params.device).then(r => res.render('device', { data: r })).catch(() => notFound(res));
})

router.get('/telegram', function(req, res, next) {
  res.redirect("https://telegram.me/ubports");
});

module.exports = router;
