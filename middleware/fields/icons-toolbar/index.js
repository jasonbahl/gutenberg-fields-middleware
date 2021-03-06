/**
 * icons-toolbar field.
 */

const { Toolbar } = wp.components;

export default function iconsToolbar( props, config, defaultConfig, attributeKey, middleware ) {
	const defaultAttributes = _.extend( {}, defaultConfig );
	delete defaultAttributes.value;
	delete defaultAttributes.onChange;

	const fieldAttributes = _.extend( defaultAttributes, config );

	if ( ! _.isEmpty( config.controls ) ) {
		config.controls = config.controls.map( ( control ) => {
			control.onClick = () => {
				const newAttributes = {};
				newAttributes[ attributeKey ] = control.isActive ? '' : control.value;
				props.setAttributes( newAttributes );
			};

			control.isActive = control.value === props.attributes[ attributeKey ];

			return control;
		} );
	}

	delete fieldAttributes.type;

	const toolbarConfig = _.extend( {}, config );
	toolbarConfig.placement = 'block-controls' === config.placement ? '' : config.placement; // To avoid one more Toolbar wrapper.

	return middleware.createField( toolbarConfig, (
		<Toolbar
			{ ...fieldAttributes }
		/>
	) );
}
