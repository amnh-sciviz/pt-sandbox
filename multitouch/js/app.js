'use strict';

var MultiTouchApp = (function() {

  var opt, $canvas, $touches, $instructions;

  function MultiTouchApp(config) {
    var defaults = {
      el: '#canvas'
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  MultiTouchApp.prototype.init = function(){
    $touches = [];
    $canvas = $(opt.el);
    $instructions = $("#instructions");
    this.loadTouchListeners();
  };

  MultiTouchApp.prototype.loadTouchListeners = function(){
    var _this = this;

    $canvas.on('touchstart touchmove touchend', function(e) {
      $instructions.css("display", "none");
       _this.renderTouches(e.touches);
    });
  };

  MultiTouchApp.prototype.renderTouches = function(touches){
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

  MultiTouchApp.prototype.renderTouch = function(event, index){
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

  return MultiTouchApp;

})();

$(function() {
  var app = new MultiTouchApp({});
});
