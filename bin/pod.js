'use strict';

var Rx = require('rx')
  , RxNode  = require('rx-node')
  , config  = require('./config')
  , request = require('request')
  , split   = require('split')
  , fs      = require('fs')
  , thousandEmitter = require('./thousandEmitter')
  , _ = require('underscore');

var tag = 'POD';

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var buildWatchPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/watch/namespaces/' + namespace + '/pods';
};

var buildListPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/namespaces/' + namespace + '/pods';
};

var optionsBase = {
    method : 'get'
  , url    : null
  , qs     : {}
  , rejectUnauthorized: false
  , strictSSL: false
  , auth   : null
};

var environment = {
    listUrl: buildListPodsUrl(config.get('openshift_server'), config.get('namespace'))
  , watchUrl: buildWatchPodsUrl(config.get('openshift_server'), config.get('namespace'))
  , listOptions: _.defaults({
      url: buildListPodsUrl(config.get('openshift_server'), config.get('namespace')),
      auth: {bearer:  config.get('oauth_token')}
    }, optionsBase)
  , watchOptions: _.defaults({
      url: buildWatchPodsUrl(config.get('openshift_server'), config.get('namespace')),
      auth: {bearer:  config.get('oauth_token')}
    }, optionsBase)
  , state: {first  : true, pods: {}}
};

var idMapNamespaces = {};
var nextId = {};

function podNumber(namespace, name) {
  if (! idMapNamespaces[namespace]) {
    idMapNamespaces[namespace] = {};
    nextId[namespace] = 0;
  }
  var idMap = idMapNamespaces[namespace];
  var num = name.match(/[a-z0-9]*$/);
  var stringId = num[0];
  if (! (stringId in idMap)) {
    idMap[stringId] = nextId[namespace]++;
  }
  return idMap[stringId];
};

function verifyPodAvailable(pod) {
  return Rx.Observable.create(function(observer) {
    var options = {
      url: pod.url + '/status'
    , method: 'get'
    }
    request(options, function(error, response, body) {
      //console.log("error:")
      //console.log(error)
      //console.log("response:")
      //console.log(response)
      //console.log("body:")
      //console.log(body)
      if (!error && response && response.statusCode && response.statusCode == 200) {
        if (pod.errorCount) {
          console.log(tag, 'Recovery (#', pod.errorCount, ')', parsed.object.metadata.name);
          delete(pod.errorCount);
        }
        observer.onNext(pod);
        observer.onCompleted();
      } else {
        var err = {
          code: 401
        , response: response
        , msg: error
        }
        observer.onError(err);
      };
    })
  })
  .retryWhen(function(errors) {
    var maxRetries = 20;
    return errors.scan(0, function(errorCount, err) {
      if (errorCount === 0) {
        console.log(tag, 'Error ', pod.url, ':', err);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        return maxRetries;
      };
      pod.errorCount = ++errorCount;
      return errorCount;
    })
    .takeWhile(function(errorCount) {
      return errorCount < maxRetries;
    })
    .flatMap(function(errorCount) {
      return Rx.Observable.timer(errorCount * 250);
    });
  })
  .catch(Rx.Observable.empty());
};

var parseData = function(update) {
  if (! (update && update.object && update.object.spec && update.object.spec.containers && update.object.spec.containers.length > 0)) {
    return update;
  };
  var podName = update.object.spec.containers[0].name;
  if (podName.indexOf(config.get('app_name')) !== 0 || !update.object.status || !update.object.status.phase) {
    // console.log(tag, 'Ignoring update for container name:', update.object.spec.containers[0].name);
  } else {
    var replicaName = update.object.metadata.name;
    //bundle the pod data
    // console.log(tag, 'name',update.object.spec.containers[0].name, update.object.metadata.name)
    update.data = {
      id: podNumber(update.object.metadata.namespace, replicaName),
      name: replicaName,
      url: "http://"+config.get('hexboard_host')+'/'+config.get('namespace')+'/'+replicaName,
      hostname: config.get('hexboard_host')+'/'+config.get('namespace')+'/'+replicaName,
      stage: update.type,
      type: 'event',
      timestamp: update.timestamp,
      creationTimestamp: new Date(update.object.metadata.creationTimestamp)
    }
    if (update.type === 'DELETED') {
      update.data.stage = 0;
    } else if (update.object.status.phase === 'Pending' && ! update.object.spec.host) {
      update.data.stage = 1;
    } else if (update.object.status.phase === 'Pending' && update.object.spec.host) {
      update.data.stage = 2;
    } else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'False') {
      update.data.stage = 3;
    } else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'True') {
      update.data.stage = 4;
    } else {
      console.log(tag, "New data type found:" + JSON.stringify(update, null, '  '))
    }
  }
  return update;
};

