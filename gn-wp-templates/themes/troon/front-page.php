<?php

add_filter( 'genesis_site_layout', '__genesis_return_full_width_content' );
remove_action( 'genesis_after_header', 'troon_make_singular_heading', 13 );

genesis();