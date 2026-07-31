import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const getSettings = () => {
    return window.PageExtraField || {
        postType: 'page',
        metaKey: '_page_subtitle',
        panelName: 'page-extra-field',
        panelTitle: __('Page settings', 'cet-wp-theme-troon-2'),
        fieldLabel: __('Page subtitle', 'cet-wp-theme-troon-2'),
    };
};

const PageExtraFieldPanel = () => {
    const settings = getSettings();

    const currentPostType = useSelect((select) => {
        return select('core/editor').getCurrentPostType();
    }, []);

    const [meta, setMeta] = useEntityProp(
        'postType',
        currentPostType,
        'meta'
    );

    if (currentPostType !== settings.postType) {
        return null;
    }

    const currentValue = meta?.[settings.metaKey] || '';

    const updateValue = (nextValue) => {
        setMeta({
            ...meta,
            [settings.metaKey]: nextValue,
        });
    };

    return (
        <PluginDocumentSettingPanel
            name={settings.panelName}
            title={settings.panelTitle}
            className="page-extra-field-panel"
        >
            <TextControl
                label={settings.fieldLabel}
                value={currentValue}
                onChange={updateValue}
                __nextHasNoMarginBottom
            />
        </PluginDocumentSettingPanel>
    );
};

registerPlugin('page-extra-field', {
    render: PageExtraFieldPanel,
});
