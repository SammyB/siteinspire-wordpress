<?php
/*  Copyright 2013-2017 Renzo Johnson (email: renzojohnson at gmail.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/



function cme_author() {

	$author_pre = 'Contact form 7 Campaign Monitor extension by ';
	$author_name = 'Renzo Johnson';
	$author_url = '//renzojohnson.com';
	$author_title = 'Renzo Johnson - Web Developer - Campaign Monitor - contact form 7';

	$cme_author = '<p style="display: none !important">';
  $cme_author .= $author_pre;
  $cme_author .= '<a href="'.$author_url.'" ';
  $cme_author .= 'title="'.$author_title.'" ';
  $cme_author .= 'target="_blank">';
  $cme_author .= ''.$author_title.'';
  $cme_author .= '</a>';
  $cme_author .= '</p>'. "\n";

  return $cme_author;
}



function cme_referer() {

  // $cme_referer_url = $THE_REFER=strval(isset($_SERVER['HTTP_REFERER']));

  if(isset($_SERVER['HTTP_REFERER'])) {

    $cme_referer_url = $_SERVER['HTTP_REFERER'];

  } else {

    $cme_referer_url = 'direct visit';

  }

	$cme_referer = '<p style="display: none !important"><span class="wpcf7-form-control-wrap referer-page">';
  $cme_referer .= '<input type="text" name="referer-page" ';
  $cme_referer .= 'value="'.$cme_referer_url.'" ';
  $cme_referer .= 'size="40" class="wpcf7-form-control wpcf7-text referer-page" aria-invalid="false">';
  $cme_referer .= '</span></p>'. "\n";

  return $cme_referer;
}



function cme_getRefererPage( $form_tag ) {

  if ( $form_tag['name'] == 'referer-page' ) {
          $form_tag['values'][] = $_SERVER['HTTP_REFERER'];
  }
  return $form_tag;
}

if ( !is_admin() ) {
        add_filter( 'wpcf7_form_tag', 'cme_getRefererPage' );
}

add_action( 'init', 'cme_init_constants' );
function cme_init_constants(){

  define( 'CME_URL', '//renzojohnson.com/contributions/contact-form-7-campaign-monitor-extension' );
  define( 'CME_AUTH', '//renzojohnson.com' );
  define( 'CME_AUTH_COMM', '<!-- campaignmonitor extension by Renzo Johnson -->' );
  define( 'CME_NAME', 'Campaign Monitor Extension' );
  define( 'CME_SETT', admin_url( 'admin.php?page=wpcf7&post='.cm_get_latest_item().'&active-tab=4' ) );
  define( 'CME_DON', 'https://www.paypal.me/renzojohnson' );

}

function cm_get_latest_item(){
    $args = array(
            'post_type'         => 'wpcf7_contact_form',
            'posts_per_page'    => -1,
            'fields'            => 'ids',
        );
    // Get Highest Value from CF7Forms
    $form = max(get_posts($args));
    $out = '';
    if (!empty($form)) {
        $out .= $form;
    }
    return $out;
}



function wpcf7_form_cme_tags() {
  // $manager = WPCF7_FormTagsManager::get_instance();
  $manager = class_exists('WPCF7_FormTagsManager') ? WPCF7_FormTagsManager::get_instance() : WPCF7_ShortcodeManager::get_instance(); // ff cf7 4.6 and earlier
  $form_tags = $manager->get_scanned_tags();
  return $form_tags;
}


function cme_mail_tags() {

  $listatags = wpcf7_form_cme_tags();
  $tag_submit = array_pop($listatags);
  $tagInfo = '';

    foreach($listatags as $tag){

      $tagInfo .= '<span class="mailtag code used">[' . $tag['name'].']</span>';

    }

  return $tagInfo;

}
