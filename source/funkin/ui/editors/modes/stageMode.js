// editors/modes/stageMode.js
import StageCharactersController from '../../editors/components/controllers/stageMode/StageCharactersController.js';
// [NUEVO] Importar el TestMode
import StageTestMode from '../../editors/components/controllers/stageMode/StageTestMode.js';

export default class StageMode {
    constructor(scene) {
        this.scene = scene;
        this.charactersController = null;
        this.testMode = null; // [NUEVO]
    }

    enable() {
        console.log('%c[StageMode] ENABLED', 'color: #4caf50; font-weight: bold;');

        // 1. Iniciar Controlador de Personajes
        if (!this.charactersController) {
            this.charactersController = new StageCharactersController(this.scene, this.scene.cameraManager);
            this.charactersController.init();
        } else {
            this.charactersController.setVisible(true);
        }

        // 2. [NUEVO] Iniciar Modo de Prueba (Input Listener)
        if (!this.testMode) {
            this.testMode = new StageTestMode(this.scene, this.charactersController);
        }

        this.scene.events.on('update', this.update, this);
    }

    disable() {
        console.log('%c[StageMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');

        if (this.charactersController) {
            this.charactersController.setVisible(false);
        }

        // Asegurarnos de salir del modo test si cambiamos de pestaña
        if (this.testMode && this.testMode.isTesting) {
            this.testMode.stopTest();
        }

        this.scene.events.off('update', this.update, this);
    }

    update(time, delta) {
        if (this.charactersController) {
            this.charactersController.update(time, delta);
        }
        // StageTestMode no necesita update, funciona por eventos y timers
    }

    destroy() {
        if (this.testMode) {
            this.testMode.destroy();
            this.testMode = null;
        }
        if (this.charactersController) {
            this.charactersController.destroy();
            this.charactersController = null;
        }
        this.scene.events.off('update', this.update, this);
    }
}