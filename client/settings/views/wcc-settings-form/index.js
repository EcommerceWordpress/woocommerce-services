/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import WCCSettingsGroup from './settings-group';
import NuxNotice from './nux-notice';
import * as FormActions from 'settings/state/actions';
import { successNotice, errorNotice } from 'state/notices/actions';
import * as FormValueActions from 'settings/state/values/actions';
import getFormErrors from 'settings/state/selectors/errors';

const WCCSettingsForm = ( props ) => {
	const renderGroup = ( index ) => {
		return (
			<WCCSettingsGroup
				{ ...props }
				group={ props.layout[ index ] }
				saveForm={ props.formValueActions.submit }
				key={ index }
			/>
		);
	};

	return (
		<div>
			<NuxNotice noticeDismissed={ ! ! props.form.noticeDismissed } dismissNotice={ props.formActions.dismissNotice } />
			{ props.layout.map( ( group, idx ) => renderGroup( idx ) ) }
		</div>
	);
};

WCCSettingsForm.propTypes = {
	storeOptions: PropTypes.object.isRequired,
	schema: PropTypes.object.isRequired,
	layout: PropTypes.array.isRequired,
};

function mapStateToProps( state, props ) {
	return {
		form: state.form,
		errors: getFormErrors( state, props.schema ),
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		formActions: bindActionCreators( FormActions, dispatch ),
		noticeActions: bindActionCreators( { successNotice, errorNotice }, dispatch ),
		formValueActions: bindActionCreators( FormValueActions, dispatch ),
	};
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( WCCSettingsForm );
