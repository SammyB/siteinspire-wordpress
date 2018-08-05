<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>
  <header>
    <h2><a href="<?php the_field('featured_url') ?>"><?php the_title(); ?></a></h2>
    <?php foundationpress_entry_meta(); ?>
  </header>
  <div class="entry-content">
    <?php if( get_field('featured_image') ): ?>
      <a href="<?php the_field('featured_url') ?>"><img src="<?php the_field('featured_image') ?>" /></a>
    <?php endif; ?>

    <div class="a2a_kit a2a_single a2a_kit_size_32 a2a_default_style" data-a2a-url="<?php the_field('featured_url') ?>" data-a2a-title="<?php the_title() ?>">
      <a class="a2a_button_facebook"></a>
      <a class="a2a_button_twitter"></a>
      <a class="a2a_dd" href="https://www.addtoany.com/share"></a>
    </div>
    <script type="text/javascript">
      var a2a_config = a2a_config || {};
      a2a.init('page');
    </script>

    <?php the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
  </div>
  <footer>
    <?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
  </footer>
  <hr />
</div>
