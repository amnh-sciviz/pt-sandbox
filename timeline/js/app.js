'use strict';

var TimelineApp = (function() {

  function TimelineApp(config) {
    var defaults = {
      sliderEl: '#year-slider',
      yearEl: '#year',
      countEl: '#count'
    };
    this.opt = _.extend({}, defaults, config);

    this.init();
  }

  TimelineApp.prototype.init = function(){
    var self = this;
    this.$slider = $(this.opt.sliderEl);
    this.$year = $(this.opt.yearEl);
    this.$count = $(this.opt.countEl);

    this.loadEras();

    this.pt = new PT({
      configUrl: '../table/config.json',
      contentUrl: '../table/content.json',
      dataUrl: '../table/data/elements.csv',
      onLoad: function(){
        self.loadColors();
        self.loadListeners();
        self.$slider.trigger('input');
      }
    });

  };

  TimelineApp.prototype.loadColors = function(){
    var eras = this.eras;
    this.pt.elementData = _.map(this.pt.elementData, function(d){
      var color = '#444444';
      _.each(eras, function(era){
        if (d.Year >= era.start && d.Year < era.end) {
          color = era.color;
        }
      });
      d.color = color;
      return d;
    });
  };

  TimelineApp.prototype.loadEras = function(){
    var $eras = $('.era');
    var eras = $eras.map(function(){
      var $era = $(this);
      return {
        $el: $era,
        start: parseInt($era.attr('data-start')),
        end: parseInt($era.attr('data-end')),
        color: $era.css('background-color')
      }
    });
    eras = _.sortBy(eras, 'start');
    var minYear = eras[0].start;
    var maxYear = eras[eras.length-1].end;
    console.log('Year range', minYear, maxYear);
    _.each(eras, function(era){
      var width = ((era.end-era.start) / (maxYear-minYear) * 100) + '%';
      era.$el.css('width', width);
    })
    this.eras = eras;
    this.minYear = minYear;
    this.minVisibleYear = eras[0].end + 1;
    this.maxYear = maxYear;
  };

  TimelineApp.prototype.loadListeners = function(){
    var self = this;

    this.$slider.on('input', function(e){
      self.onYearChange(parseInt($(this).val()));
    });
  };

  TimelineApp.prototype.onYearChange = function(year){
    var cssList = [];
    var visibleCount = 0;
    _.each(this.pt.elementData, function(d){
      var dyear = d.Year;
      var css = {background: '#444444', opacity: 0.5};
      if (year >= dyear) {
        css.background = d.color;
        css.opacity = 1.0;
        visibleCount++;
      }
      cssList.push(css);
    });
    this.pt.setCss(cssList, '$a');

    if (year >= this.minVisibleYear) {
      this.$year.text(year);
    } else {
      this.$year.text('Before '+this.minVisibleYear);
    }

    this.$count.text(visibleCount);
  };

  return TimelineApp;

})();

$(function() {
  var app = new TimelineApp({});
});
