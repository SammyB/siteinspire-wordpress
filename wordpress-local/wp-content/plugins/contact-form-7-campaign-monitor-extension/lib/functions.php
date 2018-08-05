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

resetlogfile_cm();  //para resetear

function wpcf7_cm_add_campaignmonitor($args) {
	$cf7_cm_defaults = array();
	$cf7_cm = get_option( 'cf7_cm_'.$args->id(), $cf7_cm_defaults );

	$host = esc_url_raw( $_SERVER['HTTP_HOST'] );
	$url = $_SERVER['REQUEST_URI'];
	$urlactual = $url;

  include SPARTAN_CME_PLUGIN_DIR . '/lib/view.php';

}


function resetlogfile_cm() {
	if ( isset( $_REQUEST['cme_reset_log'] ) ) {

		$cme_debug_logger = new cme_Debug_Logger();

		$cme_debug_logger->reset_cme_log_file( 'log.txt' );
		$cme_debug_logger->reset_cme_log_file( 'log-cron-job.txt' );
		echo '<div id="message" class="updated notice notice-success is-dismissible"><p>Debug log files have been reset!</p></div>';
	}
}

function wpcf7_cm_save_campaignmonitor($args) {

	if(!empty($_POST)){
		update_option( 'cf7_cm_'.$args->id(), $_POST['wpcf7-campaignmonitor'] );
	}
}
add_action( 'wpcf7_after_save', 'wpcf7_cm_save_campaignmonitor' );



function show_cm_metabox ( $panels ) {

	$new_page = array(
		'cme-Extension' => array(
			'title' => __( 'Cmpgn Monitor', 'contact-form-7' ),
			'callback' => 'wpcf7_cm_add_campaignmonitor'
		)
	);

	$panels = array_merge($panels, $new_page);

	return $panels;

}
add_filter( 'wpcf7_editor_panels', 'show_cm_metabox' );



function spartan_cme_author_wpcf7( $cme_supps, $class, $content, $args  ) {

	$cf7_cm_defaults = array();
	$cf7_cm = get_option( 'cf7_cm_'.$args->id(), $cf7_cm_defaults );
	// $cfsupp = $cf7_cm['cf-supp'];
  $cfsupp = ( isset( $cf7_cm['cf-supp'] ) ) ? $cf7_cm['cf-supp'] : 0;


  if ( 1 == $cfsupp ) {

	 	$cme_supps .= cme_referer();
	 	$cme_supps .= cme_author();

	 } else {
	 	$cme_supps .= cme_referer();
	 	$cme_supps .= CME_AUTH_COMM;
	 }

	return $cme_supps;

}
add_filter('wpcf7_form_response_output', 'spartan_cme_author_wpcf7', 40, 4);



function wpcf7_cm_subscribe($obj) {

	$cf7_cm = get_option( 'cf7_cm_'.$obj->id() );
	$submission = WPCF7_Submission::get_instance();

  $logfileEnabled = isset($cf7_cm['logfileEnabled']) && !is_null($cf7_cm['logfileEnabled']) ? $cf7_cm['logfileEnabled'] : false;

	if( $cf7_cm ) {
		$subscribe = false;

		$regex = '/\[\s*([a-zA-Z_][0-9a-zA-Z:._-]*)\s*\]/';
		$callback = array( &$obj, 'cf7_cm_callback' );

		$email = cf7_cm_tag_replace( $regex, $cf7_cm['email'], $submission->get_posted_data() );
		$name = cf7_cm_tag_replace( $regex, $cf7_cm['name'], $submission->get_posted_data() );

		$lists = cf7_cm_tag_replace( $regex, $cf7_cm['list'], $submission->get_posted_data() );
		$listarr = explode(',',$lists);


		if( isset($cf7_cm['accept']) && strlen($cf7_cm['accept']) != 0 ) {

			$accept = cf7_cm_tag_replace( $regex, $cf7_cm['accept'], $submission->get_posted_data() );

			if($accept != $cf7_cm['accept']) {

				if(strlen($accept) > 0)
					$subscribe = true;
			}

		} else {

			$subscribe = true;

		}

		for($i=1;$i<=20;$i++) {

			if( isset($cf7_cm['CustomKey'.$i]) && isset($cf7_cm['CustomValue'.$i]) && strlen(trim($cf7_cm['CustomValue'.$i])) != 0 ) {

				$CustomFields[] = array('Key'=>trim($cf7_cm['CustomKey'.$i]), 'Value'=>cf7_cm_tag_replace( $regex, trim($cf7_cm['CustomValue'.$i]), $submission->get_posted_data() ) );

			}

		}

		if( isset($cf7_cm['resubscribeoption']) && strlen($cf7_cm['resubscribeoption']) != 0 ){

			$ResubscribeOption = true;

		} else {

			$ResubscribeOption = false;
		}

		if($subscribe && $email != $cf7_cm['email']){

			try {

        require_once( SPARTAN_CME_PLUGIN_DIR .'/api/csrest_subscribers.php' );

				$wrap = new SPARTAN_CS_REST_Subscribers( trim($listarr[0]), $cf7_cm['api'] );

				foreach($listarr as $listid) {

					if( empty($CustomFields) ){

						$CustomFields = array();

					}

					$wrap->set_list_id( trim( $listid ) );

					$result = $wrap->add( array(
						'EmailAddress' => $email,
						'Name' => $name,
						'CustomFields' => $CustomFields,
						'Resubscribe' => $ResubscribeOption
					) );

				}

        $resultsend = $result->response;
				$resultfinal = $resultsend;
        $resultfinal = ( is_null( $resultfinal ) or trim( $resultfinal ) == ''   ) ? 'Email sent Ok' : $resultfinal;

				$cme_debug_logger = new cme_Debug_Logger();
				$cme_debug_logger->log_cme_debug( 'Email submission - Result: ' . $resultfinal, 1, $logfileEnabled );

			} catch ( Exception $e ) {

      		//echo 'Error, check your error log file for details';
		 		$cme_debug_logger = new cme_Debug_Logger();
				$cme_debug_logger->log_cme_debug( 'Email submission - Result: ' . $e->getMessage(), 4, $logfileEnabled );

      }

		}

	}


}
add_action( 'wpcf7_before_send_mail', 'wpcf7_cm_subscribe' );



function cf7_cm_tag_replace( $pattern, $subject, $posted_data, $html = false ) {
	if( preg_match($pattern,$subject,$matches) > 0)
	{

		if ( isset( $posted_data[$matches[1]] ) ) {
			$submitted = $posted_data[$matches[1]];

			if ( is_array( $submitted ) )
				$replaced = join( ', ', $submitted );
			else
				$replaced = $submitted;

			if ( $html ) {
				$replaced = strip_tags( $replaced );
				$replaced = wptexturize( $replaced );
			}

			$replaced = apply_filters( 'wpcf7_mail_tag_replaced', $replaced, $submitted );

			return stripslashes( $replaced );
		}

		if ( $special = apply_filters( 'wpcf7_special_mail_tags', '', $matches[1] ) )
			return $special;

		return $matches[0];
	}
	return $subject;
}



function cme_ext_author_form_class_attr( $class ) {

  $class .= ' cmonitor-ext-' . SPARTAN_CME_VERSION;
  return $class;

}
add_filter( 'wpcf7_form_class_attr', 'cme_ext_author_form_class_attr' );

