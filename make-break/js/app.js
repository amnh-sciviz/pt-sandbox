'use strict';

var MakeBreakApp = (function() {

  var app, opt, $canvas, w, h, game, gui;
  var bodies, objects, objectProperties, $domContainer;

  function MakeBreakApp(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      inputsAllowed: 5,
      objectProperties: {
        restitution: 0.2, // a.k.a. bounciness; 0 = no bounce
        density: 0.5, // default is 0.001
        friction: 0.9, // default is 0.1
        frictionAir: 0.05 // default is 0.01
      }
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  MakeBreakApp.prototype.init = function(){
    app = this;
    $canvas = $(opt.el);
    w = $canvas.width();
    h = $canvas.height();

    objects = [];
    objectProperties = _.clone(opt.objectProperties);

    $.when(
      $.getJSON(opt.configUrl),
      $.getJSON(opt.contentUrl)

    ).done(function(config, content){
      config = config[0];
      opt = _.extend({}, opt, config);
      objects = content[0].objects;
      console.log('Config and content loaded.');
      app.loadGame();
      app.loadGUI();
    });
  };

  MakeBreakApp.prototype.loadGame = function(){
    game = new Phaser.Game({
      type: Phaser.WEBGL,
      width: w,
      height: h,
      parent: $canvas.attr("id"),
      transparent: true,
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: true
        }
      },
      dom: {
        createContainer: true
      },
      scene: {
        create: function(){ app.onGameCreate(this); },
        update: function(){ app.onGameUpdate(this); }
      }
    });
  };

  MakeBreakApp.prototype.loadGUI = function(){
    gui = new dat.GUI();
    var controllers = [];
    controllers.push(gui.add(objectProperties, 'restitution', 0, 1));
    controllers.push(gui.add(objectProperties, 'friction', 0, 1));
    controllers.push(gui.add(objectProperties, 'frictionAir', 0, 1));

    var onUpdate = function(){ app.onGUIChange(); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });
  };

  MakeBreakApp.prototype.onGameCreate = function(game){
    game.matter.world.setBounds(0, 0, w, h);

    $domContainer = $canvas.children('div').first();
    if (!$domContainer.length) console.log("Could not find DOM container!");
    bodies = [];
    _.each(objects, function(obj){
      obj = _.extend({}, objectProperties, obj);
      var count = obj.count;
      if (count && count > 0) {
        _.times(count, function(i){
          bodies.push(new Body(_.extend({}, obj, {index: i, game: game, $container: $domContainer})));
        });
      }
    });

    game.matter.add.mouseSpring();

    // We need to add extra pointers, as we only get 1 by default
    game.input.addPointer(opt.inputsAllowed-1);
  };

  MakeBreakApp.prototype.onGUIChange = function(){

  };

  MakeBreakApp.prototype.onGameUpdate = function(){

  };

  return MakeBreakApp;

})();

$(function() {
  var app = new MakeBreakApp({});
});
