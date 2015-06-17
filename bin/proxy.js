var httpProxy = require('http-proxy');
var proxy     = httpProxy.createProxyServer({secure: false});
var config    = require('./config')

proxy.on('close', function (req, socket, head) {
  // Alert when connections are dropped
  console.log('Client disconnected');
});
proxy.on('error',  function (error, req, res) {
  console.log('proxy error', error);
  if (!res.headersSent) {
    res.writeHead(500, { 'content-type': 'application/json' });
  }
  var json = { error: 'proxy_error', reason: error.message };
  res.end(JSON.stringify(json));
});

var path = function(req, res, next) {
  var namespace = req.params[0] || config.get('namespace');
  var podId = req.params[1];
  var filePath = req.params[2] || '';
  //console.log("namespace, podid, filepath: " + namespace +" "+podId+" "+filePath)
  req.url = '/api/v1beta3/namespaces/'+namespace+'/pods/'+ podId +'/proxy/'+filePath;
  req.headers.authorization = 'Bearer ' + config.get('oauth_token');
  proxy.web(req, res, { target: "https://"+config.get('openshift_server') });
};

exports = module.exports = {
  'path': path
};
