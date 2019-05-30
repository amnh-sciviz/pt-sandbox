'use strict';

var Body = (function() {

  var defaults = {
    id: "none",
    index: 0,
    label: "No label",
    text: "",
    type: "none",
    shape: "circle",
    // matter properties
    physicalProperties: {
      restitution: 0.5, // a.k.a. bounciness; 0 = no bounce
      density: 0.001, // default is 0.001
      friction: 0.4, // default is 0.1
      frictionAir: 0.05 // default is 0.01
    }
  };

  var $container, game, physics;

  function Body(config) {
    if (config.physicalProperties) config.physicalProperties = _.extend({}, defaults.physicalProperties, config.physicalProperties);
    var opt = _.extend({}, defaults, config);

    // globals
    game = opt.game;
    physics = game.matter;
    $container = opt.$container;

    this.physicalProperties = _.clone(opt.physicalProperties);
    this.reactsWith = _.clone(opt.reactsWith);
    this.composition = _.clone(opt.composition);
    this.reactId = opt.id;
    this.environment = "none";
    this.opt = opt;

    this.create();
  }

  Body.prototype.combineWith = function(bodyB, objects){
    var reactsWith = this.reactsWith;

    if (!reactsWith) return false;
    var reaction = reactsWith[bodyB.reactId];
    // console.log(reactsWith, bodyB.reactId);
    if (reaction === undefined) return false;

    // check to see if this reaction happens in this environment
    if (_.isObject(reaction)) {
      if (reaction[this.environment] === undefined) return false;
      reaction = reaction[this.environment];
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
    var className = "body-object " + opt.shape + " " + opt.type + " " + opt.id;
    var $el = $('<div id="'+id+'" class="body-object-wrapper"><div class="'+className+'" aria-label="'+opt.label+'">'+opt.text+'</div></div>');

    // set styles
    var styles = {};
    if (opt.backgroundColor) styles.background = opt.backgroundColor;
    if (opt.textColor) styles.color = opt.textColor;
    if (opt.backgroundImage) styles.backgroundImage = 'url('+opt.backgroundImage+')';
    if (opt.width) styles.width = opt.width + "px";
    if (opt.height) styles.height = opt.height + "px";
    if (opt.radius) {
      height = opt.radius * 2;
      styles.width = (opt.radius * 2) + "px";
      styles.height = (opt.radius * 2) + "px";
    }
    if (styles.height) styles.lineHeight = styles.height;
    $el.css(styles);

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
    $container.append($el);
    var el = game.add.dom(x, y, "#"+id);
    // console.log(physicalProperties)
    physics.add.gameObject(el, this.physicalProperties);

    // set hit area
    if (_.contains(['circle', 'default'], opt.shape)) el.setCircle();
    // el.applyForce({x: 100, y: 100});

    // make everything render on top of environments
    if (opt.type !== "environment") el.depth = 10;

    el.body.label = id;
    this.$el = $el;
    this.el = el;
    // console.log(el)
    this.matterBody = el.body;

    if (opt.angle) el.setAngle(opt.angle);
    if (opt.angularVelocity) el.setAngularVelocity(opt.angularVelocity);
    if (opt.velocity) el.setVelocity(opt.velocity.x, opt.velocity.y);
  };

  Body.prototype.destroyBody = function(){
    this.el.destroy();
  };

  return Body;

})();
