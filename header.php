<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
  <head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <?php wp_head(); ?>

    <link href="https://fonts.googleapis.com/css?family=Varela+Round" rel="stylesheet">
  </head>
  <body <?php body_class(); ?>>
  <?php do_action( 'foundationpress_after_body' ); ?>

  <?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
  <div class="off-canvas-wrapper">
    <?php get_template_part( 'template-parts/mobile-off-canvas' ); ?>
  <?php endif; ?>

  <?php do_action( 'foundationpress_layout_start' ); ?>

  <header class="site-header" role="banner">
    <nav class="site-navigation top-bar" role="navigation">
      <div class="top-bar-left">
        <div class="site-desktop-title top-bar-title">
          <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="24" viewBox="0 0 82 24">
                <defs>
                    <path id="a" d="M82 24V0H0v24h82z"/>
                </defs>
                <g fill="none" fill-rule="evenodd">
                    <mask id="b" fill="#fff">
                        <use xlink:href="#a"/>
                    </mask>
                    <path fill="#EF4D25" d="M68.076 17.184c0 2.176-1.722 3.588-4.386 3.588-1.744 0-2.872-.856-2.872-2.18 0-1.52 1.264-2.298 3.746-2.298h3.512v.89zm-3.325-10.47c-1.997.002-3.78.55-5.154 1.588a5.998 5.998 0 0 0-.81.724l2.112 2.132c.773-.798 2.131-1.265 3.693-1.265 2.186 0 3.484 1.492 3.484 2.933v.63h-3.605c-5.014 0-7.66 1.814-7.66 5.244 0 3.042 2.474 5.162 6.019 5.162 2.133 0 3.633-.1 4.938-1.422l.375-.38.008 1.595h3.728V12.826c0-3.71-2.795-6.112-7.128-6.112zM47.607 20.202a4.788 4.788 0 0 1-3.943-2.083l-.04-.062v-5.413l.04-.058a4.79 4.79 0 0 1 3.943-2.08c2.653 0 4.814 2.169 4.809 4.849 0 2.67-2.156 4.847-4.81 4.847zm.591-13.486l-.037-.002c-1.877-.004-3.523.725-4.54 1.714l-.009.02L43.623 0l-3.907 3.93v19.72h3.602l.088-1.418c1.37 1.301 2.703 1.725 4.667 1.755h.083c1.962-.01 3.967-.938 5.51-2.538 1.622-1.675 2.508-3.84 2.508-6.094 0-4.683-3.653-8.641-7.976-8.639zm29.636 2.49l.016-.488v-1.71l-3.766-.024v16.652h3.906v-9.429h.007c.067-2.872 2.124-3.432 4.003-3.549V6.657c-2.567.18-3.96 1.674-4.166 2.549zm-47.886 10.99c-2.646 0-4.802-2.172-4.802-4.854 0-2.667 2.156-4.847 4.802-4.847 2.654 0 4.812 2.18 4.812 4.847 0 2.682-2.158 4.854-4.812 4.854zM29.822 6.71c-4.725 0-8.56 3.874-8.56 8.638 0 4.762 3.838 8.639 8.56 8.639 4.721 0 8.558-3.883 8.558-8.639 0-4.764-3.841-8.638-8.558-8.638zM.242 23.653h3.831V7.003H.241v16.65zM2.136.47A2.15 2.15 0 0 0 0 2.628c0 1.19.959 2.156 2.137 2.156 1.18 0 2.136-.966 2.136-2.156A2.147 2.147 0 0 0 2.137.47zm10.937 12.866c-2.779-.274-3.694-.765-3.694-1.751 0-.925 1.127-1.543 3.202-1.543 2.048 0 3.778.584 5.135 1.629l2.26-2.334c-.017-.025-.043-.043-.065-.064-1.954-1.637-4.454-2.556-7.145-2.556-3.998 0-6.9 1.969-6.9 4.989 0 3.506 2.712 4.682 6.81 5.053 3.115.276 4.246.801 4.246 2.006 0 1.137-1.163 1.91-3.729 1.91-2.258 0-3.852-.53-5.421-1.71l-2.33 2.392c.02.017.034.034.058.057C7.701 23.257 10.111 24 13.14 24c4.182 0 7.297-1.94 7.297-5.3 0-3.543-3.086-4.93-7.362-5.364z" mask="url(#b)"/>
                </g>
            </svg>
          </a>
        </div>
      </div>
      <div class="top-bar-right">
        <?php foundationpress_top_bar_r(); ?>

        <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
          <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
        <?php endif; ?>
      </div>
    </nav>
  </header>

  <section class="container">
    <?php do_action( 'foundationpress_after_header' );
