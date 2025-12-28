export default class SfxPreload {
    static preload(scene) {
        scene.load.audio('clickDown', 'public/sounds/editor/ClickDown.ogg');
        scene.load.audio('clickUp', 'public/sounds/editor/ClickUp.ogg');
        scene.load.audio('undo', 'public/sounds/editor/undo.ogg');
        scene.load.audio('exitWindow', 'public/sounds/editor/exitWindow.ogg');
        scene.load.audio('openWindow', 'public/sounds/editor/openWindow.ogg');
    }
}