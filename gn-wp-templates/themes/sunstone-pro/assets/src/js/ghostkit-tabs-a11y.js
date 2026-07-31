document.addEventListener('DOMContentLoaded', () => {
    const TAB_INDEX_OFFSET = 1;
    const tabWrappers = document.querySelectorAll('.ghostkit-tabs');

    tabWrappers.forEach((wrapper) => {
        const tabList = wrapper.querySelector('.ghostkit-tabs-buttons[role="tablist"]');
        const tabs = Array.from(
            wrapper.querySelectorAll('.ghostkit-tabs-buttons [role="tab"]')
        );

        if (!tabList || !tabs.length) {
            return;
        }

        function getPanelForTab(tab) {
            const controlsId = tab.getAttribute('aria-controls');
            return controlsId ? wrapper.querySelector(`#${controlsId}`) : null;
        }

        function getActiveTab() {
            return (
                tabs.find((tab) =>
                    tab.classList.contains('ghostkit-tabs-buttons-item-active')
                ) ||
                tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ||
                tabs[0]
            );
        }

        function syncA11yState() {
            const activeTab = getActiveTab();

            tabs.forEach((tab, index) => {
                const panel = getPanelForTab(tab);
                const isSelected = tab === activeTab;

                tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                tab.setAttribute('tabindex', isSelected ? '0' : '-1');
                tab.setAttribute('aria-setsize', String(tabs.length));
                tab.setAttribute('aria-posinset', String(index + TAB_INDEX_OFFSET));

                if (panel) {
                    panel.setAttribute('aria-live', 'polite');
                    panel.setAttribute('aria-hidden', isSelected ? 'false' : 'true');
                    panel.removeAttribute('tabindex');
                }
            });
        }

        function queueSync() {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    syncA11yState();
                });
            });
        }

        queueSync();

        const observer = new MutationObserver((mutations) => {
            const hasRelevantChange = mutations.some(
                (mutation) =>
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class'
            );

            if (hasRelevantChange) {
                queueSync();
            }
        });

        tabs.forEach((tab) => {
            observer.observe(tab, {
                attributes: true,
                attributeFilter: ['class'],
            });
        });
    });
});