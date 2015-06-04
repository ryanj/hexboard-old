'use strict';

var hex = hex || {};

hex.inspect = (function dataSimulator(d3, Rx) {
  var highlightedHexagon;

  var getHighlightedHexagon = function() {
    return highlightedHexagon;
  }

  var highlight = function(index) {
    if (highlightedHexagon) {
      unhighlight();
    }
    var perspective = 1.5
      , duration = 200
      , zoom = 2.5;

    var p = hex.ui.points[index];
    highlightedHexagon = hex.ui.svg.insert('path');
    highlightedHexagon
      .attr('class', 'hexagon inspect')
      .attr('d', 'm' + hex.ui.hexagon(hex.ui.honeycomb.size).join('l') + 'z')
      .attr('transform', 'translate(' + p.x + ',' + p.y + ')')
      .attr('fill', 'url(#img' + p.id + ')')
      .style('fill-opacity', 1.0)
      .datum(p)
    .transition()
      .duration(duration)
      .ease('quad-out')
      .attr('transform', 'matrix('+zoom+', 0, 0, '+zoom+', '+ p.x +', '+ p.y +')');
  };

  var unhighlight = function() {
    if (! highlightedHexagon) {
      return;
    };
    var perspective = 1.5
      , duration = 200
      , scale = 0.2;
    var p = highlightedHexagon.datum();
    highlightedHexagon
    .transition()
    .duration(duration)
    .ease('quad-out')
    .attr('transform', 'translate(' + p.x + ',' + p.y + ')')
    .remove();
  };

  return {
    highlight: highlight
  , unhighlight: unhighlight
  , getHighlightedHexagon: getHighlightedHexagon
  }
})(d3, Rx);
