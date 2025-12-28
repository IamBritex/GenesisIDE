/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageImagesController.js
 */
import Selecting from '../../elements/Selecting.js';

export default class StageImagesController {
    constructor(scene) {
        this.scene = scene;
        this.activeSprites = [];
        this.basePath = 'public/images/stages/';
    }

    loadImages(stageName, stageDataArray) {
        this.clear();
        const imagesToLoad = stageDataArray.filter(item => item.type === 'image');
        if (imagesToLoad.length === 0) return;

        console.log(`[StageImages] Cargando ${imagesToLoad.length} imágenes...`);

        let loadCount = 0;
        imagesToLoad.forEach(data => {
            const textureKey = data.namePath;
            const fullPath = `${this.basePath}${stageName}/${textureKey}.png`;
            if (!this.scene.textures.exists(textureKey)) {
                this.scene.load.image(textureKey, fullPath);
                loadCount++;
            }
        });

        if (loadCount > 0) {
            this.scene.load.once('complete', () => this.createSprites(imagesToLoad));
            this.scene.load.start();
        } else {
            this.createSprites(imagesToLoad);
        }
    }

    createSprites(imagesData) {
        imagesData.forEach(data => {
            const textureKey = data.namePath;
            if (!this.scene.textures.exists(textureKey)) {
                console.warn(`[StageImages] Textura '${textureKey}' faltante.`);
                return;
            }

            const sprite = this.scene.add.sprite(0, 0, textureKey);

            if (this.scene.cameraManager) {
                this.scene.cameraManager.assignToGame(sprite);
            }

            this.applyProperties(sprite, data);
            this._setupInteractions(sprite, data);

            this.activeSprites.push(sprite);
        });
    }

    applyProperties(sprite, data) {
        if (typeof data.scale === 'number') sprite.setScale(data.scale);
        if (data.position && Array.isArray(data.position)) sprite.setPosition(data.position[0], data.position[1]);
        if (data.visible !== undefined) sprite.setVisible(data.visible);
        if (data.opacity !== undefined) sprite.setAlpha(data.opacity);
        if (typeof data.scrollFactor === 'number') sprite.setScrollFactor(data.scrollFactor);
        if (data.flip_x !== undefined) sprite.setFlipX(data.flip_x);
        if (data.flip_y !== undefined) sprite.setFlipY(data.flip_y);
        if (typeof data.layer === 'number') sprite.setDepth(data.layer);

        // Datos base
        sprite.setData('type', 'stage_image');
        sprite.setData('imagePath', data.namePath);
    }

    _setupInteractions(sprite, data) {
        sprite.setInteractive({ pixelPerfect: true, draggable: true });
        this.scene.input.setDraggable(sprite);

        sprite.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
        sprite.on('pointerout', () => this.scene.input.setDefaultCursor('default'));

        sprite.on('dragstart', () => {
            this.scene.input.setDefaultCursor('grabbing');
            // Nota: dragstart es gestionado por el plugin de input
            this._selectImage(sprite);
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
            sprite.x = dragX;
            sprite.y = dragY;
            // Emitir evento para que las Propiedades se actualicen en tiempo real
            this.scene.events.emit('element_updated', sprite);
        });

        sprite.on('dragend', () => this.scene.input.setDefaultCursor('grab'));

        sprite.on('pointerdown', (p) => {
            // Bloquear si no es click izquierdo
            if (p.button !== 0) return;

            p.event.stopPropagation();
            this._selectImage(sprite);
        });
    }

    _selectImage(sprite) {
        Selecting.flash(this.scene, sprite, this.scene.cameraManager);
        console.log(`[StageImages] Seleccionada imagen: ${sprite.getData('imagePath')}`);
        this.scene.events.emit('element_selected', sprite);
    }

    // [NUEVO] Método para ocultar/mostrar todas las imágenes
    setVisible(visible) {
        this.activeSprites.forEach(sprite => {
            if (sprite && sprite.active) {
                sprite.setVisible(visible);
            }
        });
    }

    clear() {
        if (this.activeSprites.length > 0) {
            this.activeSprites.forEach(s => s.destroy());
        }
        this.activeSprites = [];
    }
}