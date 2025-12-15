import DefaultWindowsOpened from '../utils/window/DefaultWindowsOpened.js';
import { ModularWindow } from '../utils/window/ModularWindow.js';

export default class CleanStateManager {
    /**
     * Se encarga de limpiar y nulificar todas las referencias de la escena IDE.
     * @param {Phaser.Scene} scene - La instancia de la escena (pasando 'this').
     */
    static clean(scene) {
        console.log('[CleanStateManager] Iniciando protocolo de limpieza total...');

        // 1. Limpiar Listener Global del Modal
        // Buscamos la referencia directamente en la escena
        if (scene.modalListener) {
            window.removeEventListener('modal-save', scene.modalListener);
            scene.modalListener = null;
        }

        // 2. Limpiar Layout Manager
        if (scene.layoutManager) {
            scene.layoutManager.destroy();
            scene.layoutManager = null;
        }

        // 3. Limpiar Toast Manager
        if (scene.toast) {
            scene.toast.destroy();
            scene.toast = null;
        }

        // 4. Limpiar Modos de Editor
        if (scene.editorModes) {
            scene.editorModes.destroy();
            scene.editorModes = null;
        }

        // 5. Limpiar Checkboard
        if (scene.checkboard) {
            scene.checkboard.destroy();
            scene.checkboard = null;
        }

        // 6. Limpiar Camera Manager
        if (scene.cameraManager) {
            // Asumiendo que cameraManager tiene un método destroy o simplemente lo soltamos
            scene.cameraManager = null;
        }

        // 7. Reiniciar Estado de Ventanas (Estáticos)
        DefaultWindowsOpened.hasOpened = false;
        DefaultWindowsOpened.instances = [];
        ModularWindow.openPopups = [];

        // 8. Limpieza profunda del DOM (Ventanas flotantes residuales)
        const floatingWindows = document.querySelectorAll('.modular-window-container');
        floatingWindows.forEach(el => el.remove());

        console.log('[CleanStateManager] Escena purgada y referencias nulificadas.');
    }
}