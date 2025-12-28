/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageSpriteController.js
 */
import Selecting from '../../elements/Selecting.js';

export default class StageSpriteController {
    constructor(scene) {
        this.scene = scene;
        this.activeSprites = [];
        this.basePath = 'public/images/stages/';
        this.lastBeatHit = -1;
        this.isPlaying = false;

        // Escuchar actualizaciones para refrescar animaciones (eliminar borradas o cambiar modos)
        this.scene.events.on('element_updated', this.refreshSprite, this);
    }

    /**
     * Se llama cuando se actualiza la configuración de un sprite (ej: borrar animación, cambiar modo)
     */
    refreshSprite(sprite) {
        if (sprite && sprite.active && sprite.getData('type') === 'spritesheet') {
            const config = sprite.getData('config');
            if (config) {
                // Reconstruir animaciones Phaser basadas en la nueva config
                this._setupAnimations(sprite, config, sprite.texture.key);

                // [NUEVO] Si el modo es None, detener inmediatamente y salir
                if (config.animation && config.animation.play_mode === 'None') {
                    sprite.anims.stop();
                    return;
                }

                // Verificar si la animación actual sigue siendo válida
                const keys = sprite.getData('animKeys');
                if (keys && keys.length > 0) {
                    // Si el índice apunta fuera de rango (ej: borraste la última), resetear
                    const currentIdx = sprite.getData('animIndex') || 0;
                    if (currentIdx >= keys.length) {
                        sprite.setData('animIndex', 0);
                        const newKey = `${sprite.texture.key}_${keys[0]}`;
                        sprite.play(newKey);
                        if (!this.isPlaying) sprite.anims.pause();
                    } else {
                        // Si estamos en modo Loop y deberíamos estar reproduciendo
                        if (this.isPlaying && config.animation.play_mode === 'Loop' && !sprite.anims.isPlaying) {
                            sprite.anims.resume();
                        }
                    }
                } else {
                    // Si no quedan animaciones, detener sprite
                    sprite.stop();
                }
            }
        }
    }

    loadSprites(stageName, stageDataArray) {
        this.clear();
        const spritesToLoad = stageDataArray.filter(item => item.type === 'spritesheet');
        if (spritesToLoad.length === 0) return;

        console.log(`[StageSprites] Detectados ${spritesToLoad.length} spritesheets.`);

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
            this.scene.load.once('complete', () => {
                this._instantiateSprites(spritesToLoad);
            });
            this.scene.load.start();
        } else {
            this._instantiateSprites(spritesToLoad);
        }
    }

    _instantiateSprites(spritesData) {
        spritesData.forEach(data => {
            const key = data.namePath;
            if (!this.scene.textures.exists(key)) return;

            const sprite = this.scene.add.sprite(0, 0, key);

            if (this.scene.cameraManager) {
                this.scene.cameraManager.assignToGame(sprite);
            }

            this.applyProperties(sprite, data);
            this._setupAnimations(sprite, data, key);
            this._setupInteractions(sprite);

            sprite.anims.pause();
            this.activeSprites.push(sprite);
        });
    }

    applyProperties(sprite, data) {
        if (Array.isArray(data.position)) sprite.setPosition(data.position[0], data.position[1]);
        if (Array.isArray(data.origin)) sprite.setOrigin(data.origin[0], data.origin[1]);
        if (typeof data.scale === 'number') sprite.setScale(data.scale);
        if (data.flip_x !== undefined) sprite.setFlipX(data.flip_x);
        if (data.flip_y !== undefined) sprite.setFlipY(data.flip_y);
        if (data.visible !== undefined) sprite.setVisible(data.visible);
        if (data.opacity !== undefined) sprite.setAlpha(data.opacity);
        if (typeof data.layer === 'number') sprite.setDepth(data.layer);

        if (typeof data.scrollFactor === 'number') sprite.setScrollFactor(data.scrollFactor);
        else if (Array.isArray(data.scrollFactor)) sprite.setScrollFactor(data.scrollFactor[0], data.scrollFactor[1]);

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

        // Reconstruir lista de Keys basada SOLO en la config actual
        const animKeys = Object.keys(playList);
        sprite.setData('animKeys', animKeys);

        if (sprite.getData('animIndex') === undefined) {
            sprite.setData('animIndex', 0);
        }

        animKeys.forEach(animName => {
            const animData = playList[animName];
            const globalKey = `${textureKey}_${animName}`;

            if (!this.scene.anims.exists(globalKey)) {
                let frames = [];
                if (animData.indices && animData.indices.length > 0) {
                    frames = animData.indices.map(idx => ({
                        key: textureKey,
                        frame: `${animData.prefix}${idx}`
                    }));
                } else {
                    frames = this.scene.anims.generateFrameNames(textureKey, {
                        prefix: animData.prefix,
                        zeroPad: 0,
                        suffix: ''
                    });
                }

                if (frames.length > 0) {
                    this.scene.anims.create({
                        key: globalKey,
                        frames: frames,
                        frameRate: fps,
                        repeat: 0
                    });
                }
            }
        });

        // [NUEVO] Si el modo es None, no configurar reproducción automática inicial
        if (data.animation.play_mode === 'None') {
            return;
        }

        // Configuración inicial de visualización (solo si no es None)
        if (animKeys.length > 0) {
            const currentAnim = sprite.anims.currentAnim;
            const currentKeyBase = currentAnim ? currentAnim.key.replace(`${textureKey}_`, '') : '';

            // Si la animación que se estaba viendo fue borrada, poner la primera de la lista
            if (!playList[currentKeyBase]) {
                const firstAnimKey = `${textureKey}_${animKeys[0]}`;
                sprite.play(firstAnimKey);
                if (!this.isPlaying) sprite.anims.pause();
            }
        }

        // Limpiar eventos anteriores
        sprite.off('animationcomplete');

        // Lógica de ciclo de animaciones
        sprite.on('animationcomplete', () => {
            if (!this.isPlaying) return;

            // [SEGURIDAD] Doble verificación por si cambia en caliente
            const currentConfig = sprite.getData('config');
            if (currentConfig && currentConfig.animation && currentConfig.animation.play_mode === 'None') return;

            const currentIndex = sprite.getData('animIndex');
            const keys = sprite.getData('animKeys');

            if (keys.length === 0) return;

            const nextIndex = (currentIndex + 1) % keys.length;
            sprite.setData('animIndex', nextIndex);

            const nextAnimName = keys[nextIndex];
            const nextGlobalKey = `${textureKey}_${nextAnimName}`;

            sprite.play(nextGlobalKey, true);
        });
    }

    setVisible(visible) {
        this.activeSprites.forEach(sprite => {
            if (sprite && sprite.active) {
                sprite.setVisible(visible);
            }
        });
    }

    _setupInteractions(sprite) {
        sprite.setInteractive({ pixelPerfect: true, draggable: true });
        this.scene.input.setDraggable(sprite);

        sprite.on('drag', (pointer, dragX, dragY) => {
            sprite.x = dragX;
            sprite.y = dragY;
            this.scene.events.emit('element_updated', sprite);
        });

        sprite.on('pointerdown', (p) => {
            if (p.button !== 0) return;
            p.event.stopPropagation();
            this._selectSprite(sprite);
        });
    }

    _selectSprite(sprite) {
        Selecting.flash(this.scene, sprite, this.scene.cameraManager);
        this.scene.events.emit('element_selected', sprite);
    }

    setGlobalPlayback(active) {
        this.isPlaying = active;

        this.activeSprites.forEach(sprite => {
            const config = sprite.getData('config');

            // [NUEVO] Si es None, asegurarse de que esté detenido y continuar
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
                            const key = `${sprite.getData('namePath')}_${keys[idx]}`;
                            sprite.play(key, true);
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
            const config = sprite.getData('config');

            // [NUEVO] Ignorar si es None
            if (config && config.animation && config.animation.play_mode === 'None') return;

            if (config && config.animation && config.animation.play_mode === 'Beat') {
                const interval = (config.animation.beat && config.animation.beat[0]) || 1;

                if (curBeat % interval === 0) {
                    const keys = sprite.getData('animKeys');
                    if (keys && keys.length > 0) {
                        const idx = sprite.getData('animIndex') % keys.length;
                        const animKey = `${config.namePath}_${keys[idx]}`;
                        sprite.play(animKey, true);
                    }
                }
            }
        });
    }

    clear() {
        this.activeSprites.forEach(s => s.destroy());
        this.activeSprites = [];
        this.lastBeatHit = -1;
        this.isPlaying = false;
    }

    destroy() {
        this.clear();
        this.scene.events.off('element_updated', this.refreshSprite, this);
    }
}