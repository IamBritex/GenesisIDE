/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageCharactersController.js
 */
import { Characters } from '../../../../../play/characters/Characters.js';
import { CameraBoxVisualizer } from './characters/CameraBoxVisualizer.js';

// [NUEVO] Importamos el módulo de Selección para usar el efecto Flash
import Selecting from '../../elements/selecting.js';

export default class StageCharactersController {
    constructor(scene, cameraManager) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.sessionId = 'editor_stage_' + Date.now();

        this.characters = null;
        this.cameraBoxes = null;

        // Offsets de cámara (Editables)
        this.cameraOffsets = new Map([
            ['player', { x: -200, y: -100 }],
            ['enemy', { x: 200, y: -100 }],
            ['gfVersion', { x: 0, y: 0 }]
        ]);

        this.isVisible = false;
        this.isLoaded = false;
        this.isLoading = false;

        this.fakeSongPosition = 0;
        this.bpm = 120;
        this.isPlaying = false;
    }

    init() {
        if (this.isLoaded || this.isLoading) {
            this.setVisible(true);
            return;
        }

        this.isLoading = true;
        console.log(`[StageCharacters] Iniciando (SessionID: ${this.sessionId})...`);

        const fakeChartData = {
            player: 'bf', enemy: 'dad', gfVersion: 'gf', bpm: this.bpm, speed: 1
        };

        const mockStageHandler = {
            stageContent: this._createDefaultStageData()
        };

        this.characters = new Characters(
            this.scene,
            fakeChartData,
            this.cameraManager,
            mockStageHandler,
            { bpm: this.bpm },
            this.sessionId
        );

        this.characters.loadCharacterJSONs();
        this.scene.load.once('complete', this._onJSONsLoaded, this);
        this.scene.load.start();

        this.cameraBoxes = new CameraBoxVisualizer(this.scene, this);
    }

    _onJSONsLoaded() {
        this.characters.processAndLoadImages();
        this.scene.load.once('complete', this._onImagesLoaded, this);
        this.scene.load.start();
    }

    _onImagesLoaded() {
        this.characters.createAnimationsAndSprites();
        this._applyEditorPositioning();
        this._setupEditorInteractions();

        this.isLoaded = true;
        this.isLoading = false;
        this.setVisible(true);

        this._resetToStaticFrame();

        console.log('[StageCharacters] Personajes listos.');
    }

    _resetToStaticFrame() {
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        [bf, dad, gf].forEach(spr => {
            if (spr && spr.anims && spr.anims.currentAnim) {
                spr.setFrame(spr.anims.currentAnim.frames[0].textureFrame);
                spr.anims.pause();
            }
        });
    }

    _createDefaultStageData() {
        return {
            stage: [
                { player: { position: [430, 319], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 10 } },
                { enemy: { position: [-352, 350], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 9 } },
                { playergf: { position: [26, 261], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 8 } }
            ]
        };
    }

    _applyEditorPositioning() {
        if (!this.characters || !this.characters.characterElements) return;

        const { bf, dad, gf } = this.characters.characterElements;
        const data = this._createDefaultStageData().stage;

        const adjust = (sprite, dataBlock) => {
            if (!sprite) return;
            sprite.setOrigin(0, 0);
            const targetX = dataBlock.position[0];
            const targetY = dataBlock.position[1];

            const stableWidth = sprite.width * sprite.scaleX;
            const stableHeight = sprite.height * sprite.scaleY;
            sprite.setData('stableWidth', stableWidth);
            sprite.setData('stableHeight', stableHeight);

            const correctedX = targetX - (stableWidth / 2);
            const correctedY = targetY - stableHeight;
            sprite.setPosition(correctedX, correctedY);
        };

        const pData = data.find(d => d.player)?.player;
        const eData = data.find(d => d.enemy)?.enemy;
        const gData = data.find(d => d.playergf)?.playergf;

        if (pData) adjust(bf, pData);
        if (eData) adjust(dad, eData);
        if (gData) adjust(gf, gData);
    }

    _setupEditorInteractions() {
        if (!this.characters?.characterElements) return;
        const group = this.characters.characterElements;

        const register = (sprite, charName, internalKey) => {
            if (!sprite) return;

            // Habilitar interactividad y Arrastre
            sprite.setInteractive({ pixelPerfect: true, draggable: true });
            this.scene.input.setDraggable(sprite);

            sprite.setData('characterName', charName);
            sprite.setData('charID', internalKey);
            sprite.setData('controller', this);

            const currentOffset = this.getCameraOffsets(internalKey);
            sprite.setData('cameraOffset', currentOffset);

            // --- EVENTOS ---

            // Hover: apuntar
            sprite.on('pointerover', () => {
                this.scene.input.setDefaultCursor('pointer');
            });

            // Out: Cursor normal
            sprite.on('pointerout', () => {
                this.scene.input.setDefaultCursor('default');
            });

            // Drag Start: Mano cerrada y Selección
            sprite.on('dragstart', (pointer, dragX, dragY) => {
                this.scene.input.setDefaultCursor('grabbing');

                // Seleccionar al empezar a arrastrar
                this._selectCharacter(sprite, charName, internalKey);
            });

            // Dragging: Mover y Actualizar UI
            sprite.on('drag', (pointer, dragX, dragY) => {
                sprite.x = dragX;
                sprite.y = dragY;

                // Actualizar números en el panel de propiedades en tiempo real
                this.scene.events.emit('element_updated', sprite);
            });

            // Drag End: Volver a mano abierta
            sprite.on('dragend', () => {
                this.scene.input.setDefaultCursor('grab');
            });

            // Click simple (Fallback para clicks rápidos sin arrastre)
            sprite.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                if (!pointer.event.shiftKey) {
                    this._selectCharacter(sprite, charName, internalKey);
                }
            });
        };

        register(group.bf, 'Player (BF)', 'player');
        register(group.dad, 'Opponent (Dad)', 'enemy');
        register(group.gf, 'Girlfriend (GF)', 'gfVersion');
    }

    // Helper para seleccionar, notificar y lanzar el efecto visual
    _selectCharacter(sprite, charName, internalKey) {
        sprite.setData('cameraOffset', this.getCameraOffsets(internalKey));

        // [NUEVO] Llamada al efecto de destello desde la utilidad modularizada
        // Asegúrate de que Selecting.js exista en: ui/editors/components/elements/Selecting.js
        Selecting.flash(this.scene, sprite, this.cameraManager);

        console.log(`[StageCharacters] Seleccionado: ${charName}`);
        this.scene.events.emit('element_selected', sprite);
    }

    update(time, delta) {
        if (!this.isVisible || !this.isLoaded) return;

        if (this.isPlaying && this.characters) {
            this.fakeSongPosition += delta;
            this.characters.update(this.fakeSongPosition);
        }

        if (this.cameraBoxes) this.cameraBoxes.update();
    }

    startDancing() {
        this.isPlaying = true;
        this.fakeSongPosition = 0;
        if (this.characters && this.characters.startBeatSystem) {
            this.characters.startBeatSystem();
        }
    }

    stopDancing() {
        this.isPlaying = false;
        this._resetToStaticFrame();
    }

    setVisible(visible) {
        this.isVisible = visible;
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        if (bf) bf.setVisible(visible);
        if (dad) dad.setVisible(visible);
        if (gf) gf.setVisible(visible);
        if (this.cameraBoxes) this.cameraBoxes.setVisible(visible);
    }

    getCameraOffsets(charKey) {
        return this.cameraOffsets.get(charKey) || { x: 0, y: 0 };
    }

    setCameraOffset(charKey, x, y) {
        this.cameraOffsets.set(charKey, { x, y });
        if (this.cameraBoxes) this.cameraBoxes.update();
    }

    destroy() {
        this.isPlaying = false;
        if (this.characters) this.characters.shutdown();
        if (this.cameraBoxes) this.cameraBoxes.destroy();
        this.scene.load.off('complete', this._onJSONsLoaded, this);
        this.scene.load.off('complete', this._onImagesLoaded, this);
        this.scene.input.setDefaultCursor('default');
    }
}