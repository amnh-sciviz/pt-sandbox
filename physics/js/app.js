'use strict';

var PhysicsApp = (function() {

  var opt, $canvas, w, h, game, gui;
  var objects, objectProperties;

  function PhysicsApp(config) {
    var defaults = {
      el: '#canvas',
      objects: 20,
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

  PhysicsApp.prototype.init = function(){
    $canvas = $(opt.el);
    w = $canvas.width();
    h = $canvas.height();

    objects = [];
    objectProperties = _.clone(opt.objectProperties);

    this.loadGame();
    this.loadGUI();
  };

  PhysicsApp.prototype.loadGame = function(){
    var _this = this;
    game = new Phaser.Game({
      type: Phaser.WEBGL,
      width: w,
      height: h,
      parent: $canvas.attr("id"),
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: true
        }
      },
      scene: {
          create: function(){ _this.onGameCreate(this); },
          update: function(){ _this.onGameUpdate(this); }
      }
    });
  };

  PhysicsApp.prototype.loadGUI = function(){
    gui = new dat.GUI();
    var controllers = [];
    controllers.push(gui.add(objectProperties, 'restitution', 0, 1));
    controllers.push(gui.add(objectProperties, 'density', 0.0001, 1));
    controllers.push(gui.add(objectProperties, 'friction', 0, 1));
    controllers.push(gui.add(objectProperties, 'frictionAir', 0, 1));

    var _this = this;
    var onUpdate = function(){ _this.onGUIChange(); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });
  };

  PhysicsApp.prototype.onGameCreate = function(scene){
    scene.matter.world.setBounds(0, 0, w, h);

    // add random objects
    var sideLenMax = Math.max(Math.round(Math.min(w, h) * 0.08), 20);
    var sideLenMin = Math.round(sideLenMax * 0.5);
    for (var i = 0; i < opt.objects; i++) {
      var objW = Phaser.Math.Between(sideLenMin, sideLenMax);
      var objH = Phaser.Math.Between(sideLenMin, sideLenMax);
      var radius = Math.max(objW, objH) * 0.5;
      var x = Phaser.Math.Between(radius, w-radius);
      var y = Phaser.Math.Between(radius, h-radius);

      if (Math.random() < 0.7) {
          var sides = Phaser.Math.Between(3, 14);
          objects.push(scene.matter.add.polygon(x, y, sides, radius, _.clone(opt.objectProperties)));
      } else {
          objects.push(scene.matter.add.rectangle(x, y, objW, objH, _.clone(opt.objectProperties)));
      }
    }

    scene.matter.add.mouseSpring();

    // We need to add extra pointers, as we only get 1 by default
    scene.input.addPointer(opt.inputsAllowed-1);
  };

  PhysicsApp.prototype.onGUIChange = function(){
    _.each(objects, function(object, i){
      _.each(objectProperties, function(value, key){
        if (object[key] != value) object[key] = value;
      });
    });
  };

  PhysicsApp.prototype.onGameUpdate = function(){

  };

  return PhysicsApp;

})();

$(function() {
  var app = new PhysicsApp({});
});
