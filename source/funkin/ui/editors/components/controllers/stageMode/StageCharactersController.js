/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageCharactersController.js
 */
import { Characters } from '../../../../../play/characters/Characters.js';
import { CameraBoxVisualizer } from './characters/CameraBoxVisualizer.js';
import CharacterSwapper from './characters/CharacterSwapper.js'; // [IMPORTADO]
import Selecting from '../../elements/Selecting.js';

export default class StageCharactersController {
    constructor(scene, cameraManager) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.sessionId = 'editor_stage_' + Date.now();

        this.characters = null;
        this.cameraBoxes = null;
        this.initialStageData = null;

        // Registro de asignaciones actuales (Slot -> Asset ID)
        this.currentAssignments = {
            player: 'bf',
            enemy: 'dad',
            gfVersion: 'gf'
        };

        this.anchors = {
            player: { x: 0, y: 0, active: false },
            enemy: { x: 0, y: 0, active: false },
            gfVersion: { x: 0, y: 0, active: false }
        };

        // Módulo de Intercambio
        this.swapper = new CharacterSwapper(scene, this); // [INSTANCIADO]

        this.isLoaded = false;
        this.isLoading = false;
        this.isPlaying = false;
        this.fakeSongPosition = 0;
        this.bpm = 120;
    }

    init() {
        if (this.isLoaded || this.isLoading) {
            this.setVisible(true);
            return;
        }

        this.isLoading = true;
        console.log(`[StageCharacters] Iniciando carga...`);

        this.initialStageData = {
            stageContent: {
                stage: [
                    { player: { position: [430, 319], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 100 } },
                    { enemy: { position: [-352, 350], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 99 } },
                    { playergf: { position: [26, 261], camera_Offset: [0, 0], scale: 1, visible: true, opacity: 1, layer: 98 } }
                ]
            }
        };

        this.characters = new Characters(
            this.scene,
            { ...this.currentAssignments, bpm: this.bpm, speed: 1 },
            this.cameraManager,
            this.initialStageData,
            { bpm: this.bpm },
            this.sessionId
        );

        this.characters.loadCharacterJSONs();
        this.scene.load.once('complete', () => {
            this.characters.processAndLoadImages();
            this.scene.load.once('complete', this._onImagesLoaded, this);
            this.scene.load.start();
        });
        this.scene.load.start();

        this.cameraBoxes = new CameraBoxVisualizer(this.scene, this);
    }

    _onImagesLoaded() {
        console.log('[StageCharacters] Imágenes cargadas. Creando sprites...');
        this.characters.createAnimationsAndSprites();
        this._setupEditorInteractions();
        this._applyEditorPositioning();
        this._resetToStaticFrame();

        this.isLoaded = true;
        this.isLoading = false;
        this.setVisible(true);
        console.log('[StageCharacters] Listo y Visible.');
    }

    // --- DELEGACIÓN AL MÓDULO SWAPPER ---
    swapCharacter(slot, newCharName) {
        if (this.swapper) {
            this.swapper.swap(slot, newCharName);
        }
    }

    // --- POSICIONAMIENTO INICIAL ---
    _applyEditorPositioning() {
        if (!this.characters?.characterElements || !this.initialStageData) return;

        const { bf, dad, gf } = this.characters.characterElements;
        const stageArr = this.initialStageData.stageContent.stage;

        const place = (sprite, dataKey) => {
            if (!sprite) return;
            const entry = stageArr.find(d => d[dataKey]);
            if (!entry) return;

            const d = entry[dataKey];
            sprite.setOrigin(0, 0);

            // Solo aplicamos la escala inicial del JSON de stage al principio
            sprite.setScale(d.scale || 1);
            sprite.setAlpha(d.opacity !== undefined ? d.opacity : 1);
            sprite.setDepth(d.layer || 100);
            sprite.setVisible(true);

            const sW = sprite.width * sprite.scaleX;
            const sH = sprite.height * sprite.scaleY;
            sprite.setData('stableWidth', sW);
            sprite.setData('stableHeight', sH);

            const visualX = d.position[0] - (sW / 2);
            const visualY = d.position[1] - sH;
            sprite.setPosition(visualX, visualY);

            const slotMap = { 'player': 'player', 'enemy': 'enemy', 'playergf': 'gfVersion' };
            const slot = slotMap[dataKey];
            const assetName = this.currentAssignments[slot];

            sprite.setData('charAsset', assetName);
        };

        place(bf, 'player');
        place(dad, 'enemy');
        place(gf, 'playergf');
    }

    // --- MÉTODOS PÚBLICOS (INTERACCIONES) ---
    // (Estos métodos son llamados por el Swapper o por el usuario)

    _setupEditorInteractions() {
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        this._setupDraggable(bf, 'Player (BF)', 'player');
        this._setupDraggable(dad, 'Opponent (Dad)', 'enemy');
        this._setupDraggable(gf, 'Girlfriend (GF)', 'gfVersion');
    }

    _setupDraggable(sprite, name, key) {
        if (!sprite) return;
        sprite.setInteractive({ pixelPerfect: true, draggable: true });
        this.scene.input.setDraggable(sprite);

        sprite.setData('characterName', name);
        sprite.setData('charID', key);
        sprite.setData('controller', this);

        sprite.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
        sprite.on('pointerout', () => this.scene.input.setDefaultCursor('default'));

        sprite.on('dragstart', () => {
            this.scene.input.setDefaultCursor('grabbing');
            this._selectCharacter(sprite, name, key);
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
            sprite.x = dragX;
            sprite.y = dragY;
            this.scene.events.emit('element_updated', sprite);
        });

        sprite.on('dragend', () => this.scene.input.setDefaultCursor('grab'));

        sprite.on('pointerdown', (p) => {
            // [MODIFICADO] Bloquear si no es click izquierdo
            if (p.button !== 0) return;

            p.event.stopPropagation();
            if (!p.event.shiftKey) this._selectCharacter(sprite, name, key);
        });
    }

    _selectCharacter(sprite, charName, internalKey) {
        sprite.setData('cameraOffset', this.getCameraOffsets(internalKey));
        sprite.setData('camZoom', this.getCameraZoom(internalKey));

        Selecting.flash(this.scene, sprite, this.cameraManager);
        console.log(`[StageCharacters] Seleccionado: ${charName}`);
        this.scene.events.emit('element_selected', sprite);
    }

    _resetToStaticFrame() {
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        [bf, dad, gf].forEach(spr => {
            if (spr?.anims?.currentAnim) {
                spr.setFrame(spr.anims.currentAnim.frames[0].textureFrame);
                spr.anims.pause();
            }
        });
    }

    // --- MODO TEST (BAILE) ---
    startDancing() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.fakeSongPosition = 0;
        if (this.characters?.characterElements) {
            const { bf, dad, gf } = this.characters.characterElements;
            if (bf) this._setAnchor(bf, 'player');
            if (dad) this._setAnchor(dad, 'enemy');
            if (gf) this._setAnchor(gf, 'gfVersion');
        }
        if (this.characters?.startBeatSystem) this.characters.startBeatSystem();
    }

    stopDancing() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        Object.values(this.anchors).forEach(a => a.active = false);
        this._resetToStaticFrame();
        this._restoreFromAnchors();
        if (this.cameraBoxes) this.cameraBoxes.update();
    }

    update(time, delta) {
        if (!this.isVisible || !this.isLoaded) return;
        if (this.isPlaying && this.characters) {
            this.fakeSongPosition += delta;
            this.characters.update(this.fakeSongPosition);
        }
        if (this.isPlaying && this.characters?.characterElements) {
            const { bf, dad, gf } = this.characters.characterElements;
            this._constrainToAnchor(bf, 'player');
            this._constrainToAnchor(dad, 'enemy');
            this._constrainToAnchor(gf, 'gfVersion');
        }
        if (this.cameraBoxes) this.cameraBoxes.update();
    }

    // --- HELPERS ANCLAJE ---
    _getAnimOffset(sprite) {
        if (!sprite?.anims?.currentAnim) return { x: 0, y: 0 };
        const key = sprite.anims.currentAnim.key;
        const offsets = sprite.getData('offsets') || sprite.animOffsets;
        let val = [0, 0];
        if (offsets instanceof Map) val = offsets.get(key) || [0, 0];
        else if (offsets && offsets[key]) val = offsets[key];
        return { x: val[0], y: val[1] };
    }

    _setAnchor(sprite, key) {
        const offset = this._getAnimOffset(sprite);
        this.anchors[key] = { x: sprite.x + offset.x, y: sprite.y + offset.y, active: true };
    }

    _constrainToAnchor(sprite, key) {
        const anchor = this.anchors[key];
        if (!sprite || !anchor.active) return;
        const offset = this._getAnimOffset(sprite);
        sprite.x = anchor.x - offset.x;
        sprite.y = anchor.y - offset.y;
    }

    _restoreFromAnchors() {
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        const restore = (sprite, key) => {
            const anchor = this.anchors[key];
            if (sprite && anchor.x !== 0) {
                sprite.x = anchor.x;
                sprite.y = anchor.y;
                this.scene.events.emit('element_updated', sprite);
            }
        };
        restore(bf, 'player'); restore(dad, 'enemy'); restore(gf, 'gfVersion');
    }

    // --- PUBLIC API ---
    setVisible(visible) {
        this.isVisible = visible;
        if (!this.characters?.characterElements) return;
        const { bf, dad, gf } = this.characters.characterElements;
        const apply = (s) => { if (s) { s.setVisible(visible); s.setActive(visible); if (visible) s.setAlpha(1); } };
        apply(bf); apply(dad); apply(gf);
        if (this.cameraBoxes) this.cameraBoxes.setVisible(visible);
    }

    getCameraOffsets(k) { return this.cameraBoxes ? this.cameraBoxes.getCameraOffsets(k) : { x: 0, y: 0 }; }
    setCameraOffset(k, x, y) { if (this.cameraBoxes) this.cameraBoxes.setCameraOffset(k, x, y); }
    getCameraZoom(k) { return this.cameraBoxes ? this.cameraBoxes.getCameraZoom(k) : 1; }
    setCameraZoom(k, z) { if (this.cameraBoxes) this.cameraBoxes.setCameraZoom(k, z); }

    destroy() {
        this.isPlaying = false;
        if (this.characters) this.characters.shutdown();
        if (this.cameraBoxes) this.cameraBoxes.destroy();
        this.scene.load.off('complete', this._onImagesLoaded, this);
        this.scene.input.setDefaultCursor('default');
    }
}