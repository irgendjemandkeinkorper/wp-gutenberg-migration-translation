<?php
/**
 * Prefooter section template.
 *
 * @package Sunstone Pro
 */

?>

<?php if ( is_active_sidebar( 'prefooter' ) ) : ?>
	<div class="rkv-prefooter">
		<?php dynamic_sidebar( 'prefooter' ); ?>
	</div>
<?php endif; ?>
