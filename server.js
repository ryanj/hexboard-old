var cc       = require('config-multipaas'),
    fs       = require('fs'),
    http     = require("http"),
    st       = require("st"),
    Router   = require("routes-router"),
    sendJson = require("send-data/json"),
    sendHtml = require("send-data/html"),
    sendError= require("send-data/error")

var app      = Router()

// Default state:
var one_thousand = 1024;

var config   = cc().add({
  one_k : process.env.DEMO_1K || one_thousand,
  minions : process.env.DEMO_MINIONS || 5,
  pod_size: process.env.DEMO_POD_SIZE || 6
})

// Routes
app.addRoute("/status", function (req, res, opts, cb) {
  sendJson(req, res, "{status: 'ok'}")
})

//Return a list of all known containers (labeled as 1k)
app.addRoute("/containers", function (req, res, opts, cb) {
  sendJson(req, res, "{status: 'ok'}")
})
//Return a websocket stream of container changes
app.addRoute("/containers/_changes", function (req, res, opts, cb) {
  sendJson(req, res, "{status: 'ok'}")
})
//fetch, update, or kill a container by id
app.addRoute("/containers/id", function (req, res, opts, cb) {
  //Branch on GET, PUT, and DELETE
  sendJson(req, res, "{status: 'ok'}")
})

// TODO: add the hex dashboard here:
app.addRoute("/", function (req, res, opts, cb) {
  var index = fs.readFileSync(__dirname + '/index.html');
  sendHtml(req, res, {
    body: index.toString(),
    statusCode: 200,
    headers: {}
  })
})

// Serve all the static assets prefixed at /static
// so GET /js/app.js will work.
app.addRoute("/*", st({
  path: __dirname + "/static",
  url: "/"
}))

var server = http.createServer(app)
server.listen(config.get('PORT'), config.get('IP'), function () {
  console.log( "Listening on " + config.get('IP') + ", port " + config.get('PORT') )
});
