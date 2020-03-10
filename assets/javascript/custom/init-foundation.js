// init foundation
jQuery(document).foundation();

//Default options
var options = {
  animationDuration: 0.2, //in seconds
  filter: 'all', //Initial filter
  callbacks: {
    onFilteringStart: function() { },
    onFilteringEnd: function() { },
    onShufflingStart: function() { },
    onShufflingEnd: function() { },
    onSortingStart: function() { },
    onSortingEnd: function() { }
  },
  delay: 0, //Transition delay in ms
  delayMode: 'progressive', //'progressive' or 'alternate'
  easing: 'ease-out',
  layout: 'sameSize', //See layouts
  selector: '.filtr-container',
  setupControls: true
};

// init particles, needs to be seperate
window.onload = function() {
  Particles.init({
    selector: 'canvas.background',
    maxParticles: 350,
    color: '#afafaf',
    responsive: [
      {
        breakpoint: 768,
        options: {
          maxParticles: 200,
          connectParticles: false
        }
      }, {
        breakpoint: 425,
        options: {
          maxParticles: 100
        }
      }, {
        breakpoint: 320,
        options: {
          maxParticles: 0 // disables particles.js
        }
      }
    ]
  });
};

// once AJAX is done, lets load stuff
$.fn.almDone = function(alm){

  //You can override any of these options and then call...
  var filterStart = $('.filtr-container').filterizr(options);
  //If you have already instantiated your Filterizr then call...
  filterStart.filterizr('setOptions', options);

  // lightbox
  $('.filtr-item > a').featherlight({
    beforeOpen: function(event){
      //setup vars
      var $title = this.$currentTarget[0].dataset.title,
          $description = this.$currentTarget[0].dataset.description,
          $image = this.$currentTarget[0].dataset.image,
          $link = this.$currentTarget[0].dataset.link;

      // link
      $('#mylightbox').find('a.lightbox-external').attr('href', $link);
      // title
      $('#mylightbox').find('h2').empty().append($title);
      // content
      $('#mylightbox').find('p').empty().append($description);
      // image
      $('#mylightbox').find('img').attr('src', $image);

      // setup sharing
      $("#mylightbox").find('div.a2a_kit').attr("data-a2a-url", $link);
      $("#mylightbox").find('div.a2a_kit').attr("data-a2a-title", $title);
    },
    afterContent: function(){
      var $title = this.$currentTarget[0].dataset.title,
          $link = this.$currentTarget[0].dataset.link;

      // initialize sharing
      var a2a_config = a2a_config || {};
          a2a.init('page');
    }
  });
};

var alm_is_animating = false; // Animating flag
$('.alm-filter-nav li').eq(0).addClass('active'); // Set initial active state

// Btn Click Event
$('.alm-filter-nav li a').on('click', function(e){

  e.preventDefault();
  var el = $(this); // Our selected element

  if(!el.hasClass('active') && !alm_is_animating){
    // Check for active and !alm_is_animating
     alm_is_animating = true;
     el.parent().addClass('active').siblings('li').removeClass('active');

     // Add active state
     var data = el.data(), // Get data values from selected menu item
         transition = 'fade', // 'slide' | 'fade' | null
         speed = '300'; //in milliseconds
    $.fn.almFilter(transition, speed, data); // Run the filter
  }
});

$.fn.almFilterComplete = function(){
  console.log('Ajax Load More filter has completed!');
  alm_is_animating = false; // clear animating flag
};

jQuery(document).ready(function () {
  $.fn.almComplete = function(alm){
    // lightbox
    $('.filtr-item > a').featherlight({
      beforeOpen: function(event){
        //setup vars
        var $title = this.$currentTarget[0].dataset.title,
            $description = this.$currentTarget[0].dataset.description,
            $image = this.$currentTarget[0].dataset.image,
            $link = this.$currentTarget[0].dataset.link;

        // link
        $('#mylightbox').find('a.lightbox-external').attr('href', $link);
        // title
        $('#mylightbox').find('h2').empty().append($title);
        // content
        $('#mylightbox').find('p').empty().append($description);
        // image
        $('#mylightbox').find('img').attr('src', $image);

        // setup sharing
        $("#mylightbox").find('div.a2a_kit').attr("data-a2a-url", $link);
        $("#mylightbox").find('div.a2a_kit').attr("data-a2a-title", $title);
      },
      afterContent: function(){
        var $title = this.$currentTarget[0].dataset.title,
            $link = this.$currentTarget[0].dataset.link;

        // initialize sharing
        var a2a_config = a2a_config || {};
            a2a.init('page');
      }
    });
  };
});

// when closing the mobile menu, reinit filter to position right.
jQuery(document).on('closed.zf.offcanvas',function(){
  if ($('.filtr-container') & alm_is_animating !== false){
    //You can override any of these options and then call...
    var filterStart = $('.filtr-container').filterizr(options);
    //If you have already instantiated your Filterizr then call...
    filterStart.filterizr('setOptions', options);
  }
});
