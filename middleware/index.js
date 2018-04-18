/**
 * Gutenberg Fields Middleware.
 */

const { InspectorControls } = wp.blocks;
const { addFilter } = wp.hooks;
const { withState } = wp.components;

/**
 * Fields
 */
import * as fields from './fields';

/**
 * Gutenberg Middleware Class.
 */
class GutenbergFieldsMiddleWare {
	/**
	 * Constructor.
	 *
	 * @param {Object} config Block configuration.
	 *
	 * @return {void}
	 */
	constructor( config ) {
		this.blockConfigs = {};
		this.fields = {};
		this.inspectorControlFields = {};
		this.inspectorControls = '';
		this.config = _.extend( {}, config );
		this.innerFields = {};

		this.setupBlockFields = this.setupBlockFields.bind( this );
		this.setupField = this.setupField.bind( this );
	}

	/**
	 * Get middleware block settings.
	 *
	 * @return {Object} Settings.
	 */
	getSettings() {
		this.blockConfigs = _.extend( {
			title: '',

			category: 'common',

			attributes: {},

		}, this.config );

		const blockStates = _.extend( {
			editable: '',
		}, this.config.blockStates || {} );

		delete this.blockConfigs.blockStates;

		this.blockConfigs.edit = withState( blockStates )( ( props ) => {
			this.setupBlockFields( props );

			const wrapperClassName = 'middleware-block ' + props.className;
			props.middleware = this;

			if ( this.config.edit ) {
				if ( this.constructor.isClassComponent( this.config.edit ) ) {
					return ( <div className={ wrapperClassName }><this.config.edit { ...props } /></div> );
				}

				return ( <div className={ wrapperClassName }>{ this.config.edit( props ) }</div> );
			}

			return ( <div className={ wrapperClassName }>{ this.edit( props ) }</div> );
		} );

		this.blockConfigs.save = ( props ) => {
			props.middleware = this;

			if ( this.config.save ) {
				if ( this.constructor.isClassComponent( this.config.save ) ) {
					return ( <this.config.save { ...props } /> );
				}

				return this.config.save( props );
			}

			return this.save( props );
		};

		return this.blockConfigs;
	}

	/**
	 * Get field according to the field type.
	 *
	 * @param {Object} props        Properties.
	 * @param {Object} config       Field configuration provided.
	 * @param {String} attributeKey Attribute Key.
	 * @param {Object} innerFields  Inner Fields.
	 *
	 * @return {Object} Field.
	 */
	getField( props, config, attributeKey, innerFields ) {
		const field = {};

		switch ( config.type ) {
			case 'text':
				field[ attributeKey ] = fields.text( props, config, attributeKey, innerFields );
				break;
			case 'rich-text':
				field[ attributeKey ] = fields.richText( props, config, attributeKey, innerFields );
				break;
			case 'link':
				field[ attributeKey ] = fields.link( props, config, attributeKey, innerFields );
				break;
			case 'image':
				field[ attributeKey ] = fields.image( props, config, attributeKey, innerFields );
				break;
			case 'video':
			case 'audio':
				field[ attributeKey ] = fields.mediaUpload( props, config, attributeKey, innerFields );
				break;
			case 'select':
				field[ attributeKey ] = fields.select( props, config, attributeKey, innerFields );
				break;
			case 'range':
				field[ attributeKey ] = fields.range( props, config, attributeKey, innerFields );
				break;
			case 'radio':
				field[ attributeKey ] = fields.radio( props, config, attributeKey, innerFields );
				break;
			case 'checkbox':
				field[ attributeKey ] = fields.checkbox( props, config, attributeKey, innerFields );
				break;
			case 'button-editable':
				field[ attributeKey ] = fields.buttonEditable( props, config, attributeKey, innerFields );
				break;
			case 'color':
				field[ attributeKey ] = fields.color( props, config, attributeKey, innerFields );
				break;
			case 'code-editor':
				field[ attributeKey ] = fields.codeEditor( props, config, attributeKey, innerFields );
				break;
			case 'date-time':
				field[ attributeKey ] = fields.dateTime( props, config, attributeKey, innerFields );
				break;
			case 'textarea':
				field[ attributeKey ] = fields.textarea( props, config, attributeKey, innerFields );
				break;
			case 'switch':
				field[ attributeKey ] = fields.formToggle( props, config, attributeKey, innerFields );
				break;
			case 'tree-select':
				field[ attributeKey ] = fields.treeSelect( props, config, attributeKey, innerFields );
				break;
			case 'file-upload':
				field[ attributeKey ] = fields.fileUpload( props, config, attributeKey, innerFields );
				break;
		}

		if ( _.contains( [ 'email', 'hidden', 'number', 'search', 'tel', 'time', 'date', 'datetime-local', 'file', 'month', 'password', 'time', 'url', 'week' ], config.type ) ) {
			field[ attributeKey ] = fields.inputField( props, config, attributeKey, innerFields );
		}

		return field;
	}

