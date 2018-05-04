/**
 * Module dependencies.
 */
const debug = require('debug')('ubports_main_:server');
const cluster = require("cluster");

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening(server) {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Serving magic on ' + bind);
}

// Run
function run(callback) {
  if (process.env.NODE_ENV !== 'production') {
    console.log("WARNING: we are running in debug mode!");
  }

  if(cluster.isMaster && !module.parent.parent) {
      var numWorkers = process.env.CPUS || require('os').cpus().length;

      console.log('Master cluster setting up ' + numWorkers + ' workers...');

      for(var i = 0; i < numWorkers; i++) {
          cluster.fork();
      }

      cluster.on('online', function(worker) {
          console.log('Worker ' + worker.process.pid + ' is online');
          if (callback) callback();
      });

      cluster.on('exit', function(worker, code, signal) {
          console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
          if (process.env.NODE_ENV !== 'production') {
            console.log("Not running in production mode, will not spawn new worker");
          } else {
            console.log('Starting a new worker');
            cluster.fork();
          }
      });

      process.on("SIGUSR2", function() {
          console.log("SIGUSR2 received, reloading workers");

          //delete require.cache[require.resolve("./app")];

          // only reload one worker at a time
          // otherwise, we'll have a time when no request handlers are running
          var i = 0;
          var workers = Object.keys(cluster.workers);
          var f = function() {
              if (i == workers.length) return;

              console.log("Killing " + workers[i]);

              cluster.workers[workers[i]].disconnect();
              cluster.workers[workers[i]].on("disconnect", function() {
                  console.log("Shutdown complete");
              });
              var newWorker = cluster.fork();
              newWorker.on("online", function() {
                  console.log("Replacement worker online.");
                  i++;
                  f();
              });
              newWorker.on("error", function() {
                console.log("We got an error, keeping the current workers alive!");
              });
          }
          f();
      });

  } else {
      const app = require('./app');
      const http = require('http');

      // Get port from environment and store in Express.
      var port = normalizePort(process.env.PORT || '2708');
      app.set('port', port);

      // Create HTTP server.
      var server = http.createServer(app);

      // Listen on provided port, on all network interfaces.
      server.listen(port);
      server.on('error', onError);
      server.on('listening', () => {
        if (callback) callback();
        onListening(server);
      });
      server.on('close', () => console.log("Good bye, hope to see you again soon :)"))

      return server;
  }
}


exports.run = run;
