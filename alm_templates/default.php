<div class="column column-block filtr-item" data-category="<?php the_field('featured_tag_ids'); ?>" data-sort="value" data-tags="<?php the_field('featured_tag_names'); ?>">
  <div class="heading"><?php the_title(); ?></div>
  <a href="#"
    data-featherlight="#mylightbox"
    data-image="<?php the_field('featured_image') ?>"
    data-title="<?php the_title(); ?>"
    data-link="<?php the_field('featured_url') ?>"
    data-description="<?php the_field('featured_description') ?>"
  >
    <img src="<?php the_field('featured_image') ?>" alt="<?php the_title(); ?>" />
  </a>
  <div class="tags" data-filter="<?php the_field('featured_tag_ids') ?>"><?php the_field('featured_tag_names') ?></div>
</div>
