'use strict';

var Atom = (function() {

  var defaults = {};

  function Atom(config) {
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Atom.prototype.init = function(){
    this.id = _.uniqueId();
    this.game = opt.game;
    this.$container = opt.$container;

    this.create();
  };

  Atom.prototype.create = function(){
    var opt = this.opt;
    var className = "object atom " + opt.symbol + " " + opt.group.id;
    // html template
    var html = '';
    html += '<div id="'+this.id+'" class="object-wrapper">';
      html += '<div class="animator">';
        html += '<a href="#" class="'+className+'" aria-label="'+opt.name+'" data-id="'+this.id+'">'+opt.symbol+'</a>';
      html += '</div>';
    html += '</div>';
    // create element
    var $el = $(html);

    // add electrons
    var electrons = [];
    var $electrons = $('<div class="electrons"></div>');
    _.times(opt.valenceElectrons, function(i){
      var electron = new Electron({index: i, $container: $electrons, valenceElectrons: opt.valenceElectrons});
      electrons.push(electron);
    });
    $el.find(".animator").prepend($electrons);

    this.$electrons = $electrons;
    this.electrons = electrons;
    this.$el = $el;
  };

  Atom.prototype.onTouchEnd = function(id, x, y, time) {
    if (id !== this.touchId) return; // check if this is the same touch as when touch started
    this.el.setVelocity(this.velocityX, this.velocityY); // manually set velocity to "fling" body
    this.touchId = false;
  };

  Atom.prototype.onTouchMove = function(id, x, y, time) {
    if (id !== this.touchId) return; // check if this is the same touch as when touch started

    // move body based on delta from start
    var dx = x - this.touchStartPosition.x;
    var dy = y - this.touchStartPosition.y;
    var elX = this.bodyStartPosition.x + dx;
    var elY = this.bodyStartPosition.y + dy;

    this.el.setPosition(elX, elY);

    // calculate velocity
    var deltaT = time - this.lastTouchTime;
    if (deltaT > 0) {
      dx = x - this.lastTouchPosition.x;
      dy = y - this.lastTouchPosition.y;
      this.velocityX = Phaser.Math.Clamp(dx / deltaT * 10, -100, 100);
      this.velocityY = Phaser.Math.Clamp(dy / deltaT * 10, -100, 100);
      // keep track of last time and position for velocity calculation
      this.lastTouchTime = time;
      this.lastTouchPosition = { x: x, y: y };
    }
  };

  Atom.prototype.onTouchStart = function(id, x, y, time) {
    // console.log('start '+id);
    // keep track of touch start time/position
    this.touchId = id;
    this.touchStartTime = time;
    this.touchStartPosition = { x: x, y: y };
    // keep track of body start position
    var pos = this.el.body.position;
    this.bodyStartPosition = { x: pos.x, y: pos.y };
    // keep track of last time and position for velocity calculation
    this.lastTouchTime = time;
    this.lastTouchPosition = this.touchStartPosition;
    this.velocityX = 0;
    this.velocityY = 0;
  };

  return Atom;

})();
