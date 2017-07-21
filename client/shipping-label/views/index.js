/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Gridicon from 'gridicons';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import PrintLabelDialog from './purchase';
import RefundDialog from './refund';
import ReprintDialog from './reprint';
import TrackingLink from './tracking-link';
import Spinner from 'components/spinner';
import Tooltip from 'components/tooltip';
import formatDate from 'lib/utils/format-date';
import timeAgo from 'lib/utils/time-ago';
import * as ShippingLabelActions from 'shipping-label/state/actions';
import notices from 'notices';
import GlobalNotices from 'components/global-notices';
import getFormErrors from 'shipping-label/state/selectors/errors';
import canPurchase from 'shipping-label/state/selectors/can-purchase';
import Notice from 'components/notice';

class ShippingLabelRootView extends Component {
	constructor( props ) {
		super( props );

		this.renderLabel = this.renderLabel.bind( this );
		this.renderLabels = this.renderLabels.bind( this );
		this.openTooltip = this.openTooltip.bind( this );
		this.closeTooltip = this.closeTooltip.bind( this );
		this.renderLabelButton = this.renderLabelButton.bind( this );
		this.renderPaymentInfo = this.renderPaymentInfo.bind( this );
		this.renderPurchaseLabelFlow = this.renderPurchaseLabelFlow.bind( this );
		this.renderRefundLink = this.renderRefundLink.bind( this );
		this.renderRefund = this.renderRefund.bind( this );
		this.renderReprint = this.renderReprint.bind( this );
		this.renderLabelDetails = this.renderLabelDetails.bind( this );

		this.needToFetchLabelsStatus = true;

		this.state = {
			showTooltips: props.shippingLabel.labels.map( () => false ),
		};
	}

	openTooltip( index ) {
		const showTooltips = [ ...this.state.showTooltips ];
		showTooltips[ index ] = true;

		this.setState( { showTooltips } );
	}

	closeTooltip( index ) {
		const showTooltips = [ ...this.state.showTooltips ];
		showTooltips[ index ] = false;

		this.setState( { showTooltips } );
	}

	renderPaymentInfo() {
		const numPaymentMethods = this.props.shippingLabel.numPaymentMethods;
		const paymentMethod = this.props.shippingLabel.paymentMethod;

		if ( numPaymentMethods > 0 && paymentMethod ) {
			return (
				<Notice isCompact={ true } showDismiss={ false } className="wcc-metabox-label-payment inline">
					<p>
						{ __( 'Labels will be purchased using card ending: {{strong}}%(cardDigits)s.{{/strong}}', {
							components: { strong: <strong /> },
							args: { cardDigits: paymentMethod },
						} ) }
					</p>
					<p><a href="admin.php?page=wc-settings&tab=shipping&section=label-settings">{ __( 'Manage cards' ) }</a></p>
				</Notice>
			);
		}

		if ( numPaymentMethods > 0 ) {
			return (
				<Notice isCompact={ true } showDismiss={ false } className="wcc-metabox-label-payment inline">
					<p>{ __( 'To purchase shipping labels, you will first need to select a credit card.' ) }</p>
					<p><a href="admin.php?page=wc-settings&tab=shipping&section=label-settings">{ __( 'Select a credit card' ) }</a></p>
				</Notice>
			);
		}

		return (
			<Notice isCompact={ true } showDismiss={ false } className="wcc-metabox-label-payment inline">
				<p>{ __( 'To purchase shipping labels, you will first need to add a credit card.' ) }</p>
				<p><a href="admin.php?page=wc-settings&tab=shipping&section=label-settings">{ __( 'Add a credit card' ) }</a></p>
			</Notice>
		);
	}

	renderLabelButton() {
		return (
			<Button className="wcc-metabox__new-label-button" onClick={ this.props.labelActions.openPrintingFlow } >
				{ __( 'Create new label' ) }
			</Button>
		);
	}

	renderPurchaseLabelFlow() {
		const paymentMethod = this.props.shippingLabel.paymentMethod;

		return (
			<div className="wcc-metabox-label-item" >
				<PrintLabelDialog
					{ ...this.props.shippingLabel }
					{ ...this.props } />
				{ this.renderPaymentInfo( paymentMethod ) }
				{ paymentMethod && this.renderLabelButton() }
			</div>
		);
	}

	renderRefundLink( label ) {
		const today = new Date();
		const thirtyDaysAgo = new Date().setDate( today.getDate() - 30 );
		if ( ( label.used_date && label.used_date < today.getTime() ) || ( label.created_date && label.created_date < thirtyDaysAgo ) ) {
			return null;
		}

		const openRefundDialog = ( e ) => {
			e.preventDefault();
			this.props.labelActions.openRefundDialog( label.label_id );
		};

		return (
			<span>
				<RefundDialog
					refundDialog={ this.props.shippingLabel.refundDialog }
					{ ...this.props.shippingLabel }
					{ ...this.props }
					{ ...label } />
				<a href="#" onClick={ openRefundDialog } >
					<Gridicon icon="refund" size={ 12 } />{ __( 'Request refund' ) }
				</a>
			</span>
		);
	}

