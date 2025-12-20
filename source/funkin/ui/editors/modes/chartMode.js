import ChartEditorController from '../components/controllers/chartMode/ChartEditorController.js';

export default class ChartMode {
    constructor(scene) {
        this.scene = scene;
        this.controller = null;
    }

    enable() {
        console.log('%c[ChartMode] ENABLED', 'color: #4caf50; font-weight: bold;');

        if (!this.controller) {
            this.controller = new ChartEditorController(this.scene);
            this.controller.init();
        } else {
            this.controller.setVisible(true);
            // Forzamos el reinicio de cámara cada vez que se entra al modo
            this.controller._resetCamera();
        }

        this.scene.events.on('update', this.update, this);
    }

    disable() {
        console.log('%c[ChartMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');

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

    destroy() {
        if (this.controller) {
            this.controller.destroy();
            this.controller = null;
        }
        this.scene.events.off('update', this.update, this);
    }
}