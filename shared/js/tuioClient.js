'use strict';

var TuioClient = (function() {
  function TuioClient(options) {
    var defaults = {
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  TuioClient.prototype.init = function(){
    this.socketUrl = this.opt.socketUrl || "ws://" + window.location.host
    this.loadListeners();
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
      _this.onMessage(oscMessage);
    });

    oscPort.open();
  };

  TuioClient.prototype.onMessage = function(msg){
    var bundle = osc.readPacket(msg, osc.defaults);
    console.log(bundle)
  };

  TuioClient.prototype.translatePacket = function(packet) {

    // empty 'alive' args appear as a string, not an array
    var pType = (typeof packet.args === 'string' ? packet.args : packet.args[0]);
    var rest = (typeof packet.args === 'string' ? [] : packet.args.slice(1));

    this.objects = [];
    this.profile = packet.address;

    switch (pType) {

      case 'source':
        this.source = packet.args[1];
        break;

      case 'set':

        var obj = _.object(profiles[packet.address], rest);
        obj.profile = packet.address;

        // we should know the source by the time 'set' packets arrive
        obj.source = this.source;
        this.objects.push(obj);
        break;

      case 'alive':
        this.alive = rest;
        break;

      case 'fseq':
        this.seq = rest[0];
        break;

      default:
        throw 'Unexpected TUIO packet type: ' + pType;

    }
  };

  return TuioClient;

})();
