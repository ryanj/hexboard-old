#!/bin/env node

var cc       = require('config-multipaas'),
    path     = require('path'),
    fs       = require('fs'),
    qs       = require('qs'),
    request  = require('request')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace  : process.env.NAMESPACE || 'hexboard',
  openshift_server : process.env.OPENSHIFT_SERVER || 'localhost'
})


if (process.env.ACCESS_TOKEN){
  var url = 'https://' + config.get('openshift_server') + '/api/v1/watch/pods'
  var options = {
    'method' : 'get'
   ,'uri'    : url 
   ,'qs'     : {'namespace': config.get('namespace'), 'watch': "true"}
   ,'rejectUnauthorized': false
   ,'strictSSL': false
   ,'auth'   : {'bearer': config.get('oauth_token') }
  }

  request(options, function(error, response, body){
    if(error){
      console.log("err:"+ err)
    }
  })
  .on('data', function(data) {
    data.received_on = new Date();
    console.log("data:"+data.toString());
  })
  .on('error', function(err) {
    console.log("err:"+ err)
  })
  .pipe(fs.createWriteStream('pods.log')) 



//var req = https.request({ 
//    host: config.get('openshift_server'), 
//    method: 'GET',
//    port: 8443,
//    path: '/api/v1beta2/pods?namespace=demo2',
//    rejectUnauthorized: false,
//    requestCert: true,
//    //agent: false,
//    headers: {'Authorization': "Bearer "+ config.get('oauth_token')}
//
//}, function(res){
//
//    var body = [];
//    res.on('data', function(data){
//        body.push(data);
//    });
//
//    res.on('end', function(){
//        console.log( body.join('') );
//    });
//
//});
//req.end();
//
//req.on('error', function(err){
//    console.log(err);
//});



}
