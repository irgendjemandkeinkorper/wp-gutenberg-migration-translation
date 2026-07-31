<?php

add_filter( 'genesis_site_layout', '__genesis_return_full_width_content' );
remove_action( 'genesis_after_header', 'golfnow_aspen_make_entry_heading', 13 );

genesis();