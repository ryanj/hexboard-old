#!/bin/env node

var cc       = require('config-multipaas'),
    path     = require('path'),
    fs       = require('fs'),
    //kclient  = require('node-kubernetes-client'),
    qs       = require('qs'),
    request  = require('request')
    //https = require('https')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var namespace = process.env.OPENSHIFT_NAMESPACE || 'demo2';
var one_thousand = 1024;
var config   = cc().add({
  one_k : process.env.DEMO_1K || one_thousand,
  minions : process.env.DEMO_MINIONS || 10,
  oauth_token: process.env.ACCESS_TOKEN || false,
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja'
})


if (process.env.ACCESS_TOKEN){
  //var osv3_client = new kclient({
  //  host:  config.get('openshift_server') + ':8443',
  //  protocol: 'https',
  //  version: 'v1beta2',
  //  token: config.get('oauth_token')
  //});
  //osv3_client.pods.getBy({"namespace":"demo2"},function(err, pods){
  //  console.log('err:', err);
  //  console.log('pods:', pods);
  //});
  var url = 'https://' + config.get('openshift_server') + ':8443/api/v1beta2/watch/pods'
  var options = {
    'method' : 'get'
   ,'uri'    : url 
   ,'qs'     : {'namespace': namespace}
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
