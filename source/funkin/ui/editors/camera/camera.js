/**
 * source/funkin/ui/editors/camera/camera.js
 * Gestor central de cámaras del editor.
 */
export class CameraManager {
    constructor(scene) {
        this.scene = scene;

        // 1. Cámara Principal (Mundo / Checkboard)
        this.gameCamera = scene.cameras.main;
        this.gameCamera.setName('GameCamera');
        this.gameCamera.setBackgroundColor('#333333'); // Color de fondo base

        // 2. Cámara de UI (HUD / Ventanas / Toast)
        // Se renderiza ENCIMA de la cámara de juego
        this.hudCamera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height);
        this.hudCamera.setName('HUDCamera');

        // Importante: La cámara de UI debe ser transparente para ver el juego debajo
        this.hudCamera.setBackgroundColor('rgba(0,0,0,0)');
    }

    /**
     * Define los límites de la cámara del juego.
     * Si se hace zoom out, la cámara no mostrará nada más allá de estos límites.
     * @param {number} size - Tamaño total del mundo (cuadrado).
     */
    updateBounds(size) {
        // Como el checkboard está centrado en (0,0), calculamos el top-left
        const half = size / 2;
        const x = -half;
        const y = -half;

        // Establecer límites en Phaser
        this.gameCamera.setBounds(x, y, size, size);

        // Centrar la cámara inicialmente
        this.gameCamera.centerOn(0, 0);

        console.log(`[CameraManager] Límites establecidos: ${size}x${size} (Centrado en 0,0)`);
    }

    /**
     * Asigna un objeto para que SOLO se vea en el Mundo (y no en la UI).
     */
    assignToGame(gameObject) {
        // Ignorar en HUD
        this.hudCamera.ignore(gameObject);
    }

    /**
     * Asigna un objeto para que SOLO se vea en la UI (y no se mueva con el mundo).
     */
    assignToHUD(gameObject) {
        // Ignorar en Main
        this.gameCamera.ignore(gameObject);
        // Asegurar que se vea en HUD
        // (Por defecto los objetos nuevos se ven en todas, así que esto es redundante pero seguro)
    }

    /**
     * Limpieza
     */
    destroy() {
        if (this.scene) {
            this.scene.cameras.remove(this.hudCamera);
        }
    }
}