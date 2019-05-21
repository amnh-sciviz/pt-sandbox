'use strict';

var PhysicsApp = (function() {

  var opt, $canvas, w, h, game;

  function PhysicsApp(config) {
    var defaults = {
      el: '#canvas',
      objects: 20,
      restitution: 0.2, // a.k.a. bounciness; 0 = no bounce
      density: 0.5, // default is 0.001
      friction: 0.9, // default is 0.1
      frictionAir: 0.05,// default is 0.01
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  PhysicsApp.prototype.init = function(){
    $canvas = $(opt.el);
    w = $canvas.width();
    h = $canvas.height();

    this.loadGame();
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

  PhysicsApp.prototype.onGameCreate = function(ctx){
    ctx.matter.world.setBounds(0, 0, w, h);

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
          ctx.matter.add.polygon(x, y, sides, radius, { restitution: opt.restitution, density: opt.density, friction: opt.friction, frictionAir: opt.frictionAir });
      } else {
          ctx.matter.add.rectangle(x, y, objW, objH, { restitution: opt.restitution, density: opt.density, friction: opt.friction, frictionAir: opt.frictionAir });
      }
    }

    ctx.matter.add.mouseSpring();
  };

  PhysicsApp.prototype.onGameUpdate = function(){

  };

  return PhysicsApp;

})();

$(function() {
  var app = new PhysicsApp({});
});
