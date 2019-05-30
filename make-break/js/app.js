'use strict';

var MakeBreakApp = (function() {

  var app, opt, $canvas, w, h, game, gui;
  var bodies, objects, objectLookup, physicalProperties, $domContainer;

  function MakeBreakApp(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      inputsAllowed: 5,
      physicalProperties: {
        restitution: 0.5, // a.k.a. bounciness; 0 = no bounce
        density: 0.4, // default is 0.001
        friction: 0.4, // default is 0.1
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
    physicalProperties = _.clone(opt.physicalProperties);

    $.when(
      $.getJSON(opt.configUrl),
      $.getJSON(opt.contentUrl)

    ).done(function(config, content){
      config = config[0];
      opt = _.extend({}, opt, config);
      objects = app.parseObjects(content[0].objects);
      objectLookup = _.object(_.map(objects, function(o){ return [o.id, _.clone(o)]; }));
      console.log('Config and content loaded.');
      app.loadGame();
      app.loadSounds();
    });
  };

  MakeBreakApp.prototype.loadGame = function(){
    var phaserGame = new Phaser.Game({
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
        // update: function(){ app.onGameUpdate(this); }
      }
    });
  };

  MakeBreakApp.prototype.loadGUI = function(){
    gui = new dat.GUI();
    var controllers = [];
    controllers.push(gui.add(physicalProperties, 'restitution', 0, 1));
    controllers.push(gui.add(physicalProperties, 'friction', 0, 1));
    controllers.push(gui.add(physicalProperties, 'frictionAir', 0, 1));

    var onUpdate = function(){ app.onGUIChange(); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });
  };

  MakeBreakApp.prototype.loadListeners = function(){
    game.matter.world.on('collisionend', function (event, bodyA, bodyB) {
      // console.log('collision end')
      app.onCollisionEnd(bodyA, bodyB);
    });
    game.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
      // console.log('collision start')
      app.onCollision(bodyA, bodyB);
    });
  };

  MakeBreakApp.prototype.loadSounds = function(){
    if (opt.makeSound) this.makeSound = new Sound(opt.makeSound);
    if (opt.breakSound) this.breakSound = new Sound(opt.breakSound);
    if (opt.collideSound) this.collideSound = new Sound(opt.collideSound);
  };

  MakeBreakApp.prototype.onCollision = function(matterBodyA, matterBodyB) {
    var idA = matterBodyA.label;
    var idB = matterBodyB.label;
    var bodyA = bodies[idA];
    var bodyB = bodies[idB];

    if (bodyA === undefined || bodyB === undefined) return;

    // check for environment
    if (bodyA.isEnvironment()) {
      bodyB.onEnvironmentEnter(bodyA);
      return;
    }
    if (bodyB.isEnvironment()) {
      bodyA.onEnvironmentEnter(bodyB);
      return;
    }

    // check for reaction
    var newBody = bodyA.combineWith(bodyB, objectLookup);
    if (newBody) {
      // delete collided bodies
      delete bodies[idA];
      delete bodies[idB];
      // add new body
      bodies[newBody.id] = newBody;
      this.makeSound && this.makeSound.playPercent(1.0-newBody.getWeight());
      return;
    }

    var newBodies = bodyA.breakWith(bodyB, objectLookup);
    if (newBodies && newBodies.length) {
      // delete collided bodies
      delete bodies[idA];
      delete bodies[idB];
      // add new bodies
      _.each(newBodies, function(body){
        bodies[body.id] = body;
      });
      this.breakSound && this.breakSound.playSprite("break");
      return;
    }

    this.collideSound && this.collideSound.playSprite("collide");

  };

  MakeBreakApp.prototype.onCollisionEnd = function(matterBodyA, matterBodyB){
    var idA = matterBodyA.label;
    var idB = matterBodyB.label;
    var bodyA = bodies[idA];
    var bodyB = bodies[idB];

    if (bodyA === undefined || bodyB === undefined) return;

    // check for environment
    if (bodyA.isEnvironment()) {
      bodyB.onEnvironmentLeave(bodyA);
      return;
    }
    if (bodyB.isEnvironment()) {
      bodyA.onEnvironmentLeave(bodyB);
      return;
    }
  };

  MakeBreakApp.prototype.onGameCreate = function(_game){
    game = _game;
    game.matter.world.setBounds(0, 0, w, h);

    $domContainer = $canvas.children('div').first();
    if (!$domContainer.length) console.log("Could not find DOM container!");
    bodies = {};
    _.each(objects, function(props){
      var obj = _.clone(props);
      if (obj.physicalProperties) obj.physicalProperties = _.extend({}, physicalProperties, obj.physicalProperties);
      var count = obj.count;
      if (count && count > 0) {
        _.times(count, function(i){
          var body = new Body(_.extend({}, obj, {index: i, game: game, $container: $domContainer}));
          bodies[body.id] = body;
        });
      }
    });

    game.matter.add.mouseSpring();

    // We need to add extra pointers, as we only get 1 by default
    game.input.addPointer(opt.inputsAllowed-1);

    app.loadGUI();
    app.loadListeners();
  };

  MakeBreakApp.prototype.onGUIChange = function(){

  };

  MakeBreakApp.prototype.onGameUpdate = function(){

  };

  MakeBreakApp.prototype.parseObjects = function(propList){
    return propList;
    // var pairs = _.map(propList, function(p){ return [p.id, p]; });
    // var lookup = _.object(pairs)
    //
    // var parsedList = _.map(propList, function(p){
    //   if (p.canCreate && p.canCreate.length) {
    //     var canCreateObjects = [];
    //     _.each(p.canCreate, function(id){
    //       var pfound = lookup[id];
    //       if (pfound) canCreateObjects.push(_.clone(pfound))
    //     });
    //     p.canCreateObjects = canCreateObjects;
    //   }
    //   return p;
    // });
    //
    // return parsedList;
  };

  return MakeBreakApp;

})();

$(function() {
  var app = new MakeBreakApp({});
});
