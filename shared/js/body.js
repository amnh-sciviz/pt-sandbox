'use strict';

var Body = (function() {

  var defaults = {
    id: "none",
    index: 0,
    label: "No label",
    text: "",
    type: "none",
    shape: "default",
    backgroundColor: "#3bc6e7",
    textColor: "#000000",
    width: 60,
    height: 60,
    // matter properties
    physicalProperties: {
      restitution: 0.2, // a.k.a. bounciness; 0 = no bounce
      density: 0.5, // default is 0.001
      friction: 0.9, // default is 0.1
      frictionAir: 0.05 // default is 0.01
    }
  };

  var opt, $container, game, physics, $el, el;
  var physicalProperties, combiners;

  function Body(config) {
    if (config.physicalProperties) config.physicalProperties = _.extend({}, defaults.physicalProperties, config.physicalProperties);
    opt = _.extend({}, defaults, config);
    game = opt.game;
    physics = game.matter;
    $container = opt.$container;
    physicalProperties = opt.physicalProperties;

    this.preload();
    this.create();
  }

  Body.prototype.canCreateCompositeWith = function(bodyB){
    var returnValue = false;

    _.each(combiners, function(c){
      var ids = _.keys(c.combinesWith);
      if (_.contains(ids, bodyB.id)) returnValue = true;
    });

    return returnValue;
  };

  Body.prototype.create = function(){
    var id = opt.id + opt.index;
    this.id = id;
    var className = "body-object " + opt.shape + " " + opt.type + " " + opt.id;
    $el = $('<div id="'+id+'" class="'+className+'" aria-label="'+opt.label+'">'+opt.text+'</div>');

    var styles = {
      "background": opt.backgroundColor,
      "color": opt.textColor
    };
    if (opt.backgroundImage) styles.background = 'url('+opt.backgroundImage+') no-repeat';

    // determine size
    var width = opt.width;
    var height = opt.height;
    if (opt.radius) {
      width = opt.radius * 2;
      height = opt.radius * 2;
    }
    styles.width = width + "px";
    styles.height = height + "px";
    if (_.contains(['circle', 'square', 'rectangle'], opt.shape)) styles.lineHeight = height + "px";

    // determine position
    var radius = Math.max(width, height) * 0.5;
    var cw = $container.width();
    var ch = $container.height();
    var x = Phaser.Math.Between(radius, cw-radius);
    var y = Phaser.Math.Between(radius, ch-radius);
    if (opt.x) x = opt.x;
    if (opt.y) y = opt.y;
    if (opt.rx) x = cw * opt.rx;
    if (opt.ry) y = ch * opt.ry;

    // set styles
    $el.css(styles);

    // add element to container
    $container.append($el);
    el = game.add.dom(x, y, "#"+id);
    physics.add.gameObject(el, physicalProperties);

    // set hit area
    if (_.contains(['circle', 'default'], opt.shape)) el.setCircle();

    // make everything render on top of environments
    if (opt.type !== "environment") el.depth = 10;

    el.body.label = id;
    this.$el = $el;
    // console.log(el)
    // this.matterBody = el.body;
  };

  Body.prototype.preload = function(){
    // figure out logic for compositions
    combiners = [];
    if (opt.canCreateObjects && opt.canCreateObjects.length) {
      _.each(opt.canCreateObjects, function(obj){
        if (obj.composition) {
          var isCentroid = false;
          var combinesWith = {};
          var count = 1;
          _.each(obj.composition, function(el){
            if (el.id === opt.id) {
              count = el.count;
              if (el.centroid) isCentroid = true;
            } else if (el.id !== opt.id) {
              combinesWith[el.id] = el.count;
            }
          });
          combiners.push({
            isCentroid: isCentroid,
            count: count,
            combinesWith: combinesWith
          });
        }
      });
    }
    this.combiners = combiners;
  };

  return Body;

})();
