export default class Checkboard extends Phaser.GameObjects.TileSprite {
    constructor(scene, x, y, width, height) {
        const key = 'gen_checkboard';
        const size = 32;

        if (!scene.textures.exists(key)) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

            // Dibujar patrón base (Blanco y Gris Claro)
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, size, size);
            graphics.fillRect(size, size, size, size);

            graphics.fillStyle(0xdddddd, 1);
            graphics.fillRect(size, 0, size, size);
            graphics.fillRect(0, size, size, size);

            graphics.generateTexture(key, size * 2, size * 2);
        }

        // 2. Llamar al super con la textura generada
        super(scene, x, y, width, height, key);
        scene.add.existing(this);

        // 4. LIMPIEZA (Vital para arreglar el crash 'reading sys')
        this.on('destroy', this.cleanup, this);
        if (scene.events) {
            scene.events.once('shutdown', this.cleanup, this);
        }

        this.updateVisuals();
    }

    cleanup() {
        if (this.scene) {
            this.scene.events.off('shutdown', this.cleanup, this);
        }
    }
}