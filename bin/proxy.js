var httpProxy = require('http-proxy'),
    Netmask   = require('netmask').Netmask,
    url       = require('url');
var proxy     = httpProxy.createProxyServer({secure: false});
var config    = require('./config');

proxy.on('close', function (req, socket, head) {
  // Alert when connections are dropped
  console.log('proxy connection dropped');
});
proxy.on('error',  function (error, req, res) {
  console.log('proxy error', error);
  console.log('proxy req', req);
  console.log('proxy res', res);
  var json = { error: 'proxy_error', reason: error.message };
  if(res){
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'application/json' });
    }
    res.end(JSON.stringify(json));
  }
});

var k8sApiPath = function(req, res, next) {
  var namespace = req.params[0] || config.get('namespace');
  var podId     = req.params[1];
  var filePath  = req.params[2] || '';
  var pod_host  = "https://"+config.get('openshift_server');
  var qs        = url.parse(req.url).search
  req.url = '/api/v1beta3/namespaces/'+namespace+'/pods/'+ podId +'/proxy/'+filePath
  if( qs && qs !== ''){
    req.url += qs;
  }
  if( config.get('oauth_token') ){
    req.headers.authorization = 'Bearer ' + config.get('oauth_token');
  }
  proxy.web(req, res, { target: pod_host });
  console.log('PROXY req.url', pod_host+req.url);
};

var directPath  = function(req, res, next){
  var namespace = config.get('namespace');
  var podIp     = req.params[0];
  var filePath  = req.params[1] || '';
  var pod_host  = "http://"+podIp+":8080";
  var qs        = url.parse(req.url).search
  req.url = filePath;
  if( qs && qs !== ''){
    req.url += qs;
  }
  if(config.get('allowed_subnet')){
    var block = new Netmask(config.get('allowed_subnet'));
    if( !block.contains(podIp) ){
      console.log('PROXY request FILTERED - req.url', pod_host+req.url);
    }
  }
  console.log('PROXY req.url', pod_host+req.url);
  proxy.web(req, res, { target: pod_host });
};

exports = module.exports = {
  'directPath': directPath,
  'apiPath': k8sApiPath
};
