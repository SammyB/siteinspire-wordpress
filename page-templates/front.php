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

          <!--img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo.png"
            srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo@2x.png 2x,
            <?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo@3x.png 3x"
            class="inspire--logo" alt="<?php bloginfo( 'name' ); ?></strong>"-->

          <p class="inspire--text">The latest in website, apps and site tech inspiration delivered to you monthly.</p>

					<p class="inspire--curated">Curated by<br> <a href="https://www.linkedin.com/in/salvatorebrunno/" target="_blank">Sam Brunno</a>, Dentsu Australia.</p>

          <p class="inspire--curated"><em>Powered by <a href="https://isobaracademy.com/" title="Powered by Dentsu Creative Inspiration">Dentsu Creative Inspiration</a></em></p>

          <hr class="inspire--hr show-for-small-only">

          <div class="inspire__filter">
            <div class="inspire__filter--header">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
                <path fill="#676373" fill-rule="evenodd" d="M13.51 8.481a2.177 2.177 0 0 1-.62-1.52c0-.57.239-1.117.62-1.473a2.165 2.165 0 0 1 1.521-.641c.547 0 1.094.237 1.499.64.428.38.642.904.642 1.498 0 .546-.238 1.093-.642 1.496a2.085 2.085 0 0 1-1.499.618 2.1 2.1 0 0 1-1.522-.618m-1.855 12.473l9.466-9.48c.57-.546.88-1.306.88-2.043v-.094l-.856-7.912c-.024-.285-.286-.546-.571-.593L12.629 0h-.095a3.137 3.137 0 0 0-2.07.879l-9.417 9.479A3.614 3.614 0 0 0 0 12.9c0 .88.357 1.734.975 2.352l5.803 5.797c1.285 1.307 3.497 1.26 4.876-.095"/>
              </svg>
              <p>Filter by tags</p>
            </div>

            <hr class="inspire--hr">

            <ul class="alm-filter-nav">
               <li class="active">
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="" data-scroll="true" data-button-label="More Inspiration">
                  All
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="3d" data-scroll="true" data-button-label="More Inspiration">
                  3D
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="animation" data-scroll="true" data-button-label="More Inspiration">
                  Animation
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="data-driven" data-scroll="true" data-button-label="More Inspiration">
                  Data Driven
                </a>
              </li>
							<li>
								<a href="#" data-post-type="post" data-posts-per-page="12" data-category="distilled" data-scroll="true" data-button-label="More Inspiration">
									Distilled
								</a>
							</li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="filters-effects" data-scroll="true" data-button-label="More Inspiration">
                  Filters & Effects
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="games" data-scroll="true" data-button-label="More Inspiration">
                  Games
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="gestures-interactions" data-scroll="true" data-button-label="More Inspiration">
                  Gestures / Interactions
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="navigation" data-scroll="true" data-button-label="More Inspiration">
                  Navigation
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="parallax" data-scroll="true" data-button-label="More Inspiration">
                  Parallax
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="portfolio" data-scroll="true" data-button-label="More Inspiration">
                  Portfolio
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="retail" data-scroll="true" data-button-label="More Inspiration">
                  Retail
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="typography" data-scroll="true" data-button-label="More Inspiration">
                  Typography
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="video" data-scroll="true" data-button-label="More Inspiration">
                  Video
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="vr" data-scroll="true" data-button-label="More Inspiration">
                  VR
                </a>
              </li>
              <li>
                <a href="#" data-post-type="post" data-posts-per-page="12" data-category="web-tools" data-scroll="true" data-button-label="More Inspiration">
                  Web Tools
                </a>
              </li>
            </ul>

            <a href="/archives" class="inspire--archived">Archived inspirations</a>
          </div>

        </div>
      </div>
    </div>
  </div>
  <div class="small-12 medium-8 large-10 columns" data-equalizer>
      <?php echo do_shortcode( '
        [ajax_load_more
          id="8958249772"
          container_type="div"
          post_type="post"
          transition_container="false"
          post_format="standard"
          posts_per_page="12"
          progress_bar="true"
          progress_bar_color="afafaf"
          button_loading_label="Loading inspiration"
          button_label="Older inspiration"
          css_classes="siteinspire row small-up-2 medium-up-2 large-up-4 filtr-container"
        ]' );
      ?>
  </div>
</div>
<div id="mylightbox" class="lightbox">
  <h2>TITLE</h2>
  <a href="#" target="_blank" class="lightbox-external"><img src="/" alt="Visit your inspiration!" title="Visit your inspiration!" /></a>
  <div class="row text-center">
    <div class="small-12 medium-10 medium-offset-1 text-center">
      <p>DESCRIPTION</p>
    </div>
  </div>
  <div class="row">
    <div class="small-12 text-center">
      <div class="a2a_kit a2a_kit_size_32 a2a_default_style" data-a2a-url="http://www.google.com/" data-a2a-title="Example Page 1">
        <a class="a2a_button_facebook"></a>
        <a class="a2a_button_twitter"></a>
        <a class="a2a_button_linkedin"></a>
        <a class="a2a_button_email"></a>
      </div>
    </div>
  </div>
</div>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php get_footer();