var list = function(env) {
  return Rx.Observable.create(function(observer) {
    delete env.watchOptions.qs.latestResourceVersion;
    console.log(tag, 'list options', env.listOptions);
    var stream = request(env.listOptions, function(error, response, body) {
      if (error) {
        console.log(tag, 'error:',error);
        observer.onError(error);
      } else if (response && response.statusCode && response.statusCode === 200) {
        var json = JSON.parse(body);
        json.timestamp = new Date();
        observer.onNext(json.items);
        observer.onCompleted();
      } else {
        observer.onError({
          code: response.statusCode
        , msg: body
        });
      }
    });
  })
  .flatMap(function(pods) {
    return pods;
  })
  .flatMap(function(object) {
    var pod = {type: 'List Result', object: object};
    env.watchOptions.qs.latestResourceVersion = pod.object.metadata.resourceVersion;
    var name = pod.object.metadata.name;
    var oldPod = env.state.pods[name];
    if (!oldPod || oldPod.object.metadata.resourceVersion != pod.object.metadata.resourceVersion) {
      env.state.pods[name] = pod;
      return [pod];
    }
    else {
      return Rx.Observable.empty;
    }
  })
}

var watch = function(env) {
  return Rx.Observable.create(function(observer) {
    console.log(tag, 'watch options', env.watchOptions);
    var stream = request(env.watchOptions);
    stream.on('error', function(error) {
      console.log(tag, 'error:',error);
      observer.onError(error);
    });
    stream.on('end', function() {
      observer.onError({type: 'end', msg: 'Request terminated.'});
    });
    var lines = stream.pipe(split());
    stream.on('response', function(response) {
      if (response.statusCode && response.statusCode === 200) {
        console.log(tag, 'Connection success');
        observer.onNext(lines)
      } else {
        response.on('data', function(data) {
          var message;
          try {
            var data = JSON.parse(data);
            message = data.message;
          } catch(e) {
            message = data.toString();
          }
          var error = {
            code: response.statusCode
          , message: message
          };
          if (error.code === 401 || error.code === 403) {
            error.type = 'auth';
          };
          console.log(tag, error);
          observer.onError(error);
        });
      };
    });
  })
  .flatMap(function(stream) {
    return RxNode.fromStream(stream)
  })
  .flatMap(function(data) {
    try {
      var pod = JSON.parse(data);
      pod.timestamp = new Date();
      var name = pod.object.metadata.name;
      var oldPod = env.state.pods[pod.object.metadata.name];
      if (!oldPod || oldPod.object.metadata.resourceVersion != pod.object.metadata.resourceVersion) {
        env.state.pods[name] = pod;
        return [pod];
      }
      else {
        return Rx.Observable.empty;
      }
    } catch(e) {
      console.log(tag, 'JSON parsing error:', e);
      console.log(data);
      return Rx.Observable.empty;
    }
  })
};

var listWatch = function(env) {
  return list(env).toArray().flatMap(function(pods) {
    if (pods.length) {
      var last = pods[pods.length - 1];
    }
    return Rx.Observable.merge(
      Rx.Observable.fromArray(pods)
    , watch(env)
    );
  });
};

var watchStream = function(env) {
  return listWatch(env).retryWhen(function(errors) {
    return errors.scan(0, function(errorCount, err) {
      console.log(tag, new Date());
      console.log(tag, 'Connection error:', err)
      if (err.type && err.type === 'end') {
        console.log(tag, 'Attmepting a re-connect (#' + errorCount + ')');
        return errorCount + 1;
      } else {
        throw err;
      }
    });
  })
  .share();
};

var liveWatchStream = watchStream(environment);
var preStartWatchStream = watchStream(environment);

var parsedLiveStream = liveWatchStream.map(function(json) {
  return parseData(json, false);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
})
.replay();

parsedLiveStream.connect();

var parsedPreStartStream = preStartWatchStream.map(function(json) {
  return parseData(json, true);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
});

var availablePreStartStream = parsedPreStartStream.flatMap(function(parsed) {
  var data = parsed.data
  console.log("parsed data:")
  console.log(data)
  //if (parsed.data.stage != 4) {
  if (data.stage && data.stage != 4 ) {
    return Rx.Observable.just(parsed);
  } else {
    return Rx.Observable.merge(
      Rx.Observable.just(parsed)
    , verifyPodAvailable(data).map(function() {
        var newParsed = _.clone(parsed)
        newParsed.data = _.clone(data);
        newParsed.data.stage = 5;
        env.state.pods[newParsed.object.metadata.name] = newParsed;
        return newParsed;
      })
    );
  };
}).replay();

availablePreStartStream.connect();

var getActivePreStartPods = availablePreStartStream.filter(function(parsed) {
  return parsed.data.stage === 5;
})
.map(function(parsed) {
  return parsed.data;
}).share()
// .tap(function(pod) {
//   console.log('Available:', pod.url);
// })
;

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var getRandomPod = getActivePreStartPods.filter(function(pod) {
  return ! pod.claimed;
})
.buffer(getActivePreStartPods.debounce(5))
.take(1)
.map(function(pods) {
  var index = getRandomInt(0, pods.length);
  var pod = pods[index];
  pod.claimed = true;
  return pod;
});

module.exports = {
  rawLiveStream: liveWatchStream
, rawPreStartStream: preStartWatchStream
, liveStream: parsedLiveStream
, preStartStream: availablePreStartStream
, parseData : parseData
, getRandomPod: getRandomPod
};
