<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'wordpress');

/** MySQL database username */
define('DB_USER', 'wordpress');

/** MySQL database password */
define('DB_PASSWORD', 'wordpress');

/** MySQL hostname */
define('DB_HOST', 'db:3306');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8mb4');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'm) G1&Q (_m!X=Yu@t1,DKW7Y>1t,s>3D7n=gDBwO,epLR=12aBZ|NM}nPxn Y{2');
define('SECURE_AUTH_KEY',  'Z.^9dFtY3pj;F|BbtRbZA-*P?%h/_P*`<sLyFn@GVnsSEWt!B[/$y-@%fd,y.V,h');
define('LOGGED_IN_KEY',    '~wPhILWx`>5[E!%p^MfnZ!U:O+a==,PV8|vU{l >vIBVYFbBYoxf5>%+`jVAMcV%');
define('NONCE_KEY',        ',Im})Z0y<}+]Ut75D15x?F$9:bdv9S~XaXstP$SQuJFo(2/SR*^u|2?Uei@Pk.@l');
define('AUTH_SALT',        'k?G>^^>,s*]fI%q2<F-`dl{7Wg1>/PHd3E]r_H8&%<|b]VvtD4R51::9%GN=VnCx');
define('SECURE_AUTH_SALT', 'r]H`zBNKA]:u 5oQU}IV]?&P=D=%Cd[#cR-CIL<,3J?`mwsG%0l{tQk5dEo(GR_+');
define('LOGGED_IN_SALT',   '}ElaeHC,]|dG5nt$!V({BQvp2E@`#i`%(H=(y(+q)x;t39HpS%1(+Q_lw6=.mAAu');
define('NONCE_SALT',       '?4Coun%>hIGY%uDWS.,,?Y=I)R7 CanPpOHkIJop~OiDwpp&*;I3S@HP&,`|l~8H');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
