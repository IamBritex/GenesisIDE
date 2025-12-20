import CharacterEditorController from '../components/controllers/characterMode/CharacterEditorController.js';

export default class CharacterMode {
    constructor(scene) {
        this.scene = scene;
        this.controller = null;
    }

    enable() {
        console.log('%c[CharacterMode] ENABLED', 'color: #4caf50; font-weight: bold;');

        if (!this.controller) {
            this.controller = new CharacterEditorController(this.scene, this.scene.cameraManager);
            this.controller.init();
        } else {
            this.controller.setVisible(true);
        }

        this.scene.events.on('update', this.update, this);
    }

    disable() {
        console.log('%c[CharacterMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');
        if (this.controller) {
            this.controller.setVisible(false);
        }
        this.scene.events.off('update', this.update, this);
    }

    update(time, delta) {
        if (this.controller) {
            this.controller.update(time, delta);
        }
    }
}