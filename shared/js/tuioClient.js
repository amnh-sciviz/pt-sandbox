'use strict';

var TuioClient = (function() {
  function TuioClient(options) {
    var defaults = {
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  TuioClient.prototype.init = function(){
    this.socketUrl = this.opt.socketUrl || "ws://" + window.location.host;
    this.sids = [];
    this.objects = {};
    this.loadListeners();
  };

  TuioClient.prototype.getLiveObjects = function(){
    var objects = this.objects;
    return _.map(this.sids, function(sid){
      return objects[sid];
    });
  };

  TuioClient.prototype.loadListeners = function(){
    var _this = this;

    var oscPort = new osc.WebSocketPort({
      url: this.socketUrl, // URL to Web Socket server.
      metadata: true
    });

    oscPort.on("ready", function(){
      console.log("Ready to receive OSC messages.");
    });

    oscPort.on("message", function (oscMsg) {
      // console.log("An OSC message just arrived!", oscMsg);
      _this.onMessage(oscMsg);
    });

    oscPort.open();
  };

  TuioClient.prototype.onMessage = function(msg){
    var pType = msg.args[0].value;
    var rest = _.map(msg.args.slice(1), function(a){ return a.value; });

    switch(pType) {
      case 'set':
        // map object
        var obj = _.object(['sid', 'x', 'y', 'dx', 'dy', 'dd'], rest);
        this.objects[""+obj.sid] = obj;
        break;

      case 'alive':
        // parse sids as strings
        this.sids = _.map(rest, function(v){ return ""+v; });
        this.retireMissingObjects();
        break;

      default:
        // ignore everything else
        break;
    }

  };

  TuioClient.prototype.retireMissingObjects = function(){
    var sids = this.sids;
    this.objects = _.omit(this.objects, function(value, sid, object) {
      return _.contains(sids, sid);
    });
  };

  return TuioClient;

})();
