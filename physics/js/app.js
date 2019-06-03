'use strict';

var PhysicsApp = (function() {

  var app, opt, $canvas, w, h, game, gui;
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
        frictionAir: 0.05, // default is 0.01
        scale: 0.5
      }
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  PhysicsApp.prototype.init = function(){
    app = this;
    $canvas = $(opt.el);
    w = $canvas.width();
    h = $canvas.height();

    objects = [];
    objectProperties = _.clone(opt.objectProperties);

    this.loadGame();
  };

  PhysicsApp.prototype.addObjects = function(game, count){
    // add random objects
    var radius = 50;
    var _this = this;

    for (var i = 0; i < count; i++) {
      var x = Phaser.Math.Between(radius, w-radius);
      var y = Phaser.Math.Between(radius, h-radius);
      var obj = game.matter.add.image(x, y, 'molecule');
      obj.setCircle();
      _this.updateObject(obj, _.clone(objectProperties));
      objects.push(obj);
    }
  };

  PhysicsApp.prototype.loadGame = function(){
    var phaserGame = new Phaser.Game({
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
          preload: function(){ app.preload(this); },
          create: function(){ app.onGameCreate(this); }
      }
    });
  };

  PhysicsApp.prototype.loadGUI = function(game){
    gui = new dat.GUI();
    var controllers = [];
    controllers.push(gui.add(objectProperties, 'restitution', 0, 1));
    controllers.push(gui.add(objectProperties, 'density', 0.0001, 1));
    controllers.push(gui.add(objectProperties, 'friction', 0, 1));
    controllers.push(gui.add(objectProperties, 'frictionAir', 0, 1));
    controllers.push(gui.add(objectProperties, 'scale', 0.1, 1.0));
    var onUpdate = function(){ app.onGUIChange(game); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });

    var countController = gui.add(opt, 'objects', 1, 100);
    countController.onFinishChange(function(){ app.onCountUpdate(game); });
  };

  PhysicsApp.prototype.onCountUpdate = function(game){
    var count = Math.round(opt.objects);

    if (count > objects.length) this.addObjects(game, count - objects.length);
    else if (count < objects.length) this.removeObjects(game, objects.length - count);
  };

  PhysicsApp.prototype.onGameCreate = function(game){
    game.matter.world.setBounds(0, 0, w, h);

    this.addObjects(game, opt.objects);

    // console.log(objects[0]);

    game.matter.add.mouseSpring();

    // We need to add extra pointers, as we only get 1 by default
    game.input.addPointer(opt.inputsAllowed-1);

    this.loadGUI(game);
  };

  PhysicsApp.prototype.onGUIChange = function(game){
    var _this = this;
    _.each(objects, function(object, i){
      _this.updateObject(object, _.clone(objectProperties));
    });
  };

  PhysicsApp.prototype.preload = function(game){
    game.load.image('molecule', 'img/molecule.png');
  };

  PhysicsApp.prototype.removeObjects = function(game, count){
    var objCount = objects.length;
    for (var i=0; i < count; i++) {
      var obj = objects[objCount-1-i];
      obj.destroy();
    }
    var targetCount = objCount - count;
    objects = objects.slice(0, targetCount);
  };

  PhysicsApp.prototype.updateObject = function(obj, props){
    obj.setBounce(props.restitution);
    obj.setDensity(props.density);
    obj.setFriction(props.friction);
    obj.setFrictionAir(props.frictionAir);
    obj.setScale(props.scale);
  };

  return PhysicsApp;

})();

$(function() {
  var app = new PhysicsApp({});
});
