'use strict';

var TableApp = (function() {

  var app, opt, $canvas, w, h;
  var elementData, currentView;

  function TableApp(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      dataUrl: 'data/elements.csv',
      baseScaleFactor: 5.0, // for abundance, 100% = x the size (e.g. 10x)
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  function loadCSV(filename){
    var promise = $.Deferred();
    Papa.parse(filename, {
      download: true, // async
      header: true, // key by field name
      dynamicTyping: true, // parse numbers
      delimiter: ",",
      complete: function(results) {
        console.log("Finished:", results);
        promise.resolve(results.data);
      }
    });
    return promise;
  }

  TableApp.prototype.init = function(){
    app = this;
    $canvas = $(opt.el);
    w = $canvas.width();
    h = $canvas.height();
    currentView = 'default';

    $.when(
      $.getJSON(opt.configUrl),
      $.getJSON(opt.contentUrl),
      loadCSV(opt.dataUrl)

    ).done(function(config, content, data){
      config = config[0];
      opt = _.extend({}, opt, config);
      console.log('Config and content loaded.');
      elementData = app.parseData(data);
      app.loadUI(elementData);
      app.loadListeners();
    });
  };

  TableApp.prototype.changeView = function(name){
    var $active = $('.button-view[data-view="'+name+'"]');
    if ($active.hasClass('active')) return;

    $('.button-view').removeClass('active');
    $active.addClass('active');

    if (name==="abundance") this.showViewAbundance();
    else this.showViewDefault();
  };

  TableApp.prototype.loadListeners = function(){
    $('.button-view').on('click', function(e){
      app.changeView($(this).attr('data-view'), $(this));
    });
  };

  TableApp.prototype.loadUI = function(data){
    var $table = $('<div class="table"></div>');
    _.each(data, function(d, i){
      var $el = $('<div id="element-'+d.Symbol+'" class="'+d.ClassName+'"></div>');
      var $a = $('<a href="#'+d.Symbol+'" data-index="'+d.index+'"></a>');
      $a.append('<span class="number">'+d.AtomicNumber+'</span>');
      $a.append('<span class="symbol">'+d.Symbol+'</span>');
      $a.append('<span class="name">'+d.Element+'</span>');
      $el.append($a);
      $table.append($el);
      elementData[i].$el = $el;
    });
    $table.append('<div class="element placeholder row-5 col-2"><div><span>57-71</span></div></div>');
    $table.append('<div class="element placeholder row-6 col-2"><div><span>89-103</span></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-1 row-5 col-2"><div></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-2"><div></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-3"><div></div></div>');
    $canvas.prepend($table);
  };

  TableApp.prototype.parseData = function(data){
    var parsedData = _.filter(data, function(d){ return d.AtomicNumber; });
    parsedData = _.map(parsedData, function(d, i){
      d.index = i;
      var typeString = d.Type ? d.Type.replace(" ", "-") : "";
      d.ClassName = "element " + typeString + " " + d.Phase + " row-"+d.Row + " col-"+d.Col;
      return d;
    });
    return parsedData;
  };

  TableApp.prototype.showViewAbundance = function(){
    _.each(elementData, function(d){
      var factor = opt.baseScaleFactor * Math.sqrt(d.Abundance);
      factor = Math.max(factor, 0.2);
      d.$el.css({'transform': 'scale3d('+factor+','+factor+','+factor+')', 'opacity': 0.8});
    });
  };

  TableApp.prototype.showViewDefault = function(){
    _.each(elementData, function(d){
      d.$el.css({'transform': '', 'opacity': 1.0});
    });
  };

  return TableApp;

})();

$(function() {
  var app = new TableApp({});
});
