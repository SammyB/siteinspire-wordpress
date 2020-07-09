<?php
  /*
  Template Name: Archives
  */
  get_header(); ?>

  <!-- background -->
  <canvas class="background"></canvas>

  <?php do_action( 'foundationpress_before_content' ); ?>

  <div class='row'>
    <div class="small-12 colums text-center">
      <h1 class="inspire--h1">Inspiration Archive</h1>
      <p>Below is a list of archives by year and month.</p>
    </div>
  </div>

  <?php

    echo "<div class='row inspire--webArchived'><div class='small-10 small-offset-1 medium-12 columns'>";

    global $wpdb;
    $limit = 0;
    $year_prev = null;
    $months = $wpdb->get_results( "SELECT DISTINCT MONTH( post_date ) AS month ,  YEAR( post_date ) AS year, COUNT( id ) as post_count FROM $wpdb->posts WHERE post_status = 'publish' and post_date <= now( ) and post_type = 'post' GROUP BY month , year ORDER BY post_date DESC" );
    foreach( $months as $month ) :
        $year_current = $month->year;
        if ( $year_current != $year_prev ) {
            if ( $year_prev != null ) { ?>
            <?php } ?>
            <h3><a href="<?php bloginfo('url') ?>/<?php echo $month->year; ?>/"><?php echo $month->year; ?></a></h3>
        <?php } ?>
        <li><a href="<?php bloginfo('url') ?>/<?php echo $month->year; ?>/<?php echo date("m", mktime(0, 0, 0, $month->month, 1, $month->year)) ?>"><span class="archive-month"><?php echo date_i18n("F", mktime(0, 0, 0, $month->month, 1, $month->year)) ?></span></a></li>
        <?php $year_prev = $year_current;
        if( ++$limit >= 18 ) { break; }
    endforeach;


    do_action( 'foundationpress_after_content' );

    echo "</div></div>";
    get_footer();
  ?>
