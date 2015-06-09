'use strict';

var d3demo = d3demo || {};

d3demo.config = (function() {
  var getParameterByName=  function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
  var ws_port = ''
  if (window.location.host.indexOf('rhcloud.com') > 0 ||
      window.location.host.indexOf('jbosskeynote.com') > 0 ){
    ws_port = ':8000'
  }
  return {
      backend: {
        ws: 'ws://' + window.location.host + ws_port
      }
    , playback: {
        rate: getParameterByName('rate') || 600
      }
  };
})();
