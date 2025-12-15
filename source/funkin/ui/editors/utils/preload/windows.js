/**
 * source/funkin/ui/editors/utils/preload/windows.js
 */
export default class WindowsPreload {
    static preload(scene) {
        scene.load.text('uiCss', 'public/ui/ui.css');
        scene.load.text('modalHtml', 'public/ui/editors/test_modal.html');
        scene.load.text('explorerHtml', 'public/ui/editors/explorer.html');
        scene.load.text('toolBarHtml', 'public/ui/editors/tool_bar.html');
        scene.load.text('bottomBarHtml', 'public/ui/editors/bottom_bar.html');

        // [NUEVO] Panel de Propiedades
        scene.load.text('propertiesHtml', 'public/ui/editors/properties.html');
    }
}