<?php
/*
Template Name: Front
*/
get_header(); ?>

<!-- background -->
<canvas class="background"></canvas>

<?php do_action( 'foundationpress_before_content' ); ?>

<!-- main container -->
<div class="row expanded inspire">
  <div class="small-12 medium-4 large-2 columns">
    <div class="row align-bottom">
      <div class="columns align-self-bottom text-center">
        <div class="inspire__left">     

          <img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo.png"
            srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo@2x.png 2x,
            <?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo@3x.png 3x"
            class="inspire--logo" alt="<?php bloginfo( 'name' ); ?></strong>">
          
          <p class="inspire--text">The latest in website, apps and site tech inspiration delivered to you monthly.</p>

          <p class="inspire--curated">Curated by<br> Sam Brunno, Isobar Australia.</p>

          <ul class="alm-filter-nav">
            <li><a href="#" data-post-type="post" data-posts-per-page="12" data-category="gestures-interaction" data-scroll="true" data-button-label="More Work">ANIMATION</a></li>
            <li><a href="#" data-post-type="post" data-posts-per-page="12" data-category="gestures-interaction" data-scroll="true" data-button-label="More Work">PORTFOLIO</a></li>
          </ul>

          <!-- For filtering controls add -->
          <div class="columns"> <a href="/" target="_self">All inspirations</a> </div>
          <div class="columns"> <a href="/tag/3d/" target="_self">3D</a> </div>
          <div class="columns"> <a href="/tag/animation/" target="_self">Animation</a> </div>
          <div class="columns"> <a href="/tag/data-driven" target="_self">Data Driven</a> </div>
          <div class="columns"> <a href="/tag/filters-effects/" target="_self">Filters & Effects</a> </div>
          <div class="columns"> <a href="/tag/games/" target="_self">Games</a> </div>
          <div class="columns"> <a href="/tag/gestures-interactions/" target="_self">Gestures & Interactions</a> </div>
          <div class="columns"> <a href="/tag/navigation/" target="_self">Navigation</a> </div>
          <div class="columns"> <a href="/tag/parallax/" target="_self">Parallax</a> </div>
          <div class="columns"> <a href="/tag/portfolio/" target="_self">Portfolio</a> </div>
          <div class="columns"> <a href="/tag/retail/" target="_self">Retail</a> </div>
          <div class="columns"> <a href="/tag/typography/" target="_self">Typography</a> </div>
          <div class="columns"> <a href="/tag/video" target="_self">Video</a> </div>
          <div class="columns"> <a href="/tag/vr/" target="_self">VR</a> </div>
        </div>
      </div>
    </div>
  </div>
  <div class="small-12 medium-8 large-10 columns">
      <?php echo do_shortcode( '
        [ajax_load_more
          id="8958249772"
          container_type="div"
          post_type="post"
          transition_container="false"
          post_format="standard"
          posts_per_page="12"
          progress_bar="true"
          progress_bar_color="ed7070"
          button_loading_label="Loading inspiration"
          button_label="Older inspiration"
          css_classes="siteinspire row small-up-2 medium-up-3 large-up-3 filtr-container"
        ]' );
      ?>
      <?php the_excerpt(); ?>
  </div>
</div>
<div id="mylightbox" class="lightbox">
  <h2>TITLE</h2>
  <a href="#" target="_blank"><img src="/" /></a>
  <p>DESCRIPTION</p>
</div>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php get_footer();
