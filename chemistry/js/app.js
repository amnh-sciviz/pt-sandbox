'use strict';

var ChemistryApp = (function() {

  function ChemistryApp(config) {
    var defaults = {
      el: '#canvas',
      contentUrl: 'content.json'
    };
    this.opt = _.extend({}, defaults, config);

    this.init();
  }

  ChemistryApp.prototype.init = function(){
    var _this = this;
    this.$el = $(this.opt.el);
    this.$toolbar = $('#toolbar');
    this.w = this.$el.width();
    this.h = this.$el.height();
    this.bodies = {};

    $.when(
      $.getJSON(this.opt.contentUrl)

    ).done(function(content){
      _this.parseContent(content);
      console.log('Config and content loaded.');
      _this.loadGame();
      _this.loadSounds();
    });
  };

  ChemistryApp.prototype.addAtom = function(props){
    var atom = new Atom(_.extend({}, props, {game: this.game, $container: this.$domContainer}));
    this.bodies[atom.id] = atom;
  };

  ChemistryApp.prototype.loadGame = function(){
    var _this = this;
    var phaser = new Phaser.Game({
      type: Phaser.WEBGL,
      width: this.w,
      height: this.h,
      parent: this.$el.attr("id"),
      transparent: true,
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: false
        }
      },
      dom: {
        createContainer: true
      },
      scene: {
        create: function(){ _this.onGameCreate(this); },
        // update: function(){ app.onGameUpdate(this); }
      }
    });
  };

  ChemistryApp.prototype.loadSounds = function(){

  };

  ChemistryApp.prototype.loadListeners = function(){
    var _this = this;

    this.touchManager = new TouchManager({
      el: this.opt.el,
      onTouchStart: _this.onTouchStart,
      onTouchMove: _this.onTouchMove,
      onTouchEnd: _this.onTouchEnd
    });

    $('.add-element').on('click', function(e){
      e.preventDefault();
      var velocity = { x: Phaser.Math.Between(-3, 3), y: 10.0 };
      var props = _.extend({}, _this.elements[$(this).attr('data-id')], {x: e.pageX, y: e.pageY, velocity: velocity});
      _this.addAtom(props);
    });
  };

  ChemistryApp.prototype.onGameCreate = function(game){
    var _this = this;

    this.game = game;
    game.matter.world.setBounds(0, 0, this.w, this.h);
    this.$domContainer = this.$el.children('div').first();

    _.each(this.elements, function(props, symbol){
      var $button = $('<a href="#" class="add-element button button-'+symbol+'" data-id="'+symbol+'">Add '+props.name+'</a>');
      $button.css('background', props.group.color);
      _this.$toolbar.append($button);
    });

    this.loadListeners();
  };

  ChemistryApp.prototype.onTouchStart = function(touchedEls){

  };

  ChemistryApp.prototype.onTouchMove = function(touchedEls){

  };

  ChemistryApp.prototype.onTouchEnd = function(touchedEls){

  };

  ChemistryApp.prototype.parseContent = function(content){
    this.groups = content.groups;
    this.elements = _.mapObject(content.elements, function(props, symbol){
      props.group = _.clone(content.groups[props.group]);
      props.group.id = props.group;
      props.symbol = symbol;
      return props;
    });

  };

  return ChemistryApp;

})();

$(function() {
  var app = new ChemistryApp({});
});
