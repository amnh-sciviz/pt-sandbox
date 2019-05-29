'use strict';

var BodyComposite = (function() {

  var defaults = {
    id: "composite",
    index: 0,
    label: "No label",
    type: "composite",
    connectorLen: 1.0 // as a sum of two bodies' radii
  };

  var opt, $container, game, physics, $el, el;
  var bodies, centroid;

  function BodyComposite(config) {
    opt = _.extend({}, defaults, config);
    game = opt.game;
    physics = game.matter;
    $container = opt.$container;
    bodies = opt.bodies;

    if (bodies.length < 2) {
      console.log("Composite must be at least two bodies");
      return false;
    }

    this.create();
  }

  BodyComposite.prototype.create = function(){
    var id = opt.id + opt.index;
    this.id = id;
    var className = "body-composite-object " + " " + opt.id;
    $el = $('<div id="'+id+'" class="'+className+'" aria-label="'+opt.label+'"></div>');
    this.$el = $el;

    // we assume first body is the center
    centroid = bodies.shift();
    var bcount = bodies.length;
    var cwidth = centroid.$el.width();
    var cheight = centroid.$el.height();

    // determine the height and width of composite
    var widths = [cwidth];
    var heights = [cheight];
    _.each(bodies, function(b, i){
      var bwidth = b.$el.width();
      var bheight = b.$el.height();
      widths.push(bwidth);
      heights.push(bheight);
    });
    var width = cwidth;
    var height = Math.max(heights);
    var wmean = Phaser.Math.Average(widths)
    var connectorLen = wmean * 0.5 * opt.connectorLen;
    // straight, horizontal connection for 3 or 2 bodies
    if (bcount <= 2) {
      width = wmean * (bcount+1) + connectorLen * bcount;
    // otherwise, make a circle around the centroid
    } else {
      width = wmean * 3 + connectorLen * 2;
      height = width;
    }

    // add the centroid at the center of the container
    var $centroid = centroid.$el.clone();
    var cstyles = {
      transform: '',
      left: "50%",
      top: "50%",
      marginTop: -(cheight*0.5)+"px",
      marginLeft: -(cwidth*0.5)+"px"
    };
    var cx = width * 0.5;
    var cy = height * 0.5;
    if (bodies.length <= 1) {
      cstyles.marginLeft = 0;
      cstyles.left = 0;
      cx = cwidth * 0.5;
    }
    $centroid.css(cstyles);
    $el.append($centroid);

    // add the remainder of the bodies to the container
    var radianStep = 2.0 * Math.PI / bcount;
    var radians = 0;
    _.each(bodies, function(b, i){
      var $body = b.$el.clone();
      var bw = $body.width();
      var bh = $body.height();
      var bstyles = {
        left: -(bw*0.5)+"px",
        top: -(bh*0.5)+"px"
      };
      var distance = width * 0.5 - bw * 0.5;
      var p = RotateAroundDistance(new Phaser.Geom.Point(0, 0), cx, cy, radians, distance);
      radians += radianStep;
      bstyles.transform = 'translate3d('+p.x+'px, '+p.y+'px, 0)';
      $body.css(bstyles);
      $el.append($body);
    });

    // add element to container
    $container.append($el);

    // TODO: inherit position, velocity, and physical properties from bodies

    el = game.add.dom(x, y, "#"+id);
    physics.add.gameObject(el, physicalProperties);

    // set hit area
    el.setCircle();

    el.body.label = id;
    // console.log(el)
  };

  return BodyComposite;

})();
