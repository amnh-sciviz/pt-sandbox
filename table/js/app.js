'use strict';

var TableApp = (function() {

  function TableApp(config) {
    var defaults = {
      scaleFactors: {
        'Abundance': 5.0,
        'Density': 0.5
      }
    };
    this.opt = _.extend({}, defaults, config);

    this.init();
  }

  TableApp.prototype.init = function(){
    var self = this;
    this.currentView = 'default';

    this.pt = new PT({
      onLoad: function(){
        self.loadListeners();
      }
    })
  };

  TableApp.prototype.changeView = function(name){
    var $active = $('.button-view[data-view="'+name+'"]');
    if ($active.hasClass('active')) return;

    $('.button-view').removeClass('active');
    $active.addClass('active');

    if (name !== "default") this.showViewScaled(name);
    else this.showViewDefault();
  };

  TableApp.prototype.loadListeners = function(){
    var self = this;

    $('.button-view').on('click', function(e){
      self.changeView($(this).attr('data-view'), $(this));
    });

    $('.element a').on('click', function(e){
      $(this).toggleClass('active');
    });
  };

  TableApp.prototype.showViewDefault = function(){
    this.pt.setCss({'transform': '', 'opacity': 1.0});
  };

  TableApp.prototype.showViewScaled = function(name){
    var scaleFactor = this.opt.scaleFactors[name];
    var cssList = [];
    _.each(this.pt.elementData, function(d){
      var val = d[name];
      val = Math.sqrt(val);
      var factor = scaleFactor * val;
      factor = Math.max(factor, 0.2);
      cssList.push({'transform': 'scale3d('+factor+','+factor+','+factor+')', 'opacity': 0.8});
    });
    this.pt.setCss(cssList);
  };

  return TableApp;

})();

$(function() {
  var app = new TableApp({});
});
