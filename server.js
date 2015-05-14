var cc       = require('config-multipaas'),
    fs       = require('fs'),
    restify  = require('restify'),
    kclient  = require('node-kubernetes-client'),
    doodleController = require('./doodle_controller.js')
var app      = restify.createServer()

app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Default state:
var index = fs.readFileSync(__dirname + '/static/index.html');
var one_thousand = 1024;
var config   = cc().add({
  one_k : process.env.DEMO_1K || one_thousand,
  minions : process.env.DEMO_MINIONS || 5,
  pod_size: process.env.DEMO_POD_SIZE || 6,
  oauth_token: process.env.ACCESS_TOKEN,
  openshift_server: process.env.OPENSHIFT_SERVER
})
var osv3_client = new kclient({
  host:  config.get('openshift_server'),
  protocol: 'https:',
  version: 'v1beta3',
  token: config.get('oauth_token')
});

// Routes
app.get('/api/doodle/:containerId', doodleController.getImage);
app.get('/api/doodle/random/:numDoodles', doodleController.randomDoodles);
app.post('/api/doodle/', doodleController.receiveImage);
app.get('/status', function (req, res, next) { res.send("{status: 'ok'}"); });

//Return a list of all known containers (labeled as 1k)
app.get("/containers", function (req, res, next) {
  osv3_client.pods.get(function (err, pods) {
    console.log('pods:', pods);
    res.send(pods)
  });
})
//Return a websocket stream of container changes
app.get("/containers/_changes", function (req, res, next) {
  res.send("{status: 'ok'}")
})
//fetch, update, or kill a container by id
app.get("/containers/id", function (req, res, next) {
  //Branch on GET, PUT, and DELETE
  res.send("{status: 'ok'}")
})

// TODO: add the hex dashboard here:
// 
app.get('/', function (req, res, next){
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(index.toString().replace(/host:port/g, req.header('Host')));
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
subscription = thousand.events.subscribe(function(event) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({type: 'event', data: event}));
  };
});
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

eventEmitter.on('new-doodle', function(doodle) {
console.log('doodle listener invoked.');
  wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
});
