'use strict';

var d3demo = d3demo || {};

d3demo.config = (function() {
  var getParameterByName=  function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  return {
      backend: {
        ws: 'ws://' + window.location.host
      }
    , playback: {
        rate: getParameterByName('rate') || 600
      }
  };
})();
