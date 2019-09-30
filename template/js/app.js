'use strict';

var MakeBreakApp = (function() {

  var app, opt, $canvas, w, h, phaserGame, game, gui;
  var objects, objectLookup, physicalProperties, $domContainer;
  var $toolbar;

  function MakeBreakApp(config) {
    var defaults = {
      el: '#canvas',
      configUrl: 'config.json',
      contentUrl: 'content.json',
      inputsAllowed: 5,
      physicalProperties: {
        restitution: 0.5, // a.k.a. bounciness; 0 = no bounce
        friction: 0.4, // default is 0.1
        frictionAir: 0.05 // default is 0.01
      }
    };
    opt = _.extend({}, defaults, config);

    this.init();
  }

  function combineFormulas(f1, f2){
    var result = [];
    var ids = _.union(_.pluck(f1, "id"), _.pluck(f2, "id"));
    var f1Lookup = _.object(_.map(f1, function(f){ return [f.id, f.count]; }));
    var f2Lookup = _.object(_.map(f2, function(f){ return [f.id, f.count]; }));
    _.each(ids, function(id){
      var v1 = _.has(f1Lookup, id) ? f1Lookup[id]: 0;
      var v2 = _.has(f2Lookup, id) ? f2Lookup[id]: 0;
      result.push({"id": id, "count": v1+v2});
    });
    return result;
  }

  function formulaToHtml(formula){
    var html = '';
    _.each(formula, function(v){
      html += v.id + '<sub>' + v.count + '</sub>';
    });
    return html;
  }

  function formulaStringToHtml(str){
    var formula = parseFormulaString(str);
    return formulaToHtml(formula);
  }

  function isUpper(c){
    return c == c.toUpperCase();
  }

  function parseFormulaString(str) {
    var numStr = '';
    var letStr = '';
    var values = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      // this is a number, just add to previous number string
      if (c >= '0' && c <= '9') {
        numStr += c;

      // this is a uppercase letter; add previous
      } else if (isUpper(c)) {
        if (i > 0) values.push({"id": letStr, "count": numStr.length > 0 ? parseInt(numStr) : 1 });
        numStr = '';
        letStr = c;

      // this is a lowercase letter, just add to previous letter string
      } else {
        letStr += c;
      }
    }
    // add last
    values.push({"id": letStr, "count": numStr.length > 0 ? parseInt(numStr) : 1 });
    return values;
  }

  MakeBreakApp.prototype.init = function(){
    var _this = this;
    app = this;
    $canvas = $(opt.el);
    $toolbar = $("#toolbar");
    w = $canvas.width();
    h = $canvas.height();

    this.currentFormula = [];
    this.currentCharge = 0;

    objects = [];
    physicalProperties = _.clone(opt.physicalProperties);

    $.when(
      $.getJSON(opt.configUrl),
      $.getJSON(opt.contentUrl)

    ).done(function(config, content){
      config = config[0];
      opt = _.extend({}, opt, config);
      objects = app.parseObjects(content[0].objects);
      objectLookup = _.object(_.map(objects, function(o){ return [o.id, _.clone(o)]; }));
      console.log('Config and content loaded.');
      app.loadGame();
      app.loadSounds();
      app.loadUI();
    });


  };

  MakeBreakApp.prototype.addObject = function(props) {
    var _this = this;
    var obj = _.clone(props);
    if (obj.physicalProperties) obj.physicalProperties = _.extend({}, physicalProperties, obj.physicalProperties);
    var body = new Body(_.extend({}, obj, {app: _this, game: game, $container: $domContainer}));
    this.bodies[body.id] = body;
  };

  MakeBreakApp.prototype.loadGame = function(){
    phaserGame = new Phaser.Game({
      type: Phaser.WEBGL,
      width: w,
      height: h,
      parent: $canvas.attr("id"),
      transparent: true,
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: false
        }
      },
      dom: {
        createContainer: true,
        // behindCanvas: true
      },
      scene: {
        create: function(){ app.onGameCreate(this); },
        // update: function(){ app.onGameUpdate(this); }
      }
    });
  };

  MakeBreakApp.prototype.loadGUI = function(){
    gui = new dat.GUI();
    var controllers = [];
    controllers.push(gui.add(physicalProperties, 'restitution', 0, 1));
    controllers.push(gui.add(physicalProperties, 'friction', 0, 1));
    controllers.push(gui.add(physicalProperties, 'frictionAir', 0, 1));

    // console.log(phaserGame)
    // console.log(game)
    // gui.add(game.matter.config, 'debug');

    var onUpdate = function(){ app.onGUIChange(); };
    _.each(controllers, function(c){ c.onFinishChange(onUpdate) });
  };

  MakeBreakApp.prototype.loadListeners = function(){
    game.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
      // console.log('collision start')
      // console.log(bodyA, bodyB)
      // console.log('a', bodyA.velocity)
      // console.log('b', bodyB.velocity)
      app.onCollision(bodyA, bodyB);
    });
    game.matter.world.on('collisionend', function (event, bodyA, bodyB) {
      // console.log('collision end')
      app.onCollisionEnd(bodyA, bodyB);
    });

    $('.add-element').on('click', function(e){
      e.preventDefault();
      var velocity = {
        x: Phaser.Math.Between(-3, 3),
        y: 10.0
      }
      var props = _.extend({}, objectLookup[$(this).attr('data-id')], {x: e.pageX, y: e.pageY, velocity: velocity});
      app.addObject(props);
    });
  };

  MakeBreakApp.prototype.loadSounds = function(){
    var sounds = {};
    var soundKeys = ["makeSound", "buildSound", "successSound", "clickSound"];
    _.each(soundKeys, function(k){
      if (opt[k]) sounds[k] = new Sound(opt[k]);
    });
    this.sounds = sounds;
  };

  MakeBreakApp.prototype.loadUI = function(){
    var targetFormula = opt.targetFormula;
    this.targetFormula = parseFormulaString(targetFormula);
    var html = formulaStringToHtml(targetFormula);
    $('#status-target').html(html);
    this.$formulaCurrent = $('#status-current');
    this.$chargeCurrent = $('#status-charge');
  };

  MakeBreakApp.prototype.onCollision = function(matterBodyA, matterBodyB) {
    var _this = this;
    var idA = matterBodyA.label;
    var idB = matterBodyB.label;
    var bodyA = this.bodies[idA];
    var bodyB = this.bodies[idB];

    if (bodyA === undefined || bodyB === undefined) return;

    // check for droppable
    if (bodyA.isDroppable()) {
      console.log('droppable a')
      var dropped = bodyB.onDroppableEnter(bodyA);
      if (dropped) this.onDrop(bodyB, bodyA)
      return;
    }
    if (bodyB.isDroppable()) {
      console.log('droppable b')
      var dropped = bodyA.onDroppableEnter(bodyB);
      if (dropped) this.onDrop(bodyA, bodyB)
      return;
    }

    // callback right before collision
    bodyA.onCollision(bodyB);
    bodyB.onCollision(bodyA);

    // check for reaction
    var newBody = bodyA.combineWith(bodyB, objectLookup);
    if (newBody) {
      // delete collided bodies
      this.bodies = _.omit(this.bodies, idA, idB);
      // add new body
      this.bodies[newBody.id] = newBody;
      this.sounds["makeSound"].playPercent(1.0-newBody.getWeight());
      // play custom sound
      if (newBody.opt.playSound && this.sounds[newBody.opt.playSound]) {
        var delay = newBody.opt.playDelay || 0;
        setTimeout(function(){_this.sounds[newBody.opt.playSound].playSprite("default")}, delay);
      }
      return;
    }

    var newBodies = bodyA.breakWith(bodyB, objectLookup);
    if (newBodies && newBodies.length) {
      // delete collided bodies
      this.bodies = _.omit(this.bodies, idA, idB);
      // add new bodies
      _.each(newBodies, function(body){
        _this.bodies[body.id] = body;
      });
      // this.breakSound && this.breakSound.playSprite("break");
      return;
    }

    // this.collideSound && this.collideSound.playSprite("collide");

  };

  MakeBreakApp.prototype.onCollisionEnd = function(matterBodyA, matterBodyB){
    var idA = matterBodyA.label;
    var idB = matterBodyB.label;
    var bodyA = this.bodies[idA];
    var bodyB = this.bodies[idB];

    if (bodyA === undefined || bodyB === undefined) return;

    // check for droppable
    if (bodyA.isDroppable()) {
      bodyB.onDroppableLeave(bodyA);
      return;
    }
    if (bodyB.isDroppable()) {
      bodyA.onDroppableLeave(bodyB);
      return;
    }
  };

  MakeBreakApp.prototype.onDrop = function(dropSrc, dropTarget){
    var formulaStr = dropSrc.opt.addFormula ? dropSrc.opt.addFormula : dropSrc.reactId;
    var formula = parseFormulaString(formulaStr);
    this.currentFormula = combineFormulas(this.currentFormula, formula);
    var lookup = _.object(_.map(this.currentFormula, function(f){ return [f.id, f.count]; }));
    var html = '';
    _.each(this.targetFormula, function(f){
      if (_.has(lookup, f.id)) html += f.id + '<sub>' + lookup[f.id] + '</sub>';
      else html += '<span style="visibility: hidden">' + f.id + '<sub>' + f.count + '</sub></span>';
    });
    this.$formulaCurrent.html(html);
    $('.status').addClass('active');
    this.sounds["clickSound"].playSprite("default");

    this.currentCharge += dropSrc.opt.charge;
    var chargeStr = Math.abs(this.currentCharge);
    if (this.currentCharge > 0) chargeStr += "+";
    else if (this.currentCharge < 0) chargeStr += "-";
    else chargeStr = "";
    this.$chargeCurrent.text(chargeStr);

    // check for success
    var targetLookup = _.object(_.map(this.targetFormula, function(f){ return [f.id, f.count]; }));
    if (_.isEqual(lookup, targetLookup)) {
      setTimeout(function(){
        app.onSuccess();
      }, 2000);
    }
  };

  MakeBreakApp.prototype.onGameCreate = function(_game){
    game = _game;
    game.matter.world.setBounds(0, 0, w, h);

    var cx = w * 0.5;
    var cy = h * 0.75;

    $domContainer = $canvas.children('div').first();
    if (!$domContainer.length) console.log("Could not find DOM container!");
    this.bodies = {};
    _.each(objects, function(props){
      var count = props.count;
      if (count && count > 0) {
        _.times(count, function(i){
          var obj = _.clone(props);
          // if (obj.type === "droppable") {
          //   obj.width = w * obj.rw;
          //   obj.height = h * obj.rh;
          //   obj.x = w * 0.5;
          //   obj.y = h - obj.height * 0.5;
          // } else {
          //   obj.y = Phaser.Math.Between(h*0.05, h*0.5);
          // }
          obj.x = obj.rx ? cx + obj.width * obj.rx : cx;
          obj.y = obj.ry ? cy + obj.height * obj.ry : cy;
          obj = _.omit(obj, ['width', 'height', 'rw', 'rh', 'rx', 'ry']);
          app.addObject(obj, count);
        });
      }
      // add buttons if elements
      if (props.type === "element") {
        $toolbar.append($('<a href="#" class="add-element button button-'+props.id+' '+props.group+'" data-id="'+props.id+'">Add '+props.label+'</a>'))
      }
    });

    game.matter.add.mouseSpring();
    // We need to add extra pointers, as we only get 1 by default
    // game.input.addPointer(opt.inputsAllowed-1);

    app.loadListeners();
    // app.loadGUI();

  };

  MakeBreakApp.prototype.onGUIChange = function(){

  };

  MakeBreakApp.prototype.onGameUpdate = function(){
    // console.log(physicalProperties)
    _.each(this.bodies, function(body, id){
      body.update(physicalProperties);
    });
  };

  MakeBreakApp.prototype.onSuccess = function(){
    alert("Success!");
  };

  MakeBreakApp.prototype.parseObjects = function(propList){
    propList = _.map(propList, function(p){
      p.html = $("#"+p.id).html();
      return p;
    })
    return propList;
  };

  return MakeBreakApp;

})();

$(function() {
  var app = new MakeBreakApp({});
});
