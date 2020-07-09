<?php
/**
 * The template for displaying search results pages.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<!-- background -->
<canvas class="background"></canvas>
<div class="main-wrap" role="main">

	<?php do_action( 'foundationpress_before_content' ); ?>

	<article <?php post_class('main-content') ?> id="search-results">
		<header>
			<div class="row">
				<div class="small-12 columns">
					<h1 class="entry-title"><?php _e( 'Search Results for', 'foundationpress' ); ?> "<?php echo get_search_query(); ?>"</h1>
				</div>
			</div>
		</header>
		<div class="row">
			<div class="small-12 columns">
				<?php if ( have_posts() ) : ?>

					<?php while ( have_posts() ) : the_post(); ?>
						<?php get_template_part( 'template-parts/content', get_post_format() ); ?>
					<?php endwhile; ?>

				<?php else : ?>
					<?php get_template_part( 'template-parts/content', 'none' ); ?>

				<?php endif; ?>

				<?php do_action( 'foundationpress_before_pagination' ); ?>

				<?php
				if ( function_exists( 'foundationpress_pagination' ) ) :
					foundationpress_pagination();
				elseif ( is_paged() ) :
					?>

					<nav id="post-nav">
						<div class="post-previous"><?php next_posts_link( __( '&larr; Older posts', 'foundationpress' ) ); ?></div>
						<div class="post-next"><?php previous_posts_link( __( 'Newer posts &rarr;', 'foundationpress' ) ); ?></div>
					</nav>
				<?php endif; ?>
			</div>
		</div>

	</article>
</div>
<?php get_footer();
