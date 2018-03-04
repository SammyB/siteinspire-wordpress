<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

    </section>
    <div class="footer-container" data-sticky-footer>
      <footer class="footer">
        <?php do_action( 'foundationpress_before_footer' ); ?>
        <div class="row">
          <div class="small-12 medium-9 columns text-center medium-text-left">
            <?php dynamic_sidebar( 'footer-widgets' ); ?>
          </div>
          <div class="small-12 medium-3 columns text-center medium-text-right">
            <a href="mailto:Brandon.Lucas@isobar.com?Subject=Site%20Inspire%20Inquiry">CONTACT US</a>
          </div>
        </div>
        <div class="row">
         <div class="columns text-center small-12 medium-text-right">
          <a href="http://www.isobar.com/global/en/work/" target="_blank"><strong>SEE MORE OF ISOBAR'S INSPIRATION WORK HERE.</strong></a>
         </div>
        </div>
        <?php do_action( 'foundationpress_after_footer' ); ?>
      </footer>
    </div>

    <?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
    </div><!-- Close off-canvas content -->
  </div><!-- Close off-canvas wrapper -->
<?php endif; ?>

<script type="text/javascript" src="https://static.addtoany.com/menu/page.js"></script>
<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>
</body>
</html>
