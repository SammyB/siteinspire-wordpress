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


function cme_error() {

  if( !file_exists(WP_PLUGIN_DIR.'/contact-form-7/wp-contact-form-7.php') ) {

    $cme_error_out = '<div class="error" id="messages"><p>';
    $cme_error_out .= __('The Contact Form 7 plugin must be installed for the <b>Campaign Monitor Extension</b> to work. <b><a href="'.admin_url('plugin-install.php?tab=plugin-information&plugin=contact-form-7&from=plugins&TB_iframe=true&width=600&height=550').'" class="thickbox" title="Contact Form 7">Install Contact Form 7  Now.</a></b>', 'cme_error');
    $cme_error_out .= '</p></div>';
    echo $cme_error_out;

  } else if ( !class_exists( 'WPCF7') ) {

    $cme_error_out = '<div class="error" id="messages"><p>';
    $cme_error_out .= __('The Contact Form 7 is installed, but <strong>you must activate Contact Form 7</strong> below for the <b>Campaign Monitor Extension</b> to work.','cme_error');
    $cme_error_out .= '</p></div>';
    echo $cme_error_out;

  }

}
add_action('admin_notices', 'cme_error');



function cme_act_redirect( $plugin ) {

  if( $plugin == SPARTAN_CME_PLUGIN_BASENAME ) {

    exit( wp_redirect( admin_url( 'admin.php?page=wpcf7&post='.cm_get_latest_item().'&active-tab=4' ) ) );

  }

}
add_action( 'activated_plugin', 'cme_act_redirect' );



if (get_site_option('cme_show_notice') == 1){

  function cme_show_update_notice() {

    if(!current_user_can( 'manage_options')) return;

    $class = 'notice is-dismissible vc-notice welcome-panel';

    $message = '<h2>'.esc_html__('Campaign Monitor has been improved!', 'mail-chimp-extension').'</h2>';
    $message .= '<p class="about-description">'.esc_html__('We worked hard to make it more reliable, faster, and now with a better Debugger, and more help documents.', 'mail-chimp-extension').'</p>';


    $message .= sprintf(__('<div class="welcome-panel-column-container"><div class="welcome-panel-column"><h3>Get Started</h3><p>Make sure it works as you expect <br><a class="button button-primary button-hero load-customize" href="%s">Review your settings <span alt="f111" class="dashicons dashicons-admin-generic" style="font-size: 17px;vertical-align: middle;"> </span> </a>', 'mail-chimp-extension'), CME_SETT ).'</p></div>';


    $message .= '<div class="welcome-panel-column"><h3>Next Steps</h3><p>'.__('Help me develop the plugin and provide support by <br><a class="donate button button-primary button-hero load-customize" href="' . CME_DON . '" target="_blank">Donating even a small sum <span alt="f524" class="dashicons dashicons-tickets-alt"> </span></a>', 'mail-chimp-extension').'</p></div></div>';

    global $wp_version;

    if( version_compare($wp_version, '4.2') < 0 ){

      $message .= ' | <a id="cme-dismiss-notice" href="javascript:cme_dismiss_notice();">'.__('Dismiss this notice.').'</a>';

    }
    echo '<div id="cme-notice" class="'.$class.'"><div class="welcome-panel-content">'.$message. '</div></div>';
    echo "<script>
        function cme_dismiss_notice(){
          var data = {
          'action': 'cme_dismiss_notice',
          };

          jQuery.post(ajaxurl, data, function(response) {
            jQuery('#cme-notice').hide();
          });
        }

        jQuery(document).ready(function(){
          jQuery('body').on('click', '.notice-dismiss', function(){
            cme_dismiss_notice();
          });
        });
        </script>";
  }

  if(is_multisite()){

    add_action( 'network_admin_notices', 'cme_show_update_notice' );

  } else {

    add_action( 'admin_notices', 'cme_show_update_notice' );

  }
  add_action( 'wp_ajax_cme_dismiss_notice', 'cme_dismiss_notice' );

  function cme_dismiss_notice() {

    $result = update_site_option('cme_show_notice', 0);
    return $result;
    wp_die();
  }

}


function cme_help() {

  if (get_site_option('cme_show_notice') == NULL){
    update_site_option('cme_show_notice', true);
  }

}
