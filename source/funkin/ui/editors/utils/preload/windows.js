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

        scene.load.text('propertiesHtml', 'public/ui/editors/stage_properties.html');
        scene.load.html('stage_properties_characters', 'public/ui/editors/stage_properties_characters.html');
        scene.load.html('stage_properties_images', 'public/ui/editors/stage_properties_images.html');
        scene.load.html('stage_properties_sprites', 'public/ui/editors/stage_properties_sprites.html');
        scene.load.text('toastHtml', 'public/ui/toast.html');
        scene.load.text('tabBarHtml', 'public/ui/editors/tabBar.html');
        scene.load.text('windowStageAnimationsHtml', 'public/ui/editors/window_stage_animations.html');

    }
}