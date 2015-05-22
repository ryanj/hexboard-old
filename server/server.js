var cc       = require('config-multipaas'),
    fs       = require('fs'),
    restify  = require('restify'),
    qs       = require('qs'),
    request  = require('request')
var app      = restify.createServer()
  , doodles  = require('./doodles')
  , pod      = require('./pod')

// Config
var count = 0;
var clients = {};
var index = fs.readFileSync(__dirname + '/../static/index.html');
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
app.get('/api/doodle/random/:numDoodles', doodles.randomDoodles);
app.put('/doodle', doodles.receive);
app.get('/status', function (req, res, next) { res.send("{status: 'ok'}"); });

app.get("/containers", function (req, res, next) {
  pod.replay.subscribeOnError(function(err) {
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
require('./ws/thousand')(app);
require('./ws/winner')(app);
