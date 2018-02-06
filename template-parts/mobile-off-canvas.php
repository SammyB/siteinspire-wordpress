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

  <div class="inspire--mobile inspire__left">
    <div class="inspire__filter">
      <svg class="inspire--mobile__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 727 198.5">
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path d="M7,15.1a6.8,6.8,0,1,1,6.8-6.8A6.8,6.8,0,0,1,7,15.1" fill="#f5642d"/>
            <path d="M236,74.6V22h12v6.9c.7-2.8,5.1-7.5,13.3-8V33.6c-6,.4-12.5,2.1-12.7,11.2h0V74.6Z" fill="#f5642d"/>
            <path d="M95.1,75.7a27.3,27.3,0,1,1,27.2-27.3A27.3,27.3,0,0,1,95.1,75.7m.4-42.6a15.3,15.3,0,1,0,15.3,15.3A15.3,15.3,0,0,0,95.5,33.1" fill="#f5642d"/>
            <path d="M153.2,75.7c-6.3-.1-10.6-1.4-15-5.6h.1l-.3,4.6H126.6V12.4L139.1,0V26.7h0a21,21,0,0,1,14.5-5.4h.1c13.8,0,25.4,12.5,25.4,27.3a27.4,27.4,0,0,1-8,19.2c-4.9,5-11.3,8-17.5,8Zm-1.5-42.5a15.3,15.3,0,0,0-12.6,6.6V57.2a15.3,15.3,0,1,0,12.6-24" fill="#f5642d"/>
            <path d="M200.2,75.3C188.9,75.3,181,68.6,181,59s8.4-16.6,24.4-16.6h11.5v-2c0-4.5-4.1-9.3-11.1-9.3-5,0-9.3,1.5-11.8,4l-6.7-6.7a19,19,0,0,1,2.6-2.3,27.1,27.1,0,0,1,16.4-5c13.8,0,22.7,7.6,22.7,19.3V74.7H217.2v-5l-1.2,1.2c-4.2,4.2-8.9,4.5-15.7,4.5m5.5-23.9c-7.9,0-11.9,2.5-11.9,7.3s3.6,6.9,9.1,6.9c8.5,0,14-4.5,14-11.3V51.4Z" fill="#f5642d"/>
            <rect x="1" y="22.1" width="12.2" height="52.54" fill="#f5642d"/>
            <path d="M24.9,59.8c5,3.7,10.1,5.4,17.3,5.4s11.9-2.4,11.9-6-3.6-5.5-13.5-6.3c-13-1.2-21.7-4.9-21.7-15.9,0-9.5,9.2-15.7,22-15.7a35.4,35.4,0,0,1,22.7,8.1l.2.2-7.2,7.4a26.4,26.4,0,0,0-16.3-5.1c-6.6,0-10.2,1.9-10.2,4.9s2.9,4.7,11.8,5.5C55.4,43.5,65.2,47.8,65.2,59S55.3,75.7,42,75.7c-9.6,0-17.3-2.3-24.3-8.2l-.2-.2Z" fill="#f5642d"/>
            <polygon points="330.9 198.5 324.1 194.1 317.3 198.5 317.3 185.4 330.9 185.4 330.9 198.5" fill="#f5642d"/>
            <path d="M37.4,119l23.2,62H46.4l-4.7-13.8H18.6L13.7,181H0l23.4-62Zm.8,38-7.8-22.7h-.2L22.1,157Z" fill="#ffffff"/>
            <path d="M149.1,135.6a13.7,13.7,0,0,0-3-3.4,14,14,0,0,0-4.1-2.3,14.2,14.2,0,0,0-4.8-.8,15.9,15.9,0,0,0-7.8,1.8,14.7,14.7,0,0,0-5.2,4.8,21,21,0,0,0-2.9,6.8,33.9,33.9,0,0,0-.9,7.9,31.5,31.5,0,0,0,.9,7.6,20.6,20.6,0,0,0,2.9,6.6,14.9,14.9,0,0,0,5.2,4.7,15.9,15.9,0,0,0,7.8,1.8q6.2,0,9.8-3.8a17.7,17.7,0,0,0,4.3-10.1h13.2a31.5,31.5,0,0,1-2.7,10.5,25.1,25.1,0,0,1-5.7,8,24.3,24.3,0,0,1-8.3,5,30.5,30.5,0,0,1-10.5,1.7,31.8,31.8,0,0,1-12.8-2.5,27.4,27.4,0,0,1-9.6-6.8,30.1,30.1,0,0,1-6-10.2,37.4,37.4,0,0,1-2.1-12.6,38.7,38.7,0,0,1,2.1-12.9,30.9,30.9,0,0,1,6-10.4,27.3,27.3,0,0,1,9.6-6.9,33.2,33.2,0,0,1,22.5-1,26.3,26.3,0,0,1,8.2,4.3,23.2,23.2,0,0,1,5.9,7,25,25,0,0,1,3,9.5H150.7A11.2,11.2,0,0,0,149.1,135.6Z" fill="#ffffff"/>
            <path d="M248,119l23.2,62H257l-4.7-13.8H229.2L224.3,181H210.6L234,119Zm.8,38L241,134.3h-.2L232.7,157Z" fill="#ffffff"/>
            <path d="M387.4,119a32,32,0,0,1,11.2,1.9,24.2,24.2,0,0,1,8.9,5.7,26.4,26.4,0,0,1,5.9,9.5,38.7,38.7,0,0,1,2.1,13.5,42.9,42.9,0,0,1-1.7,12.5,27.5,27.5,0,0,1-5.3,9.9,24.5,24.5,0,0,1-8.8,6.6,29.6,29.6,0,0,1-12.4,2.4H317.3V119Zm-1,50.5a17.6,17.6,0,0,0,5.7-1,12.6,12.6,0,0,0,4.9-3.2,16,16,0,0,0,3.5-5.8,25.4,25.4,0,0,0,1.3-8.7,36.3,36.3,0,0,0-.9-8.5,16.9,16.9,0,0,0-3-6.5,13.3,13.3,0,0,0-5.5-4.1,22,22,0,0,0-8.5-1.4H330.9v39.1Z" fill="#ffffff"/>
            <path d="M508.7,119v11.5H475.3v13.3h30v10.6h-30v15.2h33.4V181h-47V119Z" fill="#ffffff"/>
            <path d="M574,119l14.5,42.6h.2L602.3,119h19.2v62H608.8V137.1h-.2L593.4,181H582.9l-15.2-43.5h-.2V181H554.8V119Z" fill="#ffffff"/>
            <path d="M667.6,119h15.3l14.5,24.5L711.8,119H727l-23,38.2V181H690.4V156.9Z" fill="#ffffff"/>
          </g>
        </g>
      </svg>
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
    </div>
  </div>
</nav>

<div class="off-canvas-content" data-off-canvas-content>

<div class="mobile-menu site-title-bar">
  <div class="title-bar-right">
    <button class="menu-icon" type="button" data-open="off-canvas-menu"></button>
  </div>
</div>
