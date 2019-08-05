'use strict';

var Body = (function() {

  var defaults = {
    id: "none",
    index: 0,
    label: "No label",
    text: "",
    type: "none",
    shape: "circle",
    weight: 0.5,
    // matter properties
    physicalProperties: {}
  };

  var $container, game, physics;

  function Body(config) {
    config.physicalProperties = _.extend({}, defaults.physicalProperties, config.physicalProperties);
    var opt = _.extend({}, defaults, config);

    // globals
    game = opt.game;
    physics = game.matter;
    $container = opt.$container;

    this.physicalProperties = _.clone(opt.physicalProperties);
    this.reactsWith = _.clone(opt.reactsWith);
    this.composition = opt.composition;
    this.reactId = opt.id;
    this.bodyType = opt.type;
    this.environment = "none";
    this.opt = opt;

    this.create();
    this.loadListeners();
  }

  Body.prototype.breakApart = function(objects){
    var newBodies = [];

    if (!this.composition || !this.composition.length) return [];

    var mBody = this.matterBody;
    var x = mBody.position.x;
    var y = mBody.position.y;
    var w = this.el.width;
    var h = this.el.height;
    var radius = Math.max(w, h) * 0.5;
    var u = mBody.velocity.x;
    var v = mBody.velocity.y;
    var physicalProperties = _.clone(this.physicalProperties);

    _.each(this.composition, function(part){
      var id = part.id;
      var props = objects[id];
      if (props === undefined) return;
      var count = part.count ? part.count : 1;
      var rx = radius * Math.random();
      var ry = radius * Math.random();
      _.times(count, function(i){
        var newObject  = _.clone(props);
        newObject.physicalProperties = _.extend({}, physicalProperties, newObject.physicalProperties);
        var newBody = new Body(_.extend({}, newObject, {
          game: game,
          $container: $container,
          x: x + rx,
          y: y + ry,
          velocity: { x: u, y: v }
        }));
        newBodies.push(newBody);
      });
    });

    // delete existing body
    this.destroyBody();

    return newBodies;
  };

  Body.prototype.breakWith = function(bodyB, objects){
    var compositionA = this.composition;
    var compositionB = bodyB.composition;

    // check if we're the same and are made up of other bodies
    if (!compositionA || !compositionB || this.reactId !== bodyB.reactId) return false;

    // delete the existing bodies
    var newBodiesA = this.breakApart(objects);
    var newBodiesB = bodyB.breakApart(objects);

    return newBodiesA.concat(newBodiesB);
  };

  Body.prototype.combineWith = function(bodyB, objects){
    var reactsWith = this.reactsWith;

    if (!reactsWith) return false;
    var reaction = reactsWith[bodyB.reactId];
    // console.log(reactsWith, bodyB.reactId);
    if (reaction === undefined) return false;

    // check to see if this reaction happens in this environment
    if (_.isObject(reaction)) {
      var envA = this.environment;
      var envB = bodyB.environment;
      var env = envA !== "none" ? envA : envB;
      if (reaction[env] === undefined) return false;
      reaction = reaction[env];
    }

    // retrieve new object
    var newObject = _.clone(objects[reaction]);
    if (newObject === undefined) return false;

    var mBodyA = this.matterBody;
    var mBodyB = bodyB.matterBody;

    // determine position and velocity of new object
    // var magA = Math.sqrt(mBodyA.velocity.x*mBodyA.velocity.x + mBodyA.velocity.y*mBodyA.velocity.y);
    // var magB = Math.sqrt(mBodyB.velocity.x*mBodyB.velocity.x + mBodyB.velocity.y*mBodyB.velocity.y);
    // var fasterBody = magA > magB ? mBodyA : mBodyB;
    // var slowerBody = magA > magB ? mBodyB : mBodyA;
    // var x = slowerBody.position.x;
    // var y = slowerBody.position.y;
    var x = Phaser.Math.Average([mBodyA.position.x, mBodyB.position.x]);
    var y = Phaser.Math.Average([mBodyA.position.y, mBodyB.position.y]);
    var angle = Phaser.Math.Average([mBodyA.angle, mBodyB.angle]);
    var angularVelocity = Phaser.Math.Average([mBodyA.angularVelocity, mBodyB.angularVelocity]);
    var u = Phaser.Math.Average([mBodyA.velocity.x, mBodyB.velocity.x]);
    var v = Phaser.Math.Average([mBodyA.velocity.y, mBodyB.velocity.y]);

    // delete the existing bodies
    this.destroyBody();
    bodyB.destroyBody();

    // create new body
    var physicalProperties = _.clone(this.physicalProperties);
    newObject.physicalProperties = _.extend({}, physicalProperties, newObject.physicalProperties);
    var newBody = new Body(_.extend({}, newObject, {
      game: game,
      $container: $container,
      x: x,
      y: y,
      angle: angle,
      angularVelocity: angularVelocity,
      velocity: { x: u, y: v }
    }));

    return newBody;

  };

  Body.prototype.create = function(){
    var opt = this.opt;
    var index = opt.index > 0 ? opt.index : Math.round(Math.random() * 99999999999);
    var id = opt.id + index;
    this.id = id;

    var $el = $(this.opt.html);
    var $wrapper = $('<div id="'+id+'" class="body-object-wrapper"><div class="animator"></div><a href="#" class="hit-area" data-id="'+id+'"></a></div>');
    $wrapper.find(".animator").append($el);

    // determine position
    var cw = $container.width();
    var ch = $container.height();
    var radius = Math.max(cw, ch) * 0.05;

    var x = Phaser.Math.Between(radius, cw-radius);
    var y = Phaser.Math.Between(radius, ch-radius);
    if (opt.x) x = opt.x;
    if (opt.y) y = opt.y;
    if (opt.rx) x = cw * opt.rx;
    if (opt.ry) y = ch * opt.ry;

    // add element to container
    $container.append($wrapper);
    var el = game.add.dom(x, y, "#"+id);
    // console.log(this.physicalProperties)
    physics.add.gameObject(el, this.physicalProperties);

    // set hit area
    if (_.contains(['circle', 'default'], opt.shape)) el.setCircle();
    // el.applyForce({x: 100, y: 100});

    // make everything render on top of environments
    if (this.bodyType !== "environment") el.depth = 10;

    el.body.label = id;
    this.$el = $el;
    this.$hitArea = $wrapper.find(".hit-area");
    this.el = el;

    this.matterBody = el.body;

    if (opt.angle) el.setAngle(opt.angle);
    if (opt.angularVelocity) el.setAngularVelocity(opt.angularVelocity);
    if (opt.velocity) el.setVelocity(opt.velocity.x, opt.velocity.y);

    // console.log(this.physicalProperties)
    this.update(this.physicalProperties);
    // console.log(el)
  };

  Body.prototype.destroyBody = function(){
    this.mc.off("panstart panmove panend tap pinchin pinchout");
    this.mc.destroy();
    this.el.destroy();
  };

  Body.prototype.getWeight = function(){
    return this.opt.weight;
  };

  Body.prototype.isEnvironment = function(){
    return this.bodyType === "environment";
  };

  Body.prototype.isDragging = function(){
    return this.touchId !== undefined && this.touchId !== false;
  };

  Body.prototype.loadListeners = function(){
    var _this = this;
    var el = this.$hitArea[0];
    var mc = new Hammer(el);

    mc.on("panstart", function(e){
      _this.onDragStart(e.center.x, e.center.y, new Date().getTime());
    });

    mc.on("panmove", function(e){
      _this.onDragMove(e.center.x, e.center.y, new Date().getTime());
    });

    mc.on("panend", function(e){
      _this.onDragEnd(e.center.x, e.center.y, new Date().getTime());
    });
    mc.on("pinchin", function(e){
      _this.onPinchIn();
    });

    mc.on("pinchout", function(e){
      _this.onPinchOut();
    });

    mc.on("tap", function(e){
      _this.onTap();
    });

    this.mc = mc;
  };

  Body.prototype.onCollision = function(bodyB){
    // we only care about the case where I am being dragged and the other body is not
    if (!this.isDragging() || bodyB.isDragging()) return false;

    // set velocity to dragged velocity
    // this.el.setVelocity(this.velocityX, this.velocityY);

    // apply the force from the drag event and release the touch
    // console.log("applying force", this.velocityX, this.velocityY)
    // bodyB.el.applyForceFrom(this.matterBody.position, {x: this.velocityX, y: this.velocityY});
    bodyB.el.setVelocity(this.velocityX, this.velocityY);
    // this.touchId = false;
  };

  Body.prototype.onEnvironmentEnter = function(env){
    this.environment = env.reactId;
    this.$el.addClass(env.reactId);
  };

  Body.prototype.onEnvironmentLeave = function(env){
    this.environment = "none";
    this.$el.removeClass(env.reactId);
  };

  Body.prototype.onDragEnd = function(x, y, time) {
    // console.log('end '+this.id+' '+x+', '+y);

    // fling based on velocity
    // console.log(this.velocityX, this.velocityY)
    // console.log(this.el)
    this.el.setVelocity(this.velocityX, this.velocityY);
    this.touchId = false;
  };

  Body.prototype.onDragMove = function(x, y, time) {
    // move body based on delta from start
    var dx = x - this.touchStartPosition.x;
    var dy = y - this.touchStartPosition.y;
    var elX = this.bodyStartPosition.x + dx;
    var elY = this.bodyStartPosition.y + dy;

    this.el.setPosition(elX, elY);

    // calculate velocity
    var deltaT = time - this.lastDragTime;
    if (deltaT > 0) {
      dx = x - this.lastDragPosition.x;
      dy = y - this.lastDragPosition.y;
      this.velocityX = Phaser.Math.Clamp(dx / deltaT * 10, -100, 100);
      this.velocityY = Phaser.Math.Clamp(dy / deltaT * 10, -100, 100);
      // keep track of last time and position for velocity calculation
      this.lastDragTime = time;
      this.lastDragPosition = { x: x, y: y };
    }
  };

  Body.prototype.onDragStart = function(x, y, time) {
    // console.log('start '+this.id+' '+x+', '+y);
    // keep track of touch start time/position
    this.touchStartTime = time;
    this.touchStartPosition = { x: x, y: y };
    // keep track of body start position
    var pos = this.matterBody.position;
    this.bodyStartPosition = { x: pos.x, y: pos.y };
    // this.el.setVelocity(0, 0); // finger will control velocity until released
    // keep track of last time and position for velocity calculation
    this.lastDragTime = time;
    this.lastDragPosition = this.touchStartPosition;
    this.velocityX = 0;
    this.velocityY = 0;
  };

  Body.prototype.onPinchIn = function(){
    console.log("Pinch in "+this.id);
  };

  Body.prototype.onPinchOut = function(){
    console.log("Pinch out "+this.id);
  };

  Body.prototype.onTap = function(){
    console.log("Tap "+this.id);
  };

  Body.prototype.update = function(props){
    var el = this.el;
    _.each(props, function(value, key){
      el.body[key] = value;
    });
    this.physicalProperties = _.extend({}, this.physicalProperties, props);
  };

  return Body;

})();
