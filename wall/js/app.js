'use strict';

var WallApp = (function() {

  function WallApp(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);

    this.init();
  }

  function queryParams(){
    if (location.search.length) {
      var search = location.search.substring(1);
      return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    }
    return {};
  }

  WallApp.prototype.init = function(){
    var q = queryParams();
    var layout = "v2";
    if (q.layout) layout = q.layout;
    $('.wall').attr('data-layout', layout);
    $('.menu-link.'+layout).addClass('active');
  };

  return WallApp;

})();

$(function() {
  var app = new WallApp({});
});
