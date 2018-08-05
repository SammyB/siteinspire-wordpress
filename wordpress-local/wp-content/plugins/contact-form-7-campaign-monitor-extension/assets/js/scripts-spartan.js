jQuery(document).ready(function() {
	try {

		if (! jQuery('#wpcf7-campaignmonitor-cf-active').is(':checked'))

			jQuery('.campaignmonitor-custom-fields').hide();

		jQuery('#wpcf7-campaignmonitor-cf-active').click(function() {

			if (jQuery('.campaignmonitor-custom-fields').is(':hidden')
			&& jQuery('#wpcf7-campaignmonitor-cf-active').is(':checked')) {

				jQuery('.campaignmonitor-custom-fields').slideDown('fast');
			}

      else if (jQuery('.campaignmonitor-custom-fields').is(':visible')
			&& jQuery('#wpcf7-campaignmonitor-cf-active').not(':checked')) {

				jQuery('.campaignmonitor-custom-fields').slideUp('fast');
        jQuery(this).closest('form').find(".campaignmonitor-custom-fields input[type=text]").val("");

			}
		});

		jQuery(".cme-trigger").click(function() {

			jQuery(".cme-support").slideToggle(300);

      jQuery(this).text(function(i, text){
          return text === "Show advanced settings" ? "Hide advanced settings" : "Show advanced settings";
      })

			return false; //Prevent the browser jump to the link anchor
		});

	}

	catch (e) {

	}

});