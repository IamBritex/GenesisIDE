/**
 * source/funkin/ui/editors/utils/checkboard.js
 */
export default class Checkboard extends Phaser.GameObjects.TileSprite {
    /**
     * @param {Phaser.Scene} scene 
     * @param {import('../../../play/camera/Camera.js').CameraManager} cameraManager 
     */
    constructor(scene, cameraManager) {
        const key = 'gen_checkboard';
        const size = 32;

        // 1. Generar la textura si no existe
        if (!scene.textures.exists(key)) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, size, size);
            graphics.fillRect(size, size, size, size);

            graphics.fillStyle(0xdddddd, 1);
            graphics.fillRect(size, 0, size, size);
            graphics.fillRect(0, size, size, size);

            graphics.generateTexture(key, size * 2, size * 2);
            graphics.destroy();
        }

        // 2. Inicializar TileSprite cubriendo toda la pantalla
        super(scene, 0, 0, scene.scale.width, scene.scale.height, key);
        scene.add.existing(this);

        this.cameraManager = cameraManager;

        // 3. Configuración Visual (Encapsulada)
        this.setOrigin(0.5, 0.5)
            .setPosition(scene.scale.width / 2, scene.scale.height / 2)
            .setScrollFactor(0)  // Fijo en pantalla
            .setDepth(-1000)     // Al fondo
            .setAlpha(0.4);      // Transparencia

        // 4. Asignación a la Cámara del Juego
        if (this.cameraManager) {
            this.cameraManager.assignToGame(this);
        }

        // 5. Listener de Redimensionamiento
        this.resizeListener = (gameSize) => {
            this.setSize(gameSize.width, gameSize.height);
            this.setPosition(gameSize.width / 2, gameSize.height / 2);
        };
        scene.scale.on('resize', this.resizeListener);

        // 6. Limpieza automática
        this.on('destroy', this.cleanup, this);
        if (scene.events) {
            scene.events.once('shutdown', this.cleanup, this);
        }
    }

    /**
     * Actualiza la posición y escala del patrón basándose en la cámara.
     * Debe llamarse en el update() de la escena.
     */
    update() {
        if (!this.cameraManager) return;

        const cam = this.cameraManager.gameCamera;

        // Sincronizar el patrón con el scroll
        this.tilePositionX = cam.scrollX;
        this.tilePositionY = cam.scrollY;

        // Compensar el Zoom:
        // 1. Escalamos el objeto inversamente para que siempre cubra la pantalla
        this.setScale(1 / cam.zoom);

        // 2. Escalamos el patrón (tile) directamente para simular el zoom visual
        this.tileScaleX = cam.zoom;
        this.tileScaleY = cam.zoom;
    }

    cleanup() {
        // Remover el listener de resize específicamente
        if (this.scene && this.resizeListener) {
            this.scene.scale.off('resize', this.resizeListener);
        }

        if (this.scene) {
            this.scene.events.off('shutdown', this.cleanup, this);
        }
    }
}