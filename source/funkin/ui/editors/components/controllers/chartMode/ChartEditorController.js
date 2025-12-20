/**
 * source/funkin/ui/editors/components/controllers/chartMode/ChartEditorController.js
 */
export default class ChartEditorController {
    constructor(scene) {
        this.scene = scene;
        this.bg = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) {
            this.setVisible(true);
            this._resetCamera();
            return;
        }

        console.log('[ChartEditor] Inicializando...');

        // 1. Crear fondo (menuDesat)
        // Usamos setOrigin(0.5) para que esté centrado en 0,0
        if (this.scene.textures.exists('menuDesat')) {
            this.bg = this.scene.add.image(0, 0, 'menuDesat');
            this.bg.setOrigin(0.5);

            // Opcional: Color para distinguirlo un poco (tint grisáceo)
            this.bg.setTint(0x999999);

            // Asignar al mundo (CameraManager asigna por defecto, pero por si acaso)
            if (this.scene.cameraManager) {
                this.scene.cameraManager.assignToGame(this.bg);
            }
        } else {
            console.warn('[ChartEditor] La textura "menuDesat" no existe.');
        }

        // 2. Reiniciar Cámara
        this._resetCamera();

        this.isInitialized = true;
    }

    _resetCamera() {
        // Reiniciar posición (0,0) y Zoom (1)
        const cam = this.scene.cameras.main;
        cam.centerOn(0, 0);
        cam.setZoom(1);
        console.log('[ChartEditor] Cámara reiniciada.');
    }

    setVisible(visible) {
        if (this.bg) {
            this.bg.setVisible(visible);
        }
    }

    update(time, delta) {
        // Lógica futura del chart editor
    }

    destroy() {
        if (this.bg) this.bg.destroy();
    }
}