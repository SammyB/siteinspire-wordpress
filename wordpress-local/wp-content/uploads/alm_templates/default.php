<div data-category="<?php the_field('featured_tag_ids'); ?>" data-sort="<?php the_field('featured_tag_names'); ?>" class="column column-block filtr-item">
   <h3><a href="<?php the_field('featured_url'); ?>"><?php the_title(); ?></a></h3>
   <img src="<?php the_field('featured_image') ?>" />
	 <p><?php the_field('featured_description'); ?></p>
   <?php the_excerpt(); ?>
</div>