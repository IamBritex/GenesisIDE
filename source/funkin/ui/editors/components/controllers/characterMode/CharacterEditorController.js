/**
 * source/funkin/ui/editors/components/controllers/characterMode/CharacterEditorController.js
 */
import { Characters } from '../../../../../play/characters/Characters.js';

export default class CharacterEditorController {
    constructor(scene, cameraManager) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.sessionId = 'editor_char_' + Date.now();

        this.characters = null;
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
        console.log(`[CharacterEditor] Iniciando carga de BF...`);

        const charData = {
            player: 'bf',
            enemy: 'dad',
            gfVersion: 'gf',
            bpm: this.bpm,
            speed: 1
        };

        const mockStageHandler = {
            stageContent: {
                stage: [
                    { player: { position: [0, 0], camera_Offset: [0, 0], scale: 1, visible: true } }
                ]
            }
        };

        this.characters = new Characters(
            this.scene,
            charData,
            this.cameraManager,
            mockStageHandler,
            { bpm: this.bpm },
            this.sessionId
        );

        this.characters.loadCharacterJSONs();
        this.scene.load.once('complete', this._onJSONsLoaded, this);
        this.scene.load.start();
    }

    _onJSONsLoaded() {
        this.characters.processAndLoadImages();
        this.scene.load.once('complete', this._onImagesLoaded, this);
        this.scene.load.start();
    }

    _onImagesLoaded() {
        this.characters.createAnimationsAndSprites();
        this._setupSingleCharacter();

        this.isLoaded = true;
        this.isLoading = false;
        this.setVisible(true);

        this._resetToStaticFrame();

        console.log('[CharacterEditor] BF Listo (Estático).');
    }

    _setupSingleCharacter() {
        if (!this.characters || !this.characters.characterElements) return;

        const { bf, dad, gf } = this.characters.characterElements;

        if (dad) { dad.setVisible(false); dad.active = false; }
        if (gf) { gf.setVisible(false); gf.active = false; }

        if (bf) {
            bf.setVisible(true);

            const stableWidth = bf.width * bf.scaleX;
            const stableHeight = bf.height * bf.scaleY;

            bf.x = 0 - (stableWidth / 2);
            bf.y = 0 - (stableHeight / 2);

            bf.setInteractive({ pixelPerfect: true });

            // [NUEVO] Efecto de destello en Character Mode también
            bf.on('pointerdown', (pointer) => {
                if (pointer.leftButtonDown()) {
                    this._triggerFlash(bf);
                }
            });

            this.scene.cameras.main.centerOn(0, 0);
        }
    }

    // [NUEVO] Método flash
    _triggerFlash(sprite) {
        if (!sprite || !sprite.texture) return;
        const flash = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture, sprite.frame ? sprite.frame.name : null);
        flash.setOrigin(sprite.originX, sprite.originY);
        flash.setScale(sprite.scaleX, sprite.scaleY);
        flash.setFlipX(sprite.flipX);
        flash.setFlipY(sprite.flipY);

        if (this.cameraManager) this.cameraManager.assignToGame(flash);

        flash.setDepth(sprite.depth + 1);
        flash.setTintFill(0xFFFFFF);
        flash.setAlpha(0.6);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.out',
            onComplete: () => flash.destroy()
        });
    }

    _resetToStaticFrame() {
        if (!this.characters?.characterElements) return;
        const { bf } = this.characters.characterElements;

        if (bf && bf.anims) {
            if (bf.anims.currentAnim) {
                bf.anims.play(bf.anims.currentAnim.key, true);
                bf.anims.pause();
                bf.setFrame(bf.anims.currentAnim.frames[0].textureFrame);
            }
        }
    }

    update(time, delta) {
        if (!this.isLoaded) return;

        if (this.isPlaying && this.characters) {
            this.fakeSongPosition += delta;
            this.characters.update(this.fakeSongPosition);
        }
    }

    setVisible(visible) {
        if (!this.characters?.characterElements) return;
        const { bf } = this.characters.characterElements;
        if (bf) bf.setVisible(visible);
    }

    destroy() {
        if (this.characters) this.characters.shutdown();
        this.scene.load.off('complete', this._onJSONsLoaded, this);
        this.scene.load.off('complete', this._onImagesLoaded, this);
    }
}