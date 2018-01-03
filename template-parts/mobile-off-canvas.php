<?php
/**
 * Template part for off canvas menu
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<nav class="mobile-off-canvas-menu off-canvas position-left" id="<?php foundationpress_mobile_menu_id(); ?>" data-off-canvas data-auto-focus="false" role="navigation">
  <!--?php foundationpress_mobile_nav(); ?-->

  <!-- Close button -->
  <button class="close-button" aria-label="Close menu" type="button" data-close>
    <span aria-hidden="true">&times;</span>
  </button>

  <ul class="alm-filter-nav">
    <li><a href="#" data-post-type="post" data-posts-per-page="12" data-category="gestures-interaction" data-scroll="true" data-button-label="More Work">ANIMATION</a></li>
    <li><a href="#" data-post-type="post" data-posts-per-page="12" data-category="gestures-interaction" data-scroll="true" data-button-label="More Work">PORTFOLIO</a></li>
  </ul>
</nav>

<div class="off-canvas-content" data-off-canvas-content>

<div class="mobile-menu site-title-bar">
  <div class="title-bar-left">
    <button class="menu-icon" type="button" data-open="off-canvas-menu"></button>
  </div>
</div>
