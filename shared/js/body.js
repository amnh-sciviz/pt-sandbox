'use strict';

var Body = (function() {

  var defaults = {
    name: "Carbon",
    label: "C",
    color: "#cd9809",
    textColor: "#000000",
    x: 0,
    y: 0,
    radius: 20,
    sheetName: false,
    spriteName: false,
    matterProperties: {
      restitution: 0.2, // a.k.a. bounciness; 0 = no bounce
      density: 0.5, // default is 0.001
      friction: 0.9, // default is 0.1
      frictionAir: 0.05 // default is 0.01
    }
  };

  var opt, matter;

  function Body(config) {
    opt = _.extend({}, defaults, config);
    matter = opt.matter;

    this.create();
  }

  Body.prototype.create = function(){

  };

  return Body;

})();
