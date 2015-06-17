var http     = require('http').globalAgent.maxSockets = Infinity;
var https    = require('https').globalAgent.maxSockets = Infinity;
var restify  = require('restify'),
    fs       = require('fs')
var config   = require('./bin/config'),
    pod      = require('./bin/pod'),
    proxy    = require('./bin/proxy'),
    sketches = require('./bin/sketches'),
    sketchController = require('./bin/sketch_controller.js'),
    app      = restify.createServer()

// Middlewarez!
app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Default State
var count = 0;
var clients = {};
var indexPage = fs.readFileSync(__dirname + '/static/index.html').toString();

// Routes
app.get( '/api/sketch/:containerId', sketchController.getImage);
app.post('/api/sketch/:containerId', sketchController.receiveImage);
app.del( '/api/sketch/:containerId', sketchController.removeImage);
app.get( '/api/sketch/random/:numSketches', sketchController.randomSketches);
app.get( /^\/api\/v1beta3\/namespaces\/(\w)\/pods\/(\w)\/proxy\/(.*)/, proxy.path);
app.get( /^\/api\/v1beta3\/namespaces\/(\w)\/pods\/(\w)\/proxy/, proxy.path);
app.get( new RegExp("/("+config.get('namespace')+")\/pods\/([-a-zA-Z0-9_]+)\/proxy\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('namespace')+")\/pods\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.put( new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.post( new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.put( new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.post(new RegExp("/("+config.get('namespace')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.get( '/status', function (req, res, next) {
  res.send("{status: 'ok'}"); 
  return next();
});

// Index
app.get('/', function (req, res, next){
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(indexPage);
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
