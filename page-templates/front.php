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
          <h1 style="font-size:16px;">
            <strong><?php bloginfo( 'name' ); ?></strong><br><?php bloginfo( 'description' ); ?>
          </h1>        
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="214" height="103" viewBox="0 0 214 103">
            <defs>
              <path id="a" d="M214 103H0V0h214z"/>
            </defs>
            <g fill="none" fill-rule="evenodd">
              <mask id="b" fill="#fff">
                <use xlink:href="#a"/>
              </mask>
              <path fill="#FEFEFE" d="M45.088 93.096h4.822V67.03h-4.822v26.067zm2.385-39.615c1.971 0 3.527 1.625 3.527 3.685 0 2.004-1.556 3.63-3.527 3.63-1.917 0-3.473-1.626-3.473-3.63 0-2.06 1.556-3.685 3.473-3.685zM63.02 92.106H58V66.12h4.913v3.73c1.869-3.242 4.912-4.486 7.903-4.486 6.14 0 9.184 4.485 9.184 10.265v16.476h-5.02V76.494c0-3.62-1.495-6.537-5.98-6.537-3.95 0-5.98 3.188-5.98 7.131v15.018zM90.798 83.871c.339 2.713 2.484 4.884 6.323 4.884 2.993 0 4.629-1.628 4.629-3.472 0-1.628-1.242-2.877-3.5-3.365l-4.63-.978c-4.233-.868-6.774-3.635-6.774-7.325 0-4.452 4.348-8.25 9.654-8.25 7.453 0 9.768 4.666 10.33 7l-4.684 1.684c-.227-1.358-1.355-4.343-5.646-4.343-2.71 0-4.516 1.684-4.516 3.475 0 1.572 1.015 2.712 3.105 3.147l4.404.922c4.91 1.03 7.507 3.908 7.507 7.761 0 3.69-3.218 8.085-9.935 8.085-7.453 0-10.613-4.612-11.065-7.597l4.798-1.628zM126.918 69.824c-4.729 0-7.862 3.868-7.862 9.028 0 5.318 3.133 9.133 7.862 9.133 4.782 0 7.805-3.815 7.805-9.133 0-5.16-2.969-9.028-7.805-9.028zM114 102.01V65.956h5.002v4.03c1.43-2.58 4.563-4.62 8.85-4.62 7.916 0 12.148 5.962 12.148 13.486 0 7.682-4.562 13.647-12.313 13.647-4.068 0-7.147-1.88-8.575-4.192v13.703H114zM144.088 93.096h4.822V67.03h-4.822v26.067zm2.385-39.615c1.971 0 3.527 1.625 3.527 3.685 0 2.004-1.556 3.63-3.527 3.63-1.917 0-3.473-1.626-3.473-3.63 0-2.06 1.556-3.685 3.473-3.685zM171 71.988a14.676 14.676 0 0 0-2.15-.163c-4.142 0-6.922 2.295-6.922 8.092v13.18H157V66.792h4.824v4.594c1.836-4.046 4.982-5.031 7.551-5.031.68 0 1.363.11 1.625.164v5.468zM194.685 76.545c-.109-3.744-2.548-6.674-7.157-6.674-4.284 0-6.888 3.309-7.106 6.674h14.263zm5.153 8.302c-1.465 4.613-5.64 8.25-11.714 8.25-6.997 0-13.124-5.103-13.124-13.946 0-8.196 5.911-13.786 12.472-13.786 8.028 0 12.528 5.537 12.528 13.676 0 .65-.053 1.303-.109 1.628h-19.632c.11 4.666 3.472 7.924 7.865 7.924 4.229 0 6.345-2.334 7.32-5.265l4.394 1.52zM47.956 30.196c.108 1.788 1.403 3.526 4.207 3.526 2.102 0 3.127-1.105 3.127-2.263 0-.948-.647-1.736-2.643-2.157l-3.074-.684c-5.716-1.21-7.98-4.367-7.98-8.05 0-4.79 4.313-8.683 10.3-8.683 7.765 0 10.46 4.735 10.73 7.788l-6.793 1.21c-.217-1.736-1.35-3.21-3.829-3.21-1.565 0-2.912.895-2.912 2.262 0 1.105.916 1.738 2.102 1.948l3.559.684c5.554 1.104 8.25 4.366 8.25 8.208 0 4.472-3.503 8.84-10.676 8.84-8.414 0-11.11-5.314-11.324-8.21l6.956-1.209zM69.658 39.615h7.686V12.936h-7.686v26.68zM73.449 0C75.98 0 78 2.146 78 4.776s-2.021 4.779-4.55 4.779c-2.427 0-4.45-2.148-4.45-4.779C69 2.146 71.023 0 73.45 0zM95.498 12.672H101v7.082h-5.502v9.904c0 2.183 1.247 2.768 3.119 2.768.907 0 1.76-.16 2.269-.266v6.71c-.34.16-1.76.745-4.48.745-5.843 0-9.416-3.249-9.416-8.52v-11.34H82v-7.083h1.418c2.949 0 4.366-1.864 4.366-4.313V4.952h7.714v7.72zM121.014 22.619c-.109-2-1.52-4.42-5.433-4.42-3.475 0-5.214 2.472-5.377 4.42h10.81zm7.498 8.683c-1.304 4.524-5.596 8.313-12.44 8.313-7.444 0-14.072-5.156-14.072-13.945 0-8.417 6.465-13.785 13.474-13.785 8.365 0 13.526 4.999 13.526 13.418 0 1.104-.11 2.315-.163 2.473h-18.796c.163 2.947 2.934 5.05 6.138 5.05 2.99 0 4.673-1.367 5.433-3.42l6.9 1.896z" mask="url(#b)"/>
              <path fill="#EE4D23" d="M210.48 84.183c1.933 0 3.52 1.574 3.52 3.488s-1.587 3.444-3.52 3.444-3.48-1.53-3.48-3.444a3.485 3.485 0 0 1 3.48-3.488" mask="url(#b)"/>
              <path fill="#F14C23" d="M0 27.73h32v-1.98H0z" mask="url(#b)"/>
            </g>
          </svg>
          <p>Since 2016</p>
          <p>Curated by Sam Brunno, Isobar Australia in Canberra.<br> Designed by Brendan Imer.</p>

          <ul class="alm-filter-nav">
            <li><a href="#" data-post-type="posts" data-posts-per-page="12" category="2 / Interactions" data-scroll="false" data-button-label="More Work">ANIMATION</a></li>
            <li><a href="#" data-post-type="posts" data-posts-per-page="12" category="6" data-scroll="true" data-button-label="More Articles">PORTFOLIO</a></li>
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
          css_classes="siteinspire row small-up-2 medium-up-4 large-up-4 filtr-container"
        ]' );
      ?>
      <?php the_excerpt(); ?>
  </div>
</div>
<div id="mylightbox" class="lightbox">
  <h2>TITLE</h2>
  <a href="#" target="_blank"><img src="" /></a>
  <p>DESCRIPTION</p>
</div>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php get_footer();
