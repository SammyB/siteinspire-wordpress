<div class="column column-block filtr-item" data-category="<?php the_field('featured_tag_ids'); ?>" data-sort="value" data-tags="<?php the_field('featured_tag_names'); ?>">

<a href="#"
    data-featherlight="#mylightbox"
    data-image="<?php the_field('featured_image') ?>"
    data-title="<?php the_title(); ?>"
    data-link="<?php the_field('featured_url') ?>"
    data-description="<?php the_field('featured_description') ?>"
  >
    <div class="filtr-item__image">
      <img src="<?php the_field('featured_image') ?>" alt="<?php the_title(); ?>" title="<?php the_title(); ?>" />

      <div class="a2a_kit a2a_kit_size_16 a2a_default_style" data-a2a-url="<?php the_field('featured_url') ?>" data-a2a-title="<?php the_title() ?>">
        <a class="a2a_button_facebook"></a>
        <a class="a2a_button_twitter"></a>
        <a class="a2a_button_linkedin"></a>
        <a class="a2a_button_email"></a>
        <a class="a2a_dd" href="https://www.addtoany.com/share"></a>
      </div>
    </div>
  </a>
  <div class="filtr-item__inner">
    <div class="heading"><?php the_title(); ?></div>
    <div class="description"><?php the_field('featured_description') ?></div>
    <div class="tags" data-filter="<?php the_field('featured_tag_ids') ?>">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
        <path fill="#676373" fill-rule="evenodd" d="M13.51 8.481a2.177 2.177 0 0 1-.62-1.52c0-.57.239-1.117.62-1.473a2.165 2.165 0 0 1 1.521-.641c.547 0 1.094.237 1.499.64.428.38.642.904.642 1.498 0 .546-.238 1.093-.642 1.496a2.085 2.085 0 0 1-1.499.618 2.1 2.1 0 0 1-1.522-.618m-1.855 12.473l9.466-9.48c.57-.546.88-1.306.88-2.043v-.094l-.856-7.912c-.024-.285-.286-.546-.571-.593L12.629 0h-.095a3.137 3.137 0 0 0-2.07.879l-9.417 9.479A3.614 3.614 0 0 0 0 12.9c0 .88.357 1.734.975 2.352l5.803 5.797c1.285 1.307 3.497 1.26 4.876-.095"/>
      </svg>
      <p><?php the_field('featured_tag_names') ?></p>
    </div>
    <script type="text/javascript">
      var a2a_config = a2a_config || {};
      a2a.init('page');
    </script>

  </div>
</div>
