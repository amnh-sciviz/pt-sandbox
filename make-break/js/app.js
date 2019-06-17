'use strict';

var MakeBreakApp = (function() {

  var app, opt, $canvas, w, h, phaserGame, game, gui;
  var bodies, objects, objectLookup, physicalProperties, $domContainer;
  var $toolbar;

  function MakeBreakApp(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      inputsAllowed: 5,
      physicalProperties: {
        restitution: 0.5, // a.k.a. bounciness; 0 = no bounce
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
    $toolbar = $("#toolbar");
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

  MakeBreakApp.prototype.addObject = function(props) {
    var obj = _.clone(props);
    if (obj.physicalProperties) obj.physicalProperties = _.extend({}, physicalProperties, obj.physicalProperties);
    var body = new Body(_.extend({}, obj, {game: game, $container: $domContainer}));
    bodies[body.id] = body;
  };

  MakeBreakApp.prototype.loadGame = function(){
    phaserGame = new Phaser.Game({
      type: Phaser.WEBGL,
      width: w,
      height: h,
      parent: $canvas.attr("id"),
      transparent: true,
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: false
        }
      },
      dom: {
        createContainer: true,
        // behindCanvas: true
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

    // console.log(phaserGame)
    // console.log(game)
    // gui.add(game.matter.config, 'debug');

    var onUpdate = function(){ app.onGUIChange(); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });
  };

  MakeBreakApp.prototype.loadListeners = function(){
    game.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
      // console.log('collision start')
      // console.log(bodyA, bodyB)
      // console.log('a', bodyA.velocity)
      // console.log('b', bodyB.velocity)
      app.onCollision(bodyA, bodyB);
    });
    game.matter.world.on('collisionend', function (event, bodyA, bodyB) {
      // console.log('collision end')
      app.onCollisionEnd(bodyA, bodyB);
    });

    $canvas.on('touchstart', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      app.onTouchStart(e.changedTouches);
    });

    $canvas.on('touchmove', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      app.onTouchMove(e.changedTouches);
    });

    $canvas.on('touchend', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      app.onTouchEnd(e.changedTouches);
    });


    $canvas.on('mousedown', '.body-object', function(e){
      e.preventDefault();
      app.onMouseStart(e);
    });
    $(document).on('mousemove', function(e){
      app.onMouseMove(e);
    });
    $(document).on('mouseup', function(e){
      app.onMouseEnd(e);
    });

    $('.add-element').on('click', function(e){
      e.preventDefault();
      var velocity = {
        x: Phaser.Math.Between(-3, 3),
        y: 10.0
      }
      var props = _.extend({}, objectLookup[$(this).attr('data-id')], {x: e.pageX, y: e.pageY, velocity: velocity});
      app.addObject(props);
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

    // callback right before collision
    bodyA.onCollision(bodyB);
    bodyB.onCollision(bodyA);

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
      var count = props.count;
      if (count && count > 0) {
        _.times(count, function(i){
          var obj = _.clone(props);
          if (obj.type === "environment") {
            obj.width = w * obj.rw;
            obj.height = h * obj.rh;
            obj.x = w * 0.5;
            obj.y = h - obj.height * 0.5;
          } else {
            obj.y = Phaser.Math.Between(h*0.05, h*0.5);
          }
          app.addObject(obj, count);
        });
      }
      // add buttons if elements
      if (props.type === "element") {
        $toolbar.append($('<a href="#" class="add-element button button-'+props.id+'" data-id="'+props.id+'">Add '+props.label+'</a>'))
      }
    });

    game.matter.add.mouseSpring();
    // We need to add extra pointers, as we only get 1 by default
    // game.input.addPointer(opt.inputsAllowed-1);

    app.loadListeners();
    app.loadGUI();

  };

  MakeBreakApp.prototype.onGUIChange = function(){

  };

  MakeBreakApp.prototype.onGameUpdate = function(){
    // console.log(physicalProperties)
    _.each(bodies, function(body, id){
      body.update(physicalProperties);
    });
  };

  MakeBreakApp.prototype.onMouseEnd = function(e){
    if (!this.currentElId) return;
    bodies[this.currentElId].onTouchEnd(0, e.clientX, e.clientY, new Date().getTime());
    this.currentElId = false;
  };

  MakeBreakApp.prototype.onMouseMove = function(e){
    if (!this.currentElId) return;
    bodies[this.currentElId].onTouchMove(0, e.clientX, e.clientY, new Date().getTime());
  };

  MakeBreakApp.prototype.onMouseStart = function(e){
    var elId = e.target.dataset.id;
    bodies[elId].onTouchStart(0, e.clientX, e.clientY, new Date().getTime());
    this.currentElId = elId;
  };


  MakeBreakApp.prototype.onTouchEnd = function(touches){
    _.each(touches, function(t){
      if (t.target && t.target.tagName==="A") {
        var elId = t.target.dataset.id;
        var id = t.identifier !== undefined ? t.identifier: 0;
        // console.log(t)
        bodies[elId].onTouchEnd(id, t.clientX, t.clientY, new Date().getTime());
      }
    });
  };

  MakeBreakApp.prototype.onTouchMove = function(touches){
    _.each(touches, function(t){
      if (t.target && t.target.tagName==="A") {
        var elId = t.target.dataset.id;
        var id = t.identifier !== undefined ? t.identifier: 0;
        // console.log(t)
        bodies[elId].onTouchMove(id, t.clientX, t.clientY, new Date().getTime());
      }
    });
  };

  MakeBreakApp.prototype.onTouchStart = function(touches){
    _.each(touches, function(t){
      if (t.target && t.target.tagName==="A") {
        var elId = t.target.dataset.id;
        var id = t.identifier !== undefined ? t.identifier: 0;
        // console.log(t)
        bodies[elId].onTouchStart(id, t.clientX, t.clientY, new Date().getTime());
      }
    });
  };

  MakeBreakApp.prototype.parseObjects = function(propList){
    return propList;
  };

  return MakeBreakApp;

})();

$(function() {
  var app = new MakeBreakApp({});
});
