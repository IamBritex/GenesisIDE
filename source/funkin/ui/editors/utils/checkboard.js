/**
 * source/funkin/ui/editors/utils/checkboard.js
 */
export default class Checkboard extends Phaser.GameObjects.TileSprite {
    /**
     * @param {Phaser.Scene} scene 
     * @param {import('../camera/camera.js').CameraManager} cameraManager 
     */
    constructor(scene, cameraManager) {
        const key = 'checkboard_pattern_native';
        const patternSize = 64;

        // Tamaño del mundo (Límite visual y de cámara)
        const worldSize = 21000;

        // 1. Generación Vía DOM NATIVO
        if (!scene.textures.exists(key)) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = patternSize;
                canvas.height = patternSize;
                const ctx = canvas.getContext('2d');

                const half = patternSize / 2;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, patternSize, patternSize);

                ctx.fillStyle = '#DDDDDD';
                ctx.fillRect(0, 0, half, half);
                ctx.fillRect(half, half, half, half);

                scene.textures.addCanvas(key, canvas);
                canvas.remove();
            } catch (e) {
                console.error("[Checkboard] Error texture:", e);
                // Fallback simple
                if (!scene.textures.exists('pixel')) {
                    const f = document.createElement('canvas'); f.width = 1; f.height = 1;
                    scene.textures.addCanvas('pixel', f);
                }
                super(scene, 0, 0, worldSize, worldSize, 'pixel');
                return;
            }
        }

        // 2. Crear TileSprite
        super(scene, 0, 0, worldSize, worldSize, key);
        scene.add.existing(this);

        this.cameraManager = cameraManager;

        // 3. Configuración Visual
        this.setOrigin(0.5, 0.5)
            .setPosition(0, 0)
            .setDepth(-1000)
            .setAlpha(0.2);

        // 4. Configurar Cámaras
        if (this.cameraManager) {
            // A. Que la UI ignore este objeto
            this.cameraManager.assignToGame(this);

            // B. [NUEVO] Decirle a la cámara que respete este tamaño como límite
            this.cameraManager.updateBounds(worldSize);
        }

        console.log(`[Checkboard] Renderizado: ${worldSize}px`);
    }

    update() { }

    cleanup() {
        if (this.scene) this.destroy();
    }
}