	/**
	 * Setup block fields and inspector controls.
	 *
	 * @param {Object} props Properties.
	 *
	 * @return {void}
	 */
	setupBlockFields( props ) {
		// Take out inner fields first.
		_.each( this.blockConfigs.attributes, ( attribute, attributeKey ) => {
			if ( attribute.field && attribute.field.innerFields ) {
				_.each( attribute.field.innerFields, ( innerFieldAttributeKey, innerFieldKey ) => {
					this.innerFields[ innerFieldAttributeKey ] = this.setupField( props, this.blockConfigs.attributes[ innerFieldAttributeKey ], innerFieldAttributeKey );
					if ( this.innerFields[ innerFieldAttributeKey ] ) {
						this.innerFields[ innerFieldAttributeKey ].parentField = attributeKey;
						this.innerFields[ innerFieldAttributeKey ].linkName = innerFieldKey;
					}
				} );
			}
		} );

		_.each( this.blockConfigs.attributes, ( attribute, attributeKey ) => {
			if ( attribute.field ) {
				this.setupField( props, attribute, attributeKey );
			}
		} );

		this.inspectorControls = props.isSelected ? (
			<InspectorControls key="inspector-control">
				{ Object.keys( this.inspectorControlFields ).map( ( key ) => {
					return this.inspectorControlFields[ key ];
				} ) }
			</InspectorControls>
		) : null;
	}

	/**
	 * Setup a single Field.
	 *
	 * @param {Object} props Properties.
	 * @param {Object} attribute Attribute.
	 * @param {String} attributeKey Attribute key.
	 * @return {Object|void} Field.
	 */
	setupField( props, attribute, attributeKey ) {
		const config = _.extend( {
			onFocus() {
				props.setState( {
					editable: attributeKey,
				} );
			},
		}, attribute.field );

		if ( ! this.fields[ attributeKey ] && ! this.inspectorControlFields[ attributeKey ] ) {
			const field = this.getField( props, config, attributeKey, this.innerFields );
			if ( 'inspector' === config.placement ) {
				_.extend( this.inspectorControlFields, field );
			} else {
				_.extend( this.fields, field );
			}

			return field;
		}
	}

	/**
	 * Check if it is a react component.
	 *
	 * @param {*} component Component or function.
	 *
	 * @return {boolean} Is react component or not.
	 */
	static isClassComponent( component ) {
		return typeof component === 'function' && component.prototype && !! component.prototype.isReactComponent;
	}

	/**
	 * Fallback edit method.
	 *
	 * @param {Object} props Properties.
	 *
	 * @return {Object} Edit elements.
	 */
	edit( props ) {
		return [
			this.inspectorControls,
			(
				<div key={ props.className } >
					{ Object.keys( this.fields ).map( ( key ) => {
						return this.fields[ key ];
					} ) }
				</div>
			),
		];
	}

	/**
	 * Fallback save method.
	 *
	 * @return {null} Null.
	 */
	save() {
		return null;
	}
}

/**
 * Filters the block settings except for default gutenberg blocks.
 *
 * @param {Object} settings Block settings.
 * @param {String} name     Block name.
 *
 * @return {Object} Filtered settings.
 */
const filterBlockSettings = ( settings, name ) => {
	if ( ! /^core/.test( name ) ) {
		const middleware = new GutenbergFieldsMiddleWare( settings );
		return middleware.getSettings();
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'gutenberg-field-middleware/registration/attributes', filterBlockSettings, 1 );

export default GutenbergFieldsMiddleWare;
