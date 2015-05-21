var Rx = require('rx')
  , cc           = require('config-multipaas')
  , fs       = require('fs')
  , EventEmitter = require("events").EventEmitter
  , request = require('request')
  ;

var doodleEmitter = new EventEmitter();
var tag = 'THOUSAND';
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

var url = 'https://' + config.get('openshift_server') + ':8443/api/v1beta2/watch/pods'
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
  doodleEmitter.emit('pod-event', pod.data);
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
    doodleEmitter.emit('pod-event', parsed.data);
  };
})

var parseData = function(data){
  if(data){
    var update = JSON.parse(data);
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

if (process.env.ACCESS_TOKEN){
  request(options, function(error, response, body){
    if(error){
      console.log("err:"+ err)
    }
  })
  .on('data', function(data) {
    parseData(data);
  })
  .on('error', function(err) {
    console.log("err:"+ err)
  }) // log the data stream
  //.pipe(fs.createWriteStream('pods.log'))
}else{
  //replay a previous data stream
  replay.subscribeOnError(function(err) {
    console.log(err.stack || err);
  });
}

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var events2 = Rx.Observable.range(0, 1026)
  .flatMap(function(index) {
    var delay = 0;
    return Rx.Observable.range(1, 4) // 5 states
      .flatMap(function(stage) {
        delay += getRandomInt(2000, 3000);
        return Rx.Observable.range(0,1)
          .map(function() {
            return {
              id: index
            , stage: stage
            };
          })
          .delay(delay);
      })
  })

var images = ['box-cartone.png', 'cherries.png', 'fairy.png', 'johnny-automatic-skateboard.png', 'kick-scouter3.png', 'papaya.png', 'paratrooper.png', 'Segelyacht.png', 'TheStructorr-cherries.png', 'unicycle.png'];

var submissionCount = 0;

var randomDoodles = function(numDoodles) {
  var doodles = Rx.Observable.range(0, numDoodles)
    .flatMap(function(x) {
      var imageIndex = getRandomInt(0, 13);
      return Rx.Observable.range(0,1)
        .map(function() {
          var containerId = getRandomInt(0, 1026);
          var doodle = {
            containerId: containerId
          , url: '/thousand/doodles/thousand-doodle' + imageIndex + '.png'
          , name: 'FirstName' + containerId + ' LastName' + containerId
          , cuid: imageIndex
          , submissionId: submissionCount++
          };
          return doodle;
        })
        .delay(getRandomInt(0, 1000));
    });
  return doodles;
}


module.exports = {
  events : events2
, replay : replay
, randomDoodles: randomDoodles
, doodleEmitter: doodleEmitter
};
