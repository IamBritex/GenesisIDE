export default class SfxPreload {
    static preload(scene) {
        scene.load.audio('clickDown', 'public/sounds/editor/ClickDown.ogg');
        scene.load.audio('clickUp', 'public/sounds/editor/ClickUp.ogg');
        scene.load.audio('undo', 'public/sounds/editor/undo.ogg');
    }
}