/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageSpriteController.js
 */
import Selecting from '../../elements/Selecting.js';

export default class StageSpriteController {
    constructor(scene, actionHistory) {
        this.scene = scene;
        this.actionHistory = actionHistory;
        this.activeSprites = [];
        this.basePath = 'public/images/stages/';
        this.lastBeatHit = -1;
        this.isPlaying = false;
        this.dragStart = { x: 0, y: 0 };

        this.clipboard = null;
        this.selectedSprite = null;

        // Shift para Paste in Place
        this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        this.scene.events.on('element_updated', this.refreshSprite, this);
        this.scene.events.on('element_selected', (sprite) => {
            if (sprite && sprite.getData('type') === 'spritesheet') {
                this.selectedSprite = sprite;
            }
        });

        // --- SHORTCUTS INTERNOS ---
        // Agregado soporte para Delete y Backspace
        this.scene.input.keyboard.on('keydown', (event) => {
            // Si el usuario está escribiendo en un input HTML, ignoramos para no borrar cosas del stage
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

            if (event.key === 'Delete' || event.key === 'Backspace') {
                this.deleteSelected();
            }
        });
    }

    copy() {
        if (!this.selectedSprite || !this.selectedSprite.active) return null;

        const baseConfig = this.selectedSprite.getData('config') || {};

        // Copia profunda con propiedades actuales
        const currentData = {
            ...baseConfig,
            position: [this.selectedSprite.x, this.selectedSprite.y],
            scale: [this.selectedSprite.scaleX, this.selectedSprite.scaleY],
            scrollFactor: [this.selectedSprite.scrollFactorX, this.selectedSprite.scrollFactorY],
            angle: this.selectedSprite.angle,
            opacity: this.selectedSprite.alpha,
            flip_x: this.selectedSprite.flipX,
            flip_y: this.selectedSprite.flipY,
            layer: this.selectedSprite.depth,
            visible: this.selectedSprite.visible
        };

        this.clipboard = JSON.parse(JSON.stringify(currentData));
        console.log("StageSpriteController: Sprite copiado.");
        return this.clipboard;
    }

    paste(pastedData) {
        let dataToUse = null;

        if (pastedData && typeof pastedData === 'object' && pastedData.type === 'spritesheet') {
            dataToUse = pastedData;
        } else {
            dataToUse = this.clipboard;
        }

        if (!dataToUse) {
            console.warn("StageSpriteController: Nada para pegar.");
            return;
        }

        const newData = JSON.parse(JSON.stringify(dataToUse));
        const isShiftDown = this.shiftKey.isDown;

        if (isShiftDown) {
            console.log("Pegando Sprite: Coordenadas originales (Shift)");
        } else {
            const worldPoint = this.scene.input.activePointer.positionToCamera(this.scene.cameras.main);
            newData.position = [worldPoint.x, worldPoint.y];
        }

        this._instantiateSprites([newData]);
    }

    deleteSelected() {
        if (this.selectedSprite && this.selectedSprite.active) {
            this.selectedSprite.destroy();
            this.activeSprites = this.activeSprites.filter(s => s.active);
            this.selectedSprite = null;
            this.scene.events.emit('element_deselected');
            console.log("StageSpriteController: Sprite eliminado.");
        }
    }

    // --- CORE LOGIC ---

    refreshSprite(sprite) {
        if (sprite && sprite.active && sprite.getData('type') === 'spritesheet') {
            const config = sprite.getData('config');
            if (config) {
                this._setupAnimations(sprite, config, sprite.texture.key);
                if (config.animation && config.animation.play_mode === 'None') {
                    sprite.anims.stop();
                    return;
                }
                const keys = sprite.getData('animKeys');
                if (keys && keys.length > 0) {
                    const currentIdx = sprite.getData('animIndex') || 0;
                    if (currentIdx >= keys.length) {
                        sprite.setData('animIndex', 0);
                        const newKey = `${sprite.texture.key}_${keys[0]}`;
                        sprite.play(newKey);
                        if (!this.isPlaying) sprite.anims.pause();
                    } else {
                        if (this.isPlaying && config.animation.play_mode === 'Loop' && !sprite.anims.isPlaying) {
                            sprite.anims.resume();
                        }
                    }
                } else {
                    sprite.stop();
                }
            }
        }
    }

    loadSprites(stageName, stageDataArray) {
        this.clear();
        const spritesToLoad = stageDataArray.filter(item => item.type === 'spritesheet');
        if (spritesToLoad.length === 0) return;

        let loadCount = 0;
        spritesToLoad.forEach(data => {
            const key = data.namePath;
            const pngURL = `${this.basePath}${stageName}/${key}.png`;
            const xmlURL = `${this.basePath}${stageName}/${key}.xml`;
            if (!this.scene.textures.exists(key)) {
                this.scene.load.atlasXML(key, pngURL, xmlURL);
                loadCount++;
            }
        });

        if (loadCount > 0) {
            this.scene.load.once('complete', () => this._instantiateSprites(spritesToLoad));
            this.scene.load.start();
        } else {
            this._instantiateSprites(spritesToLoad);
        }
    }

    _instantiateSprites(spritesData) {
        spritesData.forEach(data => {
            const key = data.namePath || data.textureKey;

            if (!this.scene.textures.exists(key)) {
                console.warn(`Sprite Atlas no encontrado: ${key}`);
                return;
            }

            const sprite = this.scene.add.sprite(0, 0, key);
            if (this.scene.cameraManager) this.scene.cameraManager.assignToGame(sprite);

            if (!data.namePath) data.namePath = key;

            this.applyProperties(sprite, data);
            this._setupAnimations(sprite, data, key);
            this._setupInteractions(sprite);

            sprite.anims.pause();
            this.activeSprites.push(sprite);

            this._selectSprite(sprite);
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

        sprite.setData('type', 'spritesheet');
        sprite.setData('namePath', data.namePath);
        sprite.setData('config', data);
    }

    _setupAnimations(sprite, data, textureKey) {
        if (!data.animation || !data.animation.play_list) {
            sprite.setData('animKeys', []);
            return;
        }
        const playList = data.animation.play_list;
        const fps = data.animation.frameRate || 24;
        const animKeys = Object.keys(playList);
        sprite.setData('animKeys', animKeys);
        if (sprite.getData('animIndex') === undefined) sprite.setData('animIndex', 0);

        animKeys.forEach(animName => {
            const animData = playList[animName];
            const globalKey = `${textureKey}_${animName}`;
            if (!this.scene.anims.exists(globalKey)) {
                let frames = [];
                if (animData.indices && animData.indices.length > 0) {
                    frames = animData.indices.map(idx => ({ key: textureKey, frame: `${animData.prefix}${idx}` }));
                } else {
                    frames = this.scene.anims.generateFrameNames(textureKey, { prefix: animData.prefix, zeroPad: 0, suffix: '' });
                }
                if (frames.length > 0) {
                    this.scene.anims.create({ key: globalKey, frames: frames, frameRate: fps, repeat: 0 });
                }
            }
        });

        if (data.animation.play_mode === 'None') return;
        if (animKeys.length > 0) {
            const currentAnim = sprite.anims.currentAnim;
            const currentKeyBase = currentAnim ? currentAnim.key.replace(`${textureKey}_`, '') : '';
            if (!playList[currentKeyBase]) {
                const firstAnimKey = `${textureKey}_${animKeys[0]}`;
                sprite.play(firstAnimKey);
                if (!this.isPlaying) sprite.anims.pause();
            }
        }
        sprite.off('animationcomplete');
        sprite.on('animationcomplete', () => {
            if (!this.isPlaying) return;
            const currentConfig = sprite.getData('config');
            if (currentConfig && currentConfig.animation && currentConfig.animation.play_mode === 'None') return;
            const currentIndex = sprite.getData('animIndex');
            const keys = sprite.getData('animKeys');
            if (keys.length === 0) return;
            const nextIndex = (currentIndex + 1) % keys.length;
            sprite.setData('animIndex', nextIndex);
            const nextAnimName = keys[nextIndex];
            sprite.play(`${textureKey}_${nextAnimName}`, true);
        });
    }

    setVisible(visible) {
        this.activeSprites.forEach(sprite => {
            if (sprite && sprite.active) sprite.setVisible(visible);
        });
    }

    _setupInteractions(sprite) {
        sprite.setInteractive({ pixelPerfect: true, draggable: true });
        this.scene.input.setDraggable(sprite);

        sprite.on('dragstart', () => {
            this.dragStart.x = sprite.x;
            this.dragStart.y = sprite.y;
            this._selectSprite(sprite);
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
            this._selectSprite(sprite);
        });
    }

    _selectSprite(sprite) {
        this.selectedSprite = sprite;
        Selecting.flash(this.scene, sprite, this.scene.cameraManager);
        this.scene.events.emit('element_selected', sprite);
    }

    setGlobalPlayback(active) {
        this.isPlaying = active;
        this.activeSprites.forEach(sprite => {
            if (!sprite || !sprite.active || !sprite.anims) return;
            const config = sprite.getData('config');
            if (config && config.animation && config.animation.play_mode === 'None') {
                sprite.anims.stop();
                return;
            }
            if (active) {
                if (config && config.animation && config.animation.play_mode === 'Loop') {
                    sprite.anims.resume();
                    if (!sprite.anims.isPlaying) {
                        const keys = sprite.getData('animKeys');
                        if (keys && keys.length > 0) {
                            const idx = sprite.getData('animIndex') % keys.length;
                            sprite.play(`${sprite.getData('namePath')}_${keys[idx]}`, true);
                        }
                    }
                }
            } else {
                sprite.anims.pause();
            }
        });
    }

    beatHit(curBeat) {
        if (!this.isPlaying) return;
        if (this.lastBeatHit === curBeat) return;
        this.lastBeatHit = curBeat;
        this.activeSprites.forEach(sprite => {
            if (!sprite || !sprite.active) return;
            const config = sprite.getData('config');
            if (config && config.animation && config.animation.play_mode === 'None') return;
            if (config && config.animation && config.animation.play_mode === 'Beat') {
                const interval = (config.animation.beat && config.animation.beat[0]) || 1;
                if (curBeat % interval === 0) {
                    const keys = sprite.getData('animKeys');
                    if (keys && keys.length > 0) {
                        const idx = sprite.getData('animIndex') % keys.length;
                        sprite.play(`${config.namePath}_${keys[idx]}`, true);
                    }
                }
            }
        });
    }

    clear() {
        this.activeSprites.forEach(s => {
            if (s && s.active) s.destroy();
        });
        this.activeSprites = [];
        this.lastBeatHit = -1;
        this.isPlaying = false;
        this.selectedSprite = null;
        this.clipboard = null;
    }

    destroy() {
        this.clear();
        this.scene.events.off('element_updated', this.refreshSprite, this);
    }
}