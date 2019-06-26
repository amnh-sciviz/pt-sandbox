'use strict';

var TouchManager = (function() {
  function TouchManager(options) {
    var defaults = {
      "el": "#canvas",
      "touchClass": "touchable",
      "onTouchStart": function(id, elId, x, y, t){ console.log("Touch start "+elId); },
      "onTouchMove": function(id, elId, x, y, t){ console.log("Touch move "+elId); },
      "onTouchEnd": function(id, elId, x, y, t){ console.log("Touch end "+elId); }
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  function hasClass(el, className){
    if (el.classList)
      el.classList.contains(className);
    else
      new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  }

  TouchManager.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.loadListeners();
  };

  TouchManager.prototype.getValidTouches = function(touches){
    var opt = this.opt;
    var touchedEls = {};
    var foundTouches = false;
    var time = _.now();

    _.each(touches, function(t){
      if (t.target && hasClass(t.target, opt.touchClass)) {
        var elId = t.target.dataset.id;
        var id = t.identifier !== undefined ? t.identifier: 0;
        // console.log(t)
        touchedEls[elId] = {
          id: id,
          x: t.clientX,
          y: t.clientY,
          time: time
        };
        foundTouches = true;
      }
    });

    return foundTouches ? touchedEls : false;
  };

  TouchManager.prototype.loadListeners = function(){
    var _this = this;
    var $el = this.$el;

    // touch listeners
    $el.on('touchstart', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      _this.onTouchStart(e.changedTouches);
    });
    $el.on('touchmove', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      _this.onTouchMove(e.changedTouches);
    });
    $el.on('touchend', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      _this.onTouchEnd(e.changedTouches);
    });

    // mouse drag listeners
    $el.on('mousedown', "."+this.opt.touchClass, function(e){
      e.preventDefault();
      _this.onMouseStart(e);
    });
    $(document).on('mousemove', function(e){
      _this.onMouseMove(e);
    });
    $(document).on('mouseup', function(e){
      _this.onMouseEnd(e);
    });
  };

  TouchManager.prototype.onMouseEnd = function(e){
    if (!this.currentElId) return;
    var validTouches = {};
    validTouches[this.currentElId] = { id: 0, x: e.clientX, y: e.clientY, time: _.now() };
    this.opt.onTouchEnd(validTouches);
    this.currentElId = false;
  };

  TouchManager.prototype.onMouseMove = function(e){
    if (!this.currentElId) return;
    var validTouches = {};
    validTouches[this.currentElId] = { id: 0, x: e.clientX, y: e.clientY, time: _.now() };
    this.opt.onTouchMove(validTouches);
  };

  TouchManager.prototype.onMouseStart = function(e){
    var elId = e.target.dataset.id;
    var validTouches = {};
    validTouches[elId] = { id: 0, x: e.clientX, y: e.clientY, time: _.now() };
    this.opt.onTouchStart(validTouches);
    this.currentElId = elId;
  };

  TouchManager.prototype.onTouchEnd = function(touches){
    var validTouches = this.getValidTouches(touches);
    if (validTouches) opt.onTouchEnd(validTouches);
  };

  TouchManager.prototype.onTouchMove = function(touches){
    var validTouches = this.getValidTouches(touches);
    if (validTouches) opt.onTouchMove(validTouches);
  };

  TouchManager.prototype.onTouchStart = function(touches){
    var validTouches = this.getValidTouches(touches);
    if (validTouches) opt.onTouchStart(validTouches);
  };

  return TouchManager;

})();
