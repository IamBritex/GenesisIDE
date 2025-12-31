/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageImagesController.js
 */
import Selecting from '../../elements/Selecting.js';

export default class StageImagesController {
    constructor(scene, actionHistory) {
        this.scene = scene;
        this.actionHistory = actionHistory;
        this.activeSprites = [];
        this.basePath = 'public/images/stages/';

        this.dragStart = { x: 0, y: 0 };
        this.clipboard = null;
        this.selectedImage = null;

        // Shift para Paste in Place
        this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        this.scene.events.on('element_selected', (sprite) => {
            if (sprite && sprite.getData('type') === 'image') {
                this.selectedImage = sprite;
            }
        });
    }

    /**
     * COPY MODIFICADO:
     * Captura el estado actual de la imagen.
     */
    copy() {
        if (!this.selectedImage || !this.selectedImage.active) return null;

        const baseConfig = this.selectedImage.getData('config') || {};

        const currentData = {
            ...baseConfig,
            position: [this.selectedImage.x, this.selectedImage.y],
            scale: [this.selectedImage.scaleX, this.selectedImage.scaleY],
            scrollFactor: [this.selectedImage.scrollFactorX, this.selectedImage.scrollFactorY],
            angle: this.selectedImage.angle,
            opacity: this.selectedImage.alpha,
            flip_x: this.selectedImage.flipX,
            flip_y: this.selectedImage.flipY,
            layer: this.selectedImage.depth,
            visible: this.selectedImage.visible
        };

        this.clipboard = JSON.parse(JSON.stringify(currentData));
        console.log("StageImagesController: Imagen copiada con TODAS sus propiedades actuales.");

        return this.clipboard;
    }

    paste(pastedData) {
        let dataToUse = null;

        if (pastedData && typeof pastedData === 'object' && pastedData.type === 'image') {
            dataToUse = pastedData;
        } else {
            dataToUse = this.clipboard;
        }

        if (!dataToUse) {
            console.warn("StageImagesController: No hay datos para pegar.");
            return;
        }

        const newData = JSON.parse(JSON.stringify(dataToUse));
        const isShiftDown = this.shiftKey.isDown;

        if (isShiftDown) {
            console.log("Pegando imagen: Propiedades exactas (Shift)");
        } else {
            console.log("Pegando imagen: En mouse (Mantiene otras props)");
            const worldPoint = this.scene.input.activePointer.positionToCamera(this.scene.cameras.main);
            newData.position = [worldPoint.x, worldPoint.y];
        }

        this.createSprites([newData]);
    }

    deleteSelected() {
        if (this.selectedImage && this.selectedImage.active) {
            this.selectedImage.destroy();
            this.activeSprites = this.activeSprites.filter(s => s.active);
            this.selectedImage = null;
            this.scene.events.emit('element_deselected');
        }
    }

    // --- LÓGICA CORE ---

    loadImages(stageName, stageDataArray) {
        this.clear();
        const imagesToLoad = stageDataArray.filter(item => item.type === 'image');
        if (imagesToLoad.length === 0) return;

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
            const textureKey = data.namePath || data.textureKey;

            if (!this.scene.textures.exists(textureKey)) {
                console.warn(`Textura no encontrada: ${textureKey}`);
                return;
            }

            const sprite = this.scene.add.sprite(0, 0, textureKey);
            if (this.scene.cameraManager) this.scene.cameraManager.assignToGame(sprite);

            if (!data.namePath) data.namePath = textureKey;

            this.applyProperties(sprite, data);
            this._setupInteractions(sprite, data);
            this.activeSprites.push(sprite);

            this._selectImage(sprite);
        });
    }

    applyProperties(sprite, data) {
        if (typeof data.scale === 'number') sprite.setScale(data.scale);
        else if (Array.isArray(data.scale)) sprite.setScale(data.scale[0], data.scale[1]);

        if (data.position && Array.isArray(data.position)) sprite.setPosition(data.position[0], data.position[1]);
        if (data.origin && Array.isArray(data.origin)) sprite.setOrigin(data.origin[0], data.origin[1]);

        if (data.visible !== undefined) sprite.setVisible(data.visible);
        if (data.opacity !== undefined) sprite.setAlpha(data.opacity);
        if (typeof data.angle === 'number') sprite.setAngle(data.angle);

        let scrollX = 1;
        let scrollY = 1;
        if (data.scrollFactor !== undefined) {
            if (Array.isArray(data.scrollFactor)) {
                scrollX = data.scrollFactor[0];
                scrollY = data.scrollFactor[1];
            } else if (typeof data.scrollFactor === 'number') {
                scrollX = data.scrollFactor;
                scrollY = data.scrollFactor;
            }
        }
        sprite.setScrollFactor(scrollX, scrollY);

        if (data.flip_x !== undefined) sprite.setFlipX(data.flip_x);
        if (data.flip_y !== undefined) sprite.setFlipY(data.flip_y);
        if (typeof data.layer === 'number') sprite.setDepth(data.layer);

        sprite.setData('type', 'image');
        sprite.setData('namePath', data.namePath);
        sprite.setData('config', data);
    }

    _setupInteractions(sprite, data) {
        sprite.setInteractive({ pixelPerfect: true, draggable: true });
        this.scene.input.setDraggable(sprite);

        sprite.on('dragstart', () => {
            this._selectImage(sprite);
            this.dragStart.x = sprite.x;
            this.dragStart.y = sprite.y;
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
            sprite.x = dragX;
            sprite.y = dragY;
            this.scene.events.emit('element_updated', sprite);
        });

        sprite.on('dragend', () => {
            if (this.actionHistory && (this.dragStart.x !== sprite.x || this.dragStart.y !== sprite.y)) {
                this.actionHistory.recordChange(sprite, {
                    x: { from: this.dragStart.x, to: sprite.x },
                    y: { from: this.dragStart.y, to: sprite.y }
                });
            }
            const config = sprite.getData('config');
            if (config) {
                config.position = [sprite.x, sprite.y];
                sprite.setData('config', config);
            }
        });

        sprite.on('pointerdown', (p) => {
            if (p.button !== 0) return;
            p.event.stopPropagation();
            this._selectImage(sprite);
        });
    }

    _selectImage(sprite) {
        this.selectedImage = sprite;
        Selecting.flash(this.scene, sprite, this.scene.cameraManager);
        this.scene.events.emit('element_selected', sprite);
    }

    setVisible(visible) {
        this.activeSprites.forEach(sprite => {
            if (sprite && sprite.active) sprite.setVisible(visible);
        });
    }

    clear() {
        this.activeSprites.forEach(s => {
            if (s && s.active) s.destroy();
        });
        this.activeSprites = [];
        this.selectedImage = null;
        this.clipboard = null;
    }
}