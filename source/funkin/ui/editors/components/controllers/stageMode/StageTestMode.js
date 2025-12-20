/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageTestMode.js
 */
export default class StageTestMode {
    /**
     * @param {Phaser.Scene} scene - La escena del editor (IDE).
     * @param {CameraManager} cameraManager - El gestor de la cámara para bloquear el zoom.
     * @param {StageCharactersController} charController - El controlador de los personajes para hacerlos bailar.
     */
    constructor(scene, cameraManager, charController) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.charController = charController;

        this.isActive = false;

        // Configurar escuchas de teclado
        this._setupInput();
    }

    _setupInput() {
        // Usamos keydown para detectar el ENTER
        this.scene.input.keyboard.on('keydown-ENTER', () => {

            // 1. Verificar si hay un Input HTML activo (escribiendo)
            const active = document.activeElement;
            const isTyping = active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'SELECT'
            );

            if (isTyping) {
                // Si estamos escribiendo:
                // NO activar el modo test.
                // Quitamos el foco del input para "confirmar" el dato y prevenir accidentes.
                active.blur();
                return;
            }

            // 2. Si no estamos escribiendo, alternar el modo
            this.toggle();
        });
    }

    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;

        console.log('[StageTestMode] Iniciando modo prueba...');

        // 1. Bloquear Zoom y movimiento manual de cámara
        if (this.cameraManager) {
            // Establecemos esta bandera para que CameraManager sepa que no debe hacer zoom
            this.cameraManager.zoomEnabled = false;

            // Opcional: Si tu CameraManager tiene lógica de paneo con click derecho, también podrías bloquearla:
            // this.cameraManager.panEnabled = false; 
        }

        // 2. Activar comportamiento de personajes (Beat Hit)
        if (this.charController) {
            this.charController.startDancing();

            // IMPORTANTE: Deshabilitar el arrastre de personajes durante el test
            // para evitar moverlos mientras bailan.
            // (Asumiendo que StageCharactersController usa input.setDraggable)
            if (this.charController.characters?.characterElements) {
                const { bf, dad, gf } = this.charController.characters.characterElements;
                if (bf) this.scene.input.setDraggable(bf, false);
                if (dad) this.scene.input.setDraggable(dad, false);
                if (gf) this.scene.input.setDraggable(gf, false);
            }
        }

        // Notificar a la UI (opcional, por si quieres cambiar iconos)
        this.scene.events.emit('editor-test-mode-start');
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;

        console.log('[StageTestMode] Deteniendo modo prueba...');

        // 1. Reactivar Zoom
        if (this.cameraManager) {
            this.cameraManager.zoomEnabled = true;
            // this.cameraManager.panEnabled = true;
        }

        // 2. Detener personajes y resetear pose
        if (this.charController) {
            this.charController.stopDancing();

            // Reactivar el arrastre de personajes
            if (this.charController.characters?.characterElements) {
                const { bf, dad, gf } = this.charController.characters.characterElements;
                if (bf) this.scene.input.setDraggable(bf, true);
                if (dad) this.scene.input.setDraggable(dad, true);
                if (gf) this.scene.input.setDraggable(gf, true);
            }
        }

        this.scene.events.emit('editor-test-mode-stop');
    }

    update(time, delta) {
        if (!this.isActive) return;

        // Aquí podrías añadir lógica futura, como mover la cámara
        // siguiendo al personaje que canta (cameraFocus), etc.
    }

    destroy() {
        this.stop();
        this.scene.input.keyboard.off('keydown-ENTER');
    }
}