
var $wrapper = $('.card-wrapper');

$wrapper.on('click', function(e){
  $wrapper.addClass('started');
  if (!$wrapper.hasClass('active')) {
    $wrapper.addClass('active');
  }

});

$('.close').on('click', function(e){
  $wrapper.removeClass('active');
  e.stopPropagation();
});

$('.mineral.active').on('click', function(e){
  $(this).toggleClass('selected');
});
