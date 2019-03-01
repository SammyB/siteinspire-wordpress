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

    <link rel="apple-touch-icon" sizes="57x57" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-57x57.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="60x60" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-60x60.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="72x72" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-72x72.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="76x76" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-76x76.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="114x114" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-114x114.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="120x120" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-120x120.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="144x144" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-144x144.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="152x152" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-152x152.png?636457394782234099">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/apple-icon-180x180.png?636457394782234099">
    <link rel="icon" type="image/png" sizes="192x192" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/android-icon-192x192.png?636457394782234099">
    <link rel="icon" type="image/png" sizes="32x32" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/favicon-32x32.png?636457394782234099">
    <link rel="icon" type="image/png" sizes="96x96" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/favicon-96x96.png?636457394782234099">
    <link rel="icon" type="image/png" sizes="16x16" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/favicon-16x16.png?636457394782234099">
    <meta name="msapplication-TileColor" content="#f74902">
    <meta name="msapplication-TileImage" content="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/ms-icon-144x144.png?636457394782234099">
    <meta name="theme-color" content="#f74902">

    <title>Isobar Inspire - The latest in website, apps and site tech inspiration delivered to you monthly.</title>

    <meta name="og:title" content="Isobar Inspire - The latest in website, apps and site tech inspiration delivered to you monthly.">
    <meta name="og:description" content="Powered by Isobar Academy, this site is curated once a month to keep you inspired in your daily work life.">
    <meta property="og:image" name="og:image" content="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/og-image.png">



    <?php wp_head(); ?>
  </head>
  <body <?php body_class(); ?>>
  <?php do_action( 'foundationpress_after_body' ); ?>

	<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
	<div class="off-canvas-wrapper">
		<?php get_template_part( 'template-parts/mobile-off-canvas' ); ?>
	<?php endif; ?>

	<?php do_action( 'foundationpress_layout_start' ); ?>

  <header class="site-header" role="banner">
    <nav class="site-navigation top-bar" role="navigation" <?php foundationpress_title_bar_responsive_toggle() ?>>
      <div class="text-left"> <!-- top-bar-left -->
        <div class="site-desktop-title"> <!-- top-bar-title -->
          <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
            <svg class="site-desktop-title__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 947.3 89.5">
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                  <polygon points="609.1 89.5 603.3 85.8 597.5 89.5 597.5 78.3 609.1 78.3 609.1 89.5" fill="#f5642d"/>
                  <path d="M358.6,21.6l19.8,52.9H366.3l-4-11.8H342.5l-4.1,11.8H326.6l20-52.9Zm.7,32.5-6.7-19.4h-.1l-6.9,19.4Z" fill="#323232"/>
                  <path d="M453.9,35.8a11.7,11.7,0,0,0-2.6-2.9,12,12,0,0,0-3.5-2,12.1,12.1,0,0,0-4.1-.7,13.6,13.6,0,0,0-6.7,1.5,12.6,12.6,0,0,0-4.4,4.1,17.9,17.9,0,0,0-2.5,5.8,28.9,28.9,0,0,0-.8,6.7,26.9,26.9,0,0,0,.8,6.5,17.6,17.6,0,0,0,2.5,5.7,12.7,12.7,0,0,0,4.4,4,13.6,13.6,0,0,0,6.7,1.5q5.3,0,8.3-3.3a15.1,15.1,0,0,0,3.7-8.6H467a26.9,26.9,0,0,1-2.3,9,21.4,21.4,0,0,1-4.9,6.8,20.8,20.8,0,0,1-7.1,4.3,26,26,0,0,1-9,1.5,27.2,27.2,0,0,1-10.9-2.1,23.4,23.4,0,0,1-8.2-5.8,25.7,25.7,0,0,1-5.1-8.7,32,32,0,0,1-1.8-10.8,33.1,33.1,0,0,1,1.8-11,26.4,26.4,0,0,1,5.1-8.9,23.3,23.3,0,0,1,8.2-5.9,28.4,28.4,0,0,1,19.2-.9,22.4,22.4,0,0,1,7,3.7,19.8,19.8,0,0,1,5.1,6,21.4,21.4,0,0,1,2.5,8.2H455.3A9.6,9.6,0,0,0,453.9,35.8Z" fill="#323232"/>
                  <path d="M538.4,21.6l19.8,52.9H546.1l-4-11.8H522.3l-4.2,11.8H506.4l20-52.9Zm.7,32.5-6.7-19.4h-.1l-6.9,19.4Z" fill="#323232"/>
                  <path d="M657.4,21.6a27.3,27.3,0,0,1,9.5,1.6,20.7,20.7,0,0,1,7.6,4.9,22.5,22.5,0,0,1,5,8.2,33,33,0,0,1,1.8,11.5,36.6,36.6,0,0,1-1.5,10.7,23.4,23.4,0,0,1-4.5,8.4,20.9,20.9,0,0,1-7.5,5.6,25.3,25.3,0,0,1-10.6,2H597.5V21.6Zm-.8,43.1a15,15,0,0,0,4.9-.8,10.8,10.8,0,0,0,4.2-2.7,13.6,13.6,0,0,0,3-4.9,21.7,21.7,0,0,0,1.1-7.4,31,31,0,0,0-.8-7.2,14.4,14.4,0,0,0-2.6-5.5,11.4,11.4,0,0,0-4.7-3.5,18.8,18.8,0,0,0-7.2-1.2H609.1V64.8Z" fill="#323232"/>
                  <path d="M760.9,21.6v9.8H732.4V42.8H758v9H732.4v13h28.5v9.8H720.7V21.6Z" fill="#323232"/>
                  <path d="M816.6,21.6,829,58h.1l11.7-36.4h16.4V74.6H846.4V37.1h-.1l-13,37.5h-9l-13-37.1h-.1V74.6H800.3V21.6Z" fill="#323232"/>
                  <path d="M896.6,21.6h13L922,42.5l12.3-20.9h13L927.7,54.3V74.6H916V54Z" fill="#323232"/>
                  <g>
                    <path d="M6.8,15.1a6.8,6.8,0,1,1,6.8-6.8,6.8,6.8,0,0,1-6.8,6.8" fill="#f5642d"/>
                    <path d="M235.9,74.6V22h12v6.9c.7-2.8,5.1-7.5,13.3-8V33.6c-6,.4-12.5,2.1-12.7,11.2h0V74.6Z" fill="#f5642d"/>
                    <path d="M94.9,75.7a27.3,27.3,0,1,1,27.2-27.3A27.3,27.3,0,0,1,94.9,75.7m.4-42.6a15.3,15.3,0,1,0,15.3,15.3A15.3,15.3,0,0,0,95.3,33.1" fill="#f5642d"/>
                    <path d="M153,75.7c-6.3-.1-10.6-1.4-15-5.6h.1l-.3,4.6H126.4V12.4L138.9,0V26.7h0a21,21,0,0,1,14.5-5.4h.1c13.8,0,25.4,12.5,25.4,27.3a27.4,27.4,0,0,1-8,19.2c-4.9,5-11.3,8-17.5,8Zm-1.5-42.5A15.3,15.3,0,0,0,139,39.7V57.2a15.3,15.3,0,1,0,12.6-24" fill="#f5642d"/>
                    <path d="M200,75.3c-11.3,0-19.2-6.7-19.2-16.3s8.4-16.6,24.4-16.6h11.5v-2c0-4.5-4.1-9.3-11.1-9.3-5,0-9.3,1.5-11.8,4l-6.7-6.7a19,19,0,0,1,2.6-2.3,27.1,27.1,0,0,1,16.4-5c13.8,0,22.7,7.6,22.7,19.3V74.7H217v-5l-1.2,1.2c-4.2,4.2-8.9,4.5-15.7,4.5m5.5-23.9c-7.9,0-11.9,2.5-11.9,7.3s3.6,6.9,9.1,6.9c8.5,0,14-4.5,14-11.3V51.4Z" fill="#f5642d"/>
                    <rect x="0.8" y="22.1" width="12.2" height="52.54" fill="#f5642d"/>
                    <path d="M24.7,59.8c5,3.7,10.1,5.4,17.3,5.4s11.9-2.4,11.9-6-3.6-5.5-13.5-6.3c-13-1.2-21.7-4.9-21.7-15.9,0-9.5,9.2-15.7,22-15.7a35.4,35.4,0,0,1,22.7,8.1l.2.2-7.2,7.4a26.4,26.4,0,0,0-16.3-5.1c-6.6,0-10.2,1.9-10.2,4.9s2.9,4.7,11.8,5.5C55.2,43.5,65.1,47.8,65.1,59S55.1,75.7,41.8,75.7c-9.6,0-17.3-2.3-24.3-8.2l-.2-.2Z" fill="#f5642d"/>
                  </g>
                </g>
              </g>
            </svg>
            <!-- img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/academy.png" alt="isobar academy" style="vertical-align: top" /-->
          </a>
        </div>
      </div>

      <?php
      /**
       * The template for displaying search form
       *
       * @package FoundationPress
       * @since FoundationPress 1.0.0
       */

      do_action( 'foundationpress_before_searchform' ); ?>
      <form class="inspire--search" role="search" method="get" id="searchform" action="<?php echo home_url( '/' ); ?>">
        <?php do_action( 'foundationpress_searchform_top' ); ?>
        <div class="input-group">
          <input type="text" class="input-group-field" value="" name="s" id="s" placeholder="<?php esc_attr_e( 'Search', 'foundationpress' ); ?>">
          <?php do_action( 'foundationpress_searchform_before_search_button' ); ?>
          <div class="input-group-button">
            <input type="submit" id="searchsubmit" value="<?php esc_attr_e( 'Search', 'foundationpress' ); ?>" class="button">
          </div>
        </div>
        <?php do_action( 'foundationpress_searchform_after_search_button' ); ?>
      </form>
      <?php do_action( 'foundationpress_after_searchform' ); ?>

      <div class="site-header--translate">
        <?php echo do_shortcode('[gtranslate]'); ?>
      </div>
      <!--div class="top-bar-right">
        <?php foundationpress_top_bar_r(); ?>

        <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
          <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
        <?php endif; ?>
      </div-->
    </nav>
  </header>

  <section class="container">
    <div class="site-header--translate site-header--translate__mobile">
      <?php echo do_shortcode('[gtranslate]'); ?>
    </div>
    <?php do_action( 'foundationpress_after_header' );
