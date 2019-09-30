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
    attractAngleStep: 1, // in degrees; increase to transition faster
    exciteDistance: 4.0, // distance between valid atoms where they will get excited (in percentage of width)
    // matter properties
    physicalProperties: {},
    supportedEvents: "panstart panmove panend pinchstart pinchmove pinchend rotatestart rotatemove rotateend tap"
  };

  var $container, game, physics;

  function Body(config) {
    config.physicalProperties = _.extend({}, defaults.physicalProperties, config.physicalProperties);
    var opt = _.extend({}, defaults, config);

    // globals
    this.parent = opt.app;
    game = opt.game;
    physics = game.matter;
    $container = opt.$container;

    this.physicalProperties = _.clone(opt.physicalProperties);
    this.reactsWith = _.clone(opt.reactsWith);
    this.composition = opt.composition;
    this.reactId = opt.id;
    this.bodyType = opt.type;
    this.droppable = "none";
    this.opt = opt;
    this.attractingBody = false;
    this.connectAngles = this.opt.connectAngles ? _.mapObject(this.opt.connectAngles, function(deg, key){ return Phaser.Math.DegToRad(deg); }) : {};
    this.attractAngleStep = this.opt.attractAngleStep;
    this.shellRotation = 0;
    this.droppableIds = this.opt.droppable || [];

    this.create();
    this.loadListeners();
  }

  Body.prototype.attractBody = function(body){
    var angle = this.el.body.angle;
    var angleBetween = Phaser.Math.Angle.Between(body.el.x, body.el.y, this.el.x, this.el.y);
    var connectAngle = this.connectAngles[body.reactId];
    // console.log('-----')
    // console.log('angle: '+Phaser.Math.RadToDeg(angle));
    // console.log('angleBetween: '+Phaser.Math.RadToDeg(Phaser.Math.Angle.Normalize(angleBetween)));
    // console.log('connectAngle: '+Phaser.Math.RadToDeg(Phaser.Math.Angle.Normalize(connectAngle)));
    var targetRotateAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Normalize(angleBetween + connectAngle - angle));
    var shellRotation = this.shellRotation;
    var delta = Math.abs(shellRotation-targetRotateAngle);
    // wrap around if necessary
    if (delta > 180 && targetRotateAngle > shellRotation) targetRotateAngle -= 360;
    else if (delta > 180) targetRotateAngle += 360;
    delta = Math.abs(shellRotation-targetRotateAngle);
    if (delta <= this.attractAngleStep) {
      shellRotation = targetRotateAngle;
    } else if (shellRotation > targetRotateAngle) {
      shellRotation -= this.attractAngleStep;
    } else {
      shellRotation += this.attractAngleStep;
    }
    this.$outerShell.css('transform', 'rotateZ('+shellRotation+'deg)');
    this.shellRotation = shellRotation;
  };

  Body.prototype.attractNeighbors = function(){
    var _this = this;
    var validNeighbors = _.values(this.parent.bodies);

    validNeighbors = _.filter(validNeighbors, function(body){
      // must not be self, cannot be attracting another body, must be compatible
      return (body.id !== _this.id && _this.isCompatibleWith(body));
    });

    // determine closest neighbor
    if (validNeighbors.length < 1) return false;
    else if (validNeighbors.length > 1) {
      validNeighbors = _.sortBy(validNeighbors, function(body){
        return _this.distanceTo(body);
      });
    }
    var closestNeighbor = validNeighbors[0];
    this.attractingBody = closestNeighbor;

    var distanceTo = this.distanceTo(closestNeighbor);
    if (distanceTo <= this.exciteDistance) this.makeExcited();
    else this.makeCalm();

    this.attractBody(closestNeighbor);
    closestNeighbor.attractBody(this);
  };

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
    var _this = this;
    var reactsWith = this.reactsWith;

    if (!reactsWith) return false;
    var reaction = reactsWith[bodyB.reactId];
    // console.log(reactsWith, bodyB.reactId);
    if (reaction === undefined) return false;

    // check to see if this reaction happens in this droppable
    if (_.isObject(reaction)) {
      var envA = this.droppable;
      var envB = bodyB.droppable;
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
      app: _this.parent,
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

    // make everything render on top of droppables
    if (this.bodyType !== "droppable") el.depth = 10;
    else el.depth = 5;

    el.body.label = id;
    this.$el = $el;
    this.$hitArea = $wrapper.find(".hit-area");
    this.el = el;
    this.$outerShell = $wrapper.find(".electrons.valence").first();
    this.matterBody = el.body;
    this.exciteDistance = this.opt.exciteDistance * this.el.width;

    this.$scaleLeft = $wrapper.find(".scale-left");
    this.$scaleRight = $wrapper.find(".scale-right");
    this.canScale = this.$scaleLeft.length > 0 && this.$scaleRight.length > 0;

    if (opt.angle) el.setAngle(opt.angle);
    if (opt.angularVelocity) el.setAngularVelocity(opt.angularVelocity);
    if (opt.velocity) el.setVelocity(opt.velocity.x, opt.velocity.y);

    // console.log(this.physicalProperties)
    this.update(this.physicalProperties);
    // console.log(el)
  };

  Body.prototype.destroyBody = function(){
    $container.attr('data-highlight', "");
    this.inputManager.off(this.opt.supportedEvents);
    this.inputManager.destroy();
    this.el.destroy();
  };

  Body.prototype.distanceTo = function(body){
    return Phaser.Math.Distance.Between(this.el.x, this.el.y, body.el.x, body.el.y);
  };

  Body.prototype.getWeight = function(){
    return this.opt.weight;
  };

  Body.prototype.isCompatibleWith = function(body){
    return _.has(this.opt.reactsWith, body.reactId);
  };

  Body.prototype.isDroppable = function(){
    return this.bodyType === "droppable";
  };

  Body.prototype.isDragging = function(){
    return this.dragging;
  };

  Body.prototype.loadListeners = function(){
    if (this.isDroppable()) return;
    var _this = this;
    var el = this.$hitArea[0];
    var inputManager = new Hammer(el);

    inputManager.get('pinch').set({ enable: true });
    inputManager.get('rotate').set({ enable: true });
    inputManager.on(this.opt.supportedEvents, function(e){
      var t = e.type;
      if (t==="panstart") _this.onDragStart(e.center.x, e.center.y, new Date().getTime());
      else if (t==="panmove") _this.onDragMove(e.center.x, e.center.y, new Date().getTime());
      else if (t==="panend") _this.onDragEnd(e.center.x, e.center.y, new Date().getTime());
      else if (_this.canScale && t==="pinchstart") _this.onPinchStart();
      else if (_this.canScale && t==="pinchmove") _this.onPinchMove(e.scale);
      else if (_this.canScale && t==="pinchend") _this.onPinchEnd();
      else if (t==="rotatestart") _this.onRotateStart(e.rotation);
      else if (t==="rotatemove") _this.onRotateMove(e.rotation);
      else if (t==="rotateend") _this.onRotateEnd();
      else if (t==="tap") _this.onTap();
    });

    this.inputManager = inputManager;
  };

  Body.prototype.makeCalm = function(){
    this.$el.removeClass("excited");
  };

  Body.prototype.makeExcited = function(){
    this.$el.addClass("excited");
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

  Body.prototype.onDroppableEnter = function(droppableBody){
    if (droppableBody.$el.hasClass("dropped") || !_.contains(this.droppableIds, droppableBody.reactId)) return false;
    droppableBody.$el.addClass("dropped");
    droppableBody.el.depth = 1;
    this.$el.addClass("dropped");
    this.destroyBody();
    return true;
  };

  Body.prototype.onDroppableLeave = function(droppableBody){
    // this.droppable = "none";
    // this.$el.removeClass(env.reactId);
  };

  Body.prototype.onDragEnd = function(x, y, time) {
    // console.log('end '+this.id+' '+x+', '+y);

    // fling based on velocity
    // console.log(this.velocityX, this.velocityY)
    // console.log(this.el)
    $container.attr('data-highlight', "");
    this.el.setVelocity(this.velocityX, this.velocityY);
    this.dragging = false;
    this.makeCalm();
  };

  Body.prototype.onDragMove = function(x, y, time) {
    this.dragging = true;

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

    // this.attractNeighbors();
  };

  Body.prototype.onDragStart = function(x, y, time) {
    // console.log(this.el);
    // console.log('start '+this.id+' '+x+', '+y);
    // keep track of touch start time/position
    $container.attr('data-highlight', this.reactId);
    this.$el.removeClass("selected");
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
    this.dragging = true;

  };

  Body.prototype.onPinchEnd = function(){
    console.log("Pinch end "+this.id);
    this.$el.removeClass("selected");
    // this.$scaleLeft.css('transform', '');
    // this.$scaleRight.css('transform', '');
  };

  Body.prototype.onPinchMove = function(scale){
    //console.log(scale)
    if (scale > 1.0 && !this.$el.hasClass("selected")) this.$el.addClass("selected");
    else if (scale < 1.0 && this.$el.hasClass("selected")) this.$el.removeClass("selected");
    // var scalePercent = Math.max(scale * 100, 100);
    // this.$scaleLeft.css('transform', 'translate3d(-'+scalePercent+'%, 0, 0)');
    // this.$scaleRight.css('transform', 'translate3d('+scalePercent+'%, 0, 0)');
  };

  Body.prototype.onPinchStart = function(){
    console.log("Pinch start "+this.id);
    // this.$el.addClass("selected");
  };

  Body.prototype.onRotateEnd = function(){
    console.log("Rotate end "+this.id);
    this.$el.removeClass("rotating");
  };

  Body.prototype.onRotateMove = function(rotationDegrees){
    var deltaAngle = Phaser.Math.DegToRad(rotationDegrees - this.startRotation);
    // console.log("Delta", rotationDegrees - this.startRotation)
    this.el.setRotation(Phaser.Math.Angle.Normalize(this.startAngle + deltaAngle));
  };

  Body.prototype.onRotateStart = function(rotationDegrees){
    this.startRotation = rotationDegrees;
    this.startAngle = this.el.rotation;
    console.log("Rotate start "+this.id, this.startRotation, this.startAngle);
    this.$el.addClass("rotating");
  };

  Body.prototype.onTap = function(){
    console.log("Tap "+this.id);
    this.$el.toggleClass("selected");
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
