var Rx = require('rx')
  , cc = require('config-multipaas')
  , fs = require('fs')
  , thousandEmitter = require('./thousandEmitter')
  , request = require('request')
  ;

var tag = 'POD';
var pod_statuses = []
var submissionCount = 0;

// Config
var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo2',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
})

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var url = 'https://' + config.get('openshift_server') + '/api/v1beta2/watch/pods'
var options = {
  'method' : 'get'
 ,'uri'    : url
 ,'qs'     : {'namespace': config.get('namespace')}
 ,'rejectUnauthorized': false
 ,'strictSSL': false
 ,'auth'   : {'bearer': config.get('oauth_token') }
}

function podIdToURL(id){
  return "doodle-"+id+"-app-summit3.apps.summit.paas.ninja"
}

function podId(pod){
  return pod.object.desiredState.manifest.containers[0].name
}
function podNumber(pod){
  var num = pod.object.desiredState.manifest.containers[0].name.match(/[0-9][0-9]*/)
  return num[0]
}
function verifyPodAvailable(pod, retries_remaining){
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  thousandEmitter.emit('pod-event', pod.data);
}

var rxReadfile = Rx.Observable.fromNodeCallback(fs.readFile);

var logEvents = rxReadfile('./pods-create.log')
  .flatMap(function(data) {
    return data.toString().split('\n');
  })
  .map(function(update) {
    return parseData(update);
  });

var replay = Rx.Observable.zip(
  logEvents
, Rx.Observable.interval(200)
, function(podEvent, index) { return podEvent}
).tap(function(parsed) {
  if (parsed && parsed.data && parsed.data.stage) {
    thousandEmitter.emit('pod-event', parsed.data);
  };
})

var parseData = function(data){
  if(data){
    try {
      var update = JSON.parse(data);
    } catch (error) {
      console.error('********************', error);
      console.log('data:', data.toString('utf8'));
      console.error('/********************');
      return
    }
    if(update.object.desiredState.manifest.containers[0].name != 'deployment'){
      //bundle the pod data
      update.data = {
        id: podNumber(update),
        name: podId(update),
        hostname: podId(update) + '-summit3.apps.summit.paas.ninja',
        stage: update.type,
        type: 'event'
      }
      if(update.type == 'ADDED'){
        update.data.stage = 1;
      }
      else if(update.type == 'MODIFIED'){
        update.data.stage = 2;
      }
      else if(update.type == 'DELETED'){
        update.data.stage = 3;
      }else{
        console.log("New data type found:" + JSON.stringify(update))
        //console.log('\n');
        //console.log("update_type: "+update.type)
        //console.log("name: "+update.object.desiredState.manifest.containers[0].name)
        //console.log("status: "+ update.object.status)
        //console.log('\n');
        //console.log("update id:"+update.object.id);
        //console.log("data:"+JSON.stringify(update));
      }
      //persist pod state
      pod_statuses[update.data.id] = update.data
    }
    return update;
  }
}



var getLiveStream = function() {
  console.log('options', options);
  var stream = request(options);
  //.pipe(fs.createWriteStream('pods.log'))
  return Rx.Observable.create(function(observable) {
    // manually create the observable, so we can join incomplete messages
    var oldData = new Buffer('');
    stream.on('data', function(data) {
      data = (oldData.length) ? Buffer.concat([oldData, data]) : data;
      try {
        JSON.parse(data); // see if we can parse the data
        oldData = new Buffer('');
        observable.onNext(data);
      } catch (error) {
        oldData = data; // stack parse failures for later concatentation
      }
    });
    stream.on('error', function(error) {
      observable.onError(data);
    });
    stream.on('end', function() {
      console.log('stream ended');
      observable.onCompleted();
    })
  })
  .map(function(data) {
    return parseData(data);
  }).filter(function(parsed) {
    return parsed && parsed.data && parsed.data.stage;
  }).map(function(parsed) {
    return parsed.data;
  });
};

var podEventFeed = function () {
  return process.env.ACCESS_TOKEN ? getLiveStream() : replay;
};

module.exports = {
  events: podEventFeed
, replay : replay
};
