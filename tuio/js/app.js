'use strict';

var TuioApp = (function() {

  var opt, $canvas, w, h, $instructions, pixiApp, graphics;

  function TuioApp(config) {
    var defaults = {
      el: '#canvas',
      touchBgColor: 0x205c6a,
      touchRadius: 30,
      maxTouches: 32,
      textStyle: {
        fill: 0xffffff,
        fontSize: 22,
        fontFamily: 'sans-serif'
      }
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  TuioApp.prototype.init = function(){
    $canvas = $(opt.el);
    // $instructions = $("#instructions");

    this.loadUI();
    this.loadListeners();
    this.render();
  };

  TuioApp.prototype.loadListeners = function(){
    this.tc = new TuioClient();

    $(window).on('resize', function(){
      w = $canvas.width();
      h = $canvas.height();
      this.app.renderer.resize(w, h);
    });

    // $(document).one('click', function(e){
    //   $instructions.css("display", "none");
    // });
  };

  TuioApp.prototype.loadUI = function(){
    w = $canvas.width();
    h = $canvas.height();
    pixiApp = new PIXI.Application({width: w, height: h, transparent: true, antialias: true});
    graphics = new PIXI.Graphics();

    for(var i=0; i<opt.maxTouches; i++) {
      var label = new PIXI.Text("");
      label.style = _.clone(opt.textStyle);
      label.anchor.set(0.5, 0.5);
      graphics.addChild(label);
    }

    pixiApp.stage.addChild(graphics);
    $canvas.append(pixiApp.view);
  };

  TuioApp.prototype.render = function(){
    var _this = this;

    this.renderTouches();

    requestAnimationFrame(function(){ _this.render(); });
  };

  TuioApp.prototype.renderTouches = function(touches){
    var touches = this.tc.getLiveObjects();

    graphics.clear();

    // render active touches
    _.each(touches, function(e, i){
      this.renderTouch(e, i);
    }, this);

    // hide remaining labels
    for(var i=touches.length; i<opt.maxTouches; i++) {
      graphics.children[i].text = "";
    }
  };

  TuioApp.prototype.renderTouch = function(event, index){
    var x = event.x * w;
    var y = event.y * h;
    graphics.beginFill(opt.touchBgColor, 1);
    graphics.drawCircle(x, y, opt.touchRadius);
    graphics.endFill();

    var label = graphics.children[index];
    label.text = event.sid;
    label.x = x;
    label.y = y;
  };

  return TuioApp;

})();

$(function() {
  var app = new TuioApp({});
});
