var cc       = require('config-multipaas'),
    fs       = require('fs'),
    restify  = require('restify'),
    qs       = require('qs'),
    request  = require('request')
var app      = restify.createServer()
  , thousand = require('./thousand')
  , eventEmitter = thousand.doodleEmitter

// Allow fake SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Middlewarez!
app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Default state:
var one_thousand = 1024;
var pod_statuses = []
var index = fs.readFileSync(__dirname + '/static/index.html');
var config   = cc().add({
  one_k : process.env.DEMO_1K || one_thousand,
  minions : process.env.DEMO_MINIONS || 5,
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo2',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
})
var url = 'https://' + config.get('openshift_server') + ':8443/api/v1beta2/watch/pods'
var options = {
  'method' : 'get'
 ,'uri'    : url
 ,'qs'     : {'namespace': config.get('namespace')}
 ,'rejectUnauthorized': false
 ,'strictSSL': false
 ,'auth'   : {'bearer': config.get('oauth_token') }
}


function podId(pod){
  return pod.object.desiredState.manifest.containers[0].name
}
function podNumber(pod){
  num = pod.object.desiredState.manifest.containers[0].name.match(/[0-9][0-9]*/)
  return num[0]
}
function verifyPodAvailable(pod, retries_remaining){
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  eventEmitter.emit('pod-event', pod.data);
}
function parseAddPod(pod){
  pod.data.state = 1;
  console.log("added: " + pod.data.name)
  eventEmitter.emit('pod-event', pod.data);
}

function parseUpdatePod(pod){
  pod.data.state = 2;
  console.log("pending: " + pod.data.name)
  eventEmitter.emit('pod-event', pod.data);
}
function parseDeletePod(pod){
  pod.data.state = 3;
  console.log("ready: " + pod.data.name);
  eventEmitter.emit('pod-event', pod.data);
  verifyPodAvailable(pod, 0);
}
function replay(){
  fs.readFile('./pods-create.log', function replay(err, data){
    if(err){
      throw err
    }
    data.toString().split('\n').forEach(function(update){
      parseData(update);
    });
  });
}

var parseData = function(data){
  if(data){
    update = JSON.parse(data);
    if(update.object.desiredState.manifest.containers[0].name != 'deployment'){
      //bundle the pod data
      update.data = {
        id: podNumber(update),
        name: podId(update),
        hostname: podId(update) + '-summit3.apps.summit.paas.ninja',
        state: update.type,
        type: 'event'
      }
      if(update.type == 'ADDED'){
        parseAddPod(update)
      }
      else if(update.type == 'MODIFIED'){
        parseUpdatePod(update)
      }
      else if(update.type == 'DELETED'){
        parseDeletePod(update)
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
  replay();
}

var randomDoodles = function(req, res, next) {
  var numDoodles = req.params.numDoodles;
  thousand.randomDoodles(numDoodles)
    .subscribe(function(doodle) {
      eventEmitter.emit('new-doodle', doodle);
    }, function(error) {
      next(error)
    }, function() {
      console.log(numDoodles + ' doodles pushed');
      res.json({msg: numDoodles + ' doodles pushed'});
    });
}

var receiveImage = function(req, res, next) {
  var containerId = parseInt(req.params.containerId) || req.params.cuid;
  var data;
  if (containerId < 0 || containerId >= 1060) {
    console.log("invalid container id");
    next('Invalid containerId');
    return;
  };
  var data = new Buffer('');
  req.on('data', function(chunk) {
    data = Buffer.concat([data, chunk]);
  });
  req.on('error', function(err) {
    next(err);
  });
  req.on('end', function() {
    var filename = 'doodle.png';
    fs.open('./static/img/' + filename, 'w', function(err, fd) {
      if (err) {
        next(err);
      };
      fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
        if (err) {
          next(err);
        };
        var doodle = {
          url: 'http://localhost'+'/img/doodle.png'
        , username: req.query.username
        , cuid: req.query.cuid
        , containerId: req.query.cuid
        , submission: req.query.submission
        }
        console.log(doodle);
        eventEmitter.emit('new-doodle', doodle)
        return res.json(doodle)
      });
    })
  });
}


// Routes
app.get('/api/doodle/random/:numDoodles', randomDoodles);
app.put('/doodle', receiveImage);
app.get('/status', function (req, res, next) { res.send("{status: 'ok'}"); });

//Return a list of all known containers (labeled as 1k)
app.get("/containers", function (req, res, next) {
  //osv3_client.pods.get(function (err, pods) {
  //  console.log('pods:', pods);
  res.send("ok");
  //});
  replay()
 
})
//Return a websocket stream of container changes
app.get("/containers/_changes", function (req, res, next) {
  res.send("{status: 'ok'}")
})
//fetch, update, or kill a container by id
app.get("/containers/id", function (req, res, next) {
  res.send("{status: 'ok'}")
})

// TODO: add the hex dashboard here:
// 
app.get('/', function (req, res, next){
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(index.toString().replace(/host:port/g, req.header('Host')));
})

// Serve all the static assets prefixed at /static
app.get('.*', restify.serveStatic({directory: './static/'}));
app.listen(config.get('PORT'), config.get('IP'), function () {
  console.log( "Listening on " + config.get('IP') + ", port " + config.get('PORT') )
});

// Sockets:
var WebSocketServer = require('ws').Server
  , thousand = require('./thousand')
var wss = new WebSocketServer({server: app, path: '/thousand'});
var eventEmitter = thousand.doodleEmitter;
var count = 0;
var clients = {};

wss.broadcast = function broadcast(data) {
  for (var i in clients) {
    var ws = clients[i];
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    } else if (ws.readyState === ws.CLOSED) {
      console.log('Peer #' + ws.id + ' disconnected from /thousand.');
      delete clients[ws.id];
    }
  };
};

wss.on('connection', function connection(ws) {
var id = count++;
clients[id] = ws;
ws.id = id;
console.log('/thousand connection');
var subscription;
subscription = thousand.events.subscribe(function(event) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({type: 'event', data: event}));
  };
});
ws.on('message', function(data, flags) {
var message = JSON.parse(data);
  if (message.type === 'ping') {
    ws.send(JSON.stringify({type: 'pong'}));
  }
});
ws.onclose = function() {
  console.log('Onclose: disposing /thousand subscriptions');
  subscription && subscription.dispose();
};
});

eventEmitter.on('pod-event', function(pod) {
  console.log('pod event');
  wss.broadcast(JSON.stringify({type: 'data', data: pod}));
});
eventEmitter.on('new-doodle', function(doodle) {
  console.log('doodle listener invoked.');
  //console.data(doodle);
  wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
});
