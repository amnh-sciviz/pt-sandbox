'use strict';

var Molecule = (function() {

  var defaults = {};

  function Molecule(config) {
    this.opt = _.extend({}, defaults, config);

    this.init();
  }

  Molecule.prototype.init = function(){
  };

  return Molecule;

})();