	renderRefund( label ) {
		if ( ! label.refund ) {
			return this.renderRefundLink( label );
		}

		let text = '';
		let className = '';
		switch ( label.refund.status ) {
			case 'pending':
				className = 'wcc-metabox-label-item__refund-pending';
				text = label.statusUpdated
					? __( 'Refund pending' )
					: <span>{ __( 'Checking refund status' ) } <Spinner size={ 12 } /></span>;
				break;
			case 'complete':
				className = 'wcc-metabox-label-item__refund-complete';
				text = __( 'Refunded on %(date)s', { args: { date: formatDate( label.refund.refund_date ) } } );
				break;
			case 'rejected':
				className = 'wcc-metabox-label-item__refund-rejected';
				text = __( 'Refund rejected' );
				break;
			default:
				return this.renderRefundLink( label );
		}

		return (
			<span className={ className } ><Gridicon icon="time" size={ 12 } />{ text }</span>
		);
	}

	renderReprint( label ) {
		const todayTime = new Date().getTime();
		if ( label.refund ||
			( label.used_date && label.used_date < todayTime ) ||
			( label.expiry_date && label.expiry_date < todayTime ) ) {
			return null;
		}

		const openReprintDialog = ( e ) => {
			e.preventDefault();
			this.props.labelActions.openReprintDialog( label.label_id );
		};

		return (
			<span>
				<ReprintDialog
					reprintDialog={ this.props.shippingLabel.reprintDialog }
					{ ...this.props.shippingLabel }
					{ ...this.props }
					{ ...label } />
				<a href="#" onClick={ openReprintDialog } >
					<Gridicon icon="print" size={ 12 } />{ __( 'Reprint' ) }
				</a>
			</span>
		);
	}

	renderLabelDetails( label, labelNum, index ) {
		if ( ! label.package_name || ! label.product_names ) {
			return null;
		}

		const onMouseEnter = () => this.openTooltip( index );
		const onMouseLeave = () => this.closeTooltip( index );
		const onClose = () => this.closeTooltip( index );
		return (
			<span>
				<span className="wcc-metabox-label-item__detail"
						onMouseEnter={ onMouseEnter }
						onMouseLeave={ onMouseLeave }
						ref={ 'label-details-' + index }>
					{ __( 'Label #%(labelNum)s', { args: { labelNum } } ) }
				</span>
				<Tooltip
					className="wc-connect-popover"
					isVisible={ this.state.showTooltips[ index ] }
					onClose={ onClose }
					position="top"
					showOnMobile
					context={ this.refs && this.refs[ 'label-details-' + index ] } >
					<div className="wc-connect-popover-contents">
						<h3>{ label.package_name }</h3>
						<p>{ label.service_name }</p>
						<ul>
							{ label.product_names.map( ( productName, productIdx ) => <li key={ productIdx }>{ productName }</li> ) }
						</ul>
					</div>
				</Tooltip>
			</span>
		);
	}

	renderLabel( label, index, labels ) {
		const purchased = timeAgo( label.created );

		return (
			<div key={ label.label_id } className="wcc-metabox-label-item" >
				<p className="wcc-metabox-label-item__created">
					{ __( '{{labelDetails/}} purchased {{purchasedAt/}}', {
						components: {
							labelDetails: this.renderLabelDetails( label, labels.length - index, index ),
							purchasedAt: <span title={ formatDate( label.created ) }>{ purchased }</span>
						}
					} ) }
				</p>
				<p className="wcc-metabox-label-item__tracking">
					{ __( 'Tracking #: {{trackingLink/}}', { components: { trackingLink: <TrackingLink { ...label } /> } } ) }
				</p>
				<p className="wcc-metabox-label-item__actions" >
					{ this.renderRefund( label ) }
					{ this.renderReprint( label ) }
				</p>
			</div>
		);
	}

	renderLabels() {
		if ( this.needToFetchLabelsStatus ) {
			this.needToFetchLabelsStatus = false;
			this.props.labelActions.fetchLabelsStatus();
		}
		return this.props.shippingLabel.labels.map( this.renderLabel );
	}

	render() {
		return (
			<div className="wcc-metabox-shipping-label-container">
				<GlobalNotices id="notices" notices={ notices.list } />
				{ this.renderPurchaseLabelFlow() }
				{ this.props.shippingLabel.labels.length ? this.renderLabels() : null }
			</div>
		);
	}
}

ShippingLabelRootView.propTypes = {
	storeOptions: PropTypes.object.isRequired,
	shippingLabel: PropTypes.object.isRequired,
};

function mapStateToProps( state, { storeOptions } ) {
	return {
		shippingLabel: state.shippingLabel,
		errors: getFormErrors( state, storeOptions ),
		canPurchase: canPurchase( state, storeOptions ),
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		labelActions: bindActionCreators( ShippingLabelActions, dispatch ),
	};
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( ShippingLabelRootView );
