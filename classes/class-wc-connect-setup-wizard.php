<?php

if ( ! class_exists( 'WC_Connect_Setup_Wizard' ) ) {

	class WC_Connect_Setup_Wizard {

		/*
		 * Add a new WCS shipping step to the setup wizard.
		 *
		 * @param array $steps - wizard info steps
		 * @return array - modified steps
		 */
		public function add_new_shipping_step( $steps ) {
			$index = array_search( 'shipping_taxes', array_keys( $steps ) ) + 1;
			if( false === $index ) {
				return $steps;
			}

			$beginning = array_slice( $steps, 0, $index );
			$end = array_slice( $steps, $index );

			$new_shipping_step = array(
				'wcs_shipping' => array(
					'name'    => 'WooCommerce Services Shipping Setup',
					'view'    => array( $this, 'render_wcs_shipping_step' ),
					'handler' => ''
				)
			);

			return $beginning + $new_shipping_step + $end;
		}

		/*
		 * Render the WCS shipping wizard screen.
		 *
		 * @param WC_Admin_Setup_Wizard $setup_wizard
		 */
		public function render_wcs_shipping_step( $setup_wizard ) {
				$shipping_enabled = 'disabled' === get_option( 'woocommerce_ship_to_countries' )
					? 'Disabled'
					: 'Enabled';
				$is_shipping_enabled = 'disabled' !== get_option( 'woocommerce_ship_to_countries' );
				$default_country = get_option( 'woocommerce_default_country' );
			?>
			<h1><?php _e( 'Add a WooCommerce shipping service to a Zone' ,'woocommerce-services' ) ?></h1>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vehicula fermentum mollis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae.</p>
			<h2>Things we know</h2>
			<p><strong>Shipping:</strong> <?php echo esc_html( $shipping_enabled ) ?></p>
			<p><strong>Default country:</strong> <?php echo esc_html( $default_country ) ?></p>
			<p><strong>Currency:</strong> <?php echo esc_html( get_option( 'woocommerce_currency' ) ) ?></p>
			<p><strong>Weight unit:</strong> <?php echo esc_html( get_option( 'woocommerce_weight_unit' ) ) ?></p>
			<p><strong>Dimension unit:</strong> <?php echo esc_html( get_option( 'woocommerce_dimension_unit' ) ) ?></p>
			<?php
			if (
				'us' === strtolower( substr( $default_country, 0, 2 ) ) &&
				true === $is_shipping_enabled
			) {
				// For now, connect to Jetpack
				// TODO: make sure Jetpack is installed & activated
				// The wizard setup URL is hardcoded in WC
				$redirect_url = admin_url( 'index.php?page=wc-setup&step=wcs_shipping' );
			?>
				<p class="wc-setup-actions">
					<a
						class="button-primary button button-large button-next"
						href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, $redirect_url, 'wcs' ) ); ?>"
					>
						<?php esc_html_e( 'Connect to Jetpack', 'woocommerce-services' ); ?>
					</a>
				<p>
			<?php
			}
			?>
			<p class="wc-setup-actions step">
				<a class="button-primary button button-large button-next" href="<?php echo esc_url( $setup_wizard->get_next_step_link() ); ?>">Continue</a>
			</p>
			<?php
		}

	}

}
