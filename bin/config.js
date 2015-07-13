var multipaas  = require('config-multipaas');
var autoconfig = function (config_overrides){
  var config   = multipaas(config_overrides).add({
    app_name   : process.env.APPNAME || 'sketchpod'
  , oauth_token: process.env.ACCESS_TOKEN || false
  , allowed_subnet : process.env.ALLOWED_SUBNET || false
  , namespace  : process.env.NAMESPACE || 'hexboard'
  , openshift_server: process.env.OPENSHIFT_SERVER || 'localhost:8443'
  , hexboard_host  : process.env.HEXBOARD_HOST || 'localhost:1080'
  });
  return config;
}
exports = module.exports = autoconfig();
