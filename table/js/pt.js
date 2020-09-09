'use strict';

var PT = (function() {

  function PT(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      dataUrl: 'data/elements.csv',
      onLoad: function(){}
    };
    this.opt = _.extend({}, defaults, config);

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

  PT.prototype.init = function(){
    var self = this;
    this.$canvas = $(this.opt.el);
    this.w = this.$canvas.width();
    this.h = this.$canvas.height();

    $.when(
      $.getJSON(this.opt.configUrl),
      $.getJSON(this.opt.contentUrl),
      loadCSV(this.opt.dataUrl)

    ).done(function(config, content, data){
      config = config[0];
      self.opt = _.extend({}, self.opt, config);
      console.log('Config and content loaded.');
      self.elementData = self.parseData(data);
      self.loadUI(self.elementData);
      self.opt.onLoad();
    });
  };

  PT.prototype.loadUI = function(data){
    var self = this;
    var $table = $('<div class="table"></div>');
    _.each(data, function(d, i){
      var $el = $('<div id="element-'+d.Symbol+'" class="'+d.ClassName+'"></div>');
      var $a = $('<a href="#'+d.Symbol+'" data-index="'+d.index+'"></a>');
      $a.append('<span class="number">'+d.AtomicNumber+'</span>');
      $a.append('<span class="symbol">'+d.Symbol+'</span>');
      $a.append('<span class="name">'+d.Element+'</span>');
      $el.append($a);
      $table.append($el);
      self.elementData[i].$el = $el;
      self.elementData[i].$a = $a;
    });
    $table.append('<div class="element placeholder row-5 col-2"><div><span>57-71</span></div></div>');
    $table.append('<div class="element placeholder row-6 col-2"><div><span>89-103</span></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-1 row-5 col-2"><div></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-2"><div></div></div>');
    $table.append('<div class="element placeholder-box placeholder-box-3"><div></div></div>');
    this.$canvas.prepend($table);
  };

  PT.prototype.parseData = function(data){
    var parsedData = _.filter(data, function(d){ return d.AtomicNumber; });
    parsedData = _.map(parsedData, function(d, i){
      d.index = i;
      var typeString = d.Type ? d.Type.replace(" ", "-") : "";
      d.ClassName = "element " + typeString + " " + d.Phase + " row-"+d.Row + " col-"+d.Col;
      d.Year = d.Year === "" || !d.Year || d.Year < 1600 ? 1600 : parseInt(d.Year);
      return d;
    });
    return parsedData;
  };

  PT.prototype.setCss = function(props, el){
    var isList = Array.isArray(props);
    _.each(this.elementData, function(d, i){
      var $el = d.$el;
      if (el) $el = d[el];
      if (isList) $el.css(props[i]);
      else $el.css(props);
    });
  };

  return PT;

})();
