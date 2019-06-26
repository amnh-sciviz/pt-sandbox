'use strict';

var Electron = (function() {

  var defaults = {};

  function Electron(config) {
    this.opt = _.extend({}, defaults, config);

    this.init();
  }

  Electron.prototype.init = function(){
  };

  return Electron;

})();
