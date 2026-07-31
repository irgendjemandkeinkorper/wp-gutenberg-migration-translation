<?php
/**
 * @var int $hero_image_id
 * @var string $hero_image_url
 */
?>

<h3><?php esc_html_e( 'Hero image', 'cet-wp-theme-indigo' ); ?></h3>
<p><?php esc_html_e( 'Select a custom hero image.', 'cet-wp-theme-indigo' ); ?></p>

<div data-hero-meta-wrapper-id="hero-image-preview-wrapper" style="margin-bottom:10px;">
    <?php if ( $hero_image_url ) : ?>
        <img
            id="hero-image-preview"
            src="<?php echo esc_url( $hero_image_url ); ?>"
            alt=""
            style="max-width:100%;height:auto;display:block;"
        />
    <?php else : ?>
        <img
            data-hero-meta-preview-id="hero-image-preview"
            src=""
            alt=""
            style="max-width:100%;height:auto;display:none;"
        />
    <?php endif; ?>
</div>

<input
    type="hidden"
    data-hero-meta-value-id="hero_image"
    name="hero_image"
    value="<?php echo esc_attr( $hero_image_id ); ?>"
/>

<p>
    <button type="button" class="button" data-hero-meta-upload-id="hero-image-upload">
        <?php esc_html_e( 'Select image', 'cet-wp-theme-indigo' ); ?>
    </button>

    <button
        type="button"
        class="button"
        data-hero-meta-remove-id="hero-image-remove"
        <?php echo $hero_image_id ? '' : 'style="display:none;"'; ?>
    >
        <?php esc_html_e( 'Remove image', 'cet-wp-theme-indigo' ); ?>
    </button>
</p>