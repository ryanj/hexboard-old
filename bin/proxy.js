var httpProxy = require('http-proxy');
var proxy     = httpProxy.createProxyServer({secure: false});
var config    = require('./config')

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
