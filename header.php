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

		<title>Dentsu Creative Inspiration - The latest in website, apps and site tech inspiration delivered to you monthly.</title>

		<meta name="og:title" content="Dentsu Creative Inspiration - The latest in website, apps and site tech inspiration delivered to you monthly.">
		<meta name="og:description" content="Powered by Dentsu Creative Inspiration, this site is curated once a month to keep you inspired in your daily work life.">
		<meta property="og:image" name="og:image" content="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/og-image.png">
		<script src="//cdnjs.cloudflare.com/ajax/libs/particlesjs/2.2.3/particles.min.js" type="application/javascript"></script>


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
						<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/DCA-logo.png" alt="dentsu creative inspiration" style="vertical-align: top" />
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
