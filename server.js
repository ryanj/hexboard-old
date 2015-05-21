var cc       = require('config-multipaas'),
    fs       = require('fs'),
    restify  = require('restify'),
    qs       = require('qs'),
    request  = require('request')
var app      = restify.createServer()
  , thousand = require('./thousand')
  , doodles  = require('./doodles')
  , winner   = require('./winner')
  , eventEmitter = thousand.doodleEmitter

// Config
var count = 0;
var clients = {};
var index = fs.readFileSync(__dirname + '/static/index.html');
var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo2',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
})

// Middlewarez!
app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Routes
app.get('/api/doodle/random/:numDoodles', doodles.randomd);
app.put('/doodle', doodles.receive);
app.get('/status', function (req, res, next) { res.send("{status: 'ok'}"); });

app.get("/containers", function (req, res, next) {
  thousand.replay.subscribeOnError(function(err) {
    console.log(err.stack || err);
  });
  res.send("ok");
})

app.get('/', function (req, res, next){
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(index.toString());
})

// Serve all the static assets prefixed at /static
app.get('.*', restify.serveStatic({directory: './static/'}));
app.listen(config.get('PORT'), config.get('IP'), function () {
  console.log( "Listening on " + config.get('IP') + ", port " + config.get('PORT') )
});

// Sockets:
var WebSocketServer = require('ws').Server
  , thousand = require('./thousand')
var wss = new WebSocketServer({server: app, path: '/thousand'});
var eventEmitter = thousand.doodleEmitter;
var count = 0;
var clients = {};

wss.broadcast = function broadcast(data) {
  for (var i in clients) {
    var ws = clients[i];
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    } else if (ws.readyState === ws.CLOSED) {
      console.log('Peer #' + ws.id + ' disconnected from /thousand.');
      delete clients[ws.id];
    }
  };
};

wss.on('connection', function connection(ws) {
  var id = count++;
  clients[id] = ws;
  ws.id = id;
  console.log('/thousand connection');
  var subscription;
  ws.on('message', function(data, flags) {
    var message = JSON.parse(data);
    if (message.type === 'ping') {
      ws.send(JSON.stringify({type: 'pong'}));
    }
  });
  ws.onclose = function() {
    console.log('Onclose: disposing /thousand subscriptions');
    subscription && subscription.dispose();
  };
});

thousand.doodleEmitter.on('new-doodle', function(doodle) {
  console.log('doodle listener invoked.');
  wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
});

winner.winnerEmitter.on('action', function(action) {
  console.log('winner listener invoked.');
  wss.broadcast(JSON.stringify({type: 'winner', data: action}));
});

eventEmitter.on('pod-event', function(pod) {
  console.log('pod event');
  wss.broadcast(JSON.stringify({type: 'event', data: pod}));
});
