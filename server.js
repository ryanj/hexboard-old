var cc       = require('config-multipaas'),
    fs       = require('fs'),
    restify  = require('restify'),
    qs       = require('qs'),
    httpProxy = require('http-proxy'),
    request  = require('request')
var app      = restify.createServer(),
    pod      = require('./bin/pod'),
    proxy    = httpProxy.createProxyServer({secure: false}),
    sketches = require('./bin/sketches'), //<-- sketchController?
    sketchController = require('./bin/sketch_controller.js')

// Config
var count = 0;
var clients = {};
var index = fs.readFileSync(__dirname + '/static/index.html');
var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443',
  openshift_app_basename: process.env.OPENSHIFT_APP_BASENAME || 'apps.summit.paas.ninja:8443'
})

// Middlewarez!
app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Routes
app.get('/sketch/:containerId', sketchController.getImage);
app.post('/sketch/:containerId', sketchController.receiveImage);
app.del('/sketch/:containerId', sketchController.removeImage);
app.get('/sketch/random/:numSketches', sketchController.randomSketches);
app.get('/proxy/:pod_id', function(req, res, next) {
  req.url = '/api/v1beta3/namespaces/'+config.get('namespace') + '/pods/'+ req.params.pod_id +'/proxy';

  req.headers.authorization = 'Bearer ' + config.get('oauth_token');
  console.log(req.url);
  proxy.web(req, res, { target: config.get('openshift_server') });
});
app.get('/status', function (req, res, next) { 
  res.send("{status: 'ok'}"); 
});

// Index
app.get('/', function (req, res, next){
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(index.toString());
})

// Static Assets
app.get('.*', restify.serveStatic({directory: './static/'}));

// Listen
app.listen(config.get('PORT'), config.get('IP'), function () {
  console.log( "Listening on " + config.get('IP') + ", port " + config.get('PORT') )
});

// WebSockets:
require('./bin/ws/thousand')(app);
require('./bin/ws/winner')(app);

