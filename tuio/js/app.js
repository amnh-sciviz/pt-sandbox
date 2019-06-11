'use strict';

var TuioApp = (function() {

  var opt, $canvas, $touches, $instructions;

  function TuioApp(config) {
    var defaults = {
      el: '#canvas',
      wsUrl: 'ws://localhost:8080'
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  TuioApp.prototype.init = function(){
    $touches = [];
    $canvas = $(opt.el);
    $instructions = $("#instructions");
    this.loadListeners();
  };

  TuioApp.prototype.loadListeners = function(){
    var _this = this;

    var oscPort = new osc.WebSocketPort({
      url: opt.wsUrl, // URL to Web Socket server.
      metadata: true
    });

    oscPort.on("ready", function(){
      console.log("Ready to receive OSC messages.");
    });

    oscPort.on("message", function (oscMsg) {
      console.log("An OSC message just arrived!", oscMsg);
    });

    oscPort.open();
  };

  TuioApp.prototype.renderTouches = function(touches){
    // hide inactive touches
    if (touches.length < $touches.length) {
      _.times($touches.length-touches.length, function(i){
        var index = touches.length + i;
        $touches[index].removeClass("active");
      });
    }

    // render active touches
    _.each(touches, function(e, i){
      this.renderTouch(e, i);
    }, this);
  };

  TuioApp.prototype.renderTouch = function(event, index){
    var $touch;

    // check to see if we need to add a new touch element
    if (index >= $touches.length) {
      $touch = $('<div class="touch"></div>');
      $canvas.append($touch);
      $touches.push($touch);
    } else {
      $touch = $touches[index];
    }

    // move and activate touch element
    var x = event.clientX;
    var y = event.clientY;
    $touch.css("transform", "translate3d("+x+"px, "+y+"px, 0)");
    $touch.html((index+1)+"<div>"+x.toFixed(2) + " " + y.toFixed(2)+"</div>");
    $touch.addClass("active");
  };

  return TuioApp;

})();

$(function() {
  var app = new TuioApp({});
});
