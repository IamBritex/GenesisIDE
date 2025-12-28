/**
 * source/funkin/ui/editors/components/controllers/stageMode/StageTestMode.js
 */
export default class StageTestMode {
    constructor(scene, cameraManager, charController) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.charController = charController;
        this.isActive = false;
        this.lastBeat = -1;
        this.cameraSequence = ['gfVersion', 'player', 'enemy'];
        this.seqIndex = 0;
        this.targetPos = { x: 0, y: 0 };
        this.targetZoom = 1;
        this.lerpSpeed = 0.04;

        this.onKeyDown = this.onKeyDown.bind(this);
        this._setupInput();
    }

    _setupInput() { this.scene.input.keyboard.on('keydown', this.onKeyDown); }

    onKeyDown(event) {
        if (event.key === 'Enter') {
            const active = document.activeElement;
            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
            if (isTyping) { active.blur(); return; }
            this.toggle();
        }
    }

    toggle() { this.isActive ? this.stop() : this.start(); }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        console.log('[StageTestMode] START');
        this.lastBeat = -1;
        this.seqIndex = 0;

        // Init Lerp
        this.targetPos.x = this.scene.cameras.main.scrollX + (this.scene.cameras.main.width / 2);
        this.targetPos.y = this.scene.cameras.main.scrollY + (this.scene.cameras.main.height / 2);
        this.targetZoom = this.scene.cameras.main.zoom;

        this.scene.input.mouse.enabled = false;
        if (this.cameraManager) this.cameraManager.zoomEnabled = false;
        this._setUIVisibility(false);

        if (this.charController) {
            this.charController.startDancing();
            this._switchCameraToNext();
        }
        this.scene.events.emit('editor-test-mode-start');
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        console.log('[StageTestMode] STOP');
        this.scene.input.mouse.enabled = true;
        if (this.cameraManager) this.cameraManager.zoomEnabled = true;
        this._setUIVisibility(true);
        if (this.charController) this.charController.stopDancing();
        this.scene.events.emit('editor-test-mode-stop');
    }

    update(time, delta) {
        if (!this.isActive || !this.charController) return;

        // Ritmo
        const bpm = this.charController.bpm || 100;
        const songPos = this.charController.fakeSongPosition;
        const crochet = 60000 / bpm;
        const curBeat = Math.floor(songPos / crochet);

        if (curBeat > this.lastBeat) {
            this.lastBeat = curBeat;
            if (curBeat % 4 === 0) this._switchCameraToNext();
        }

        // LERP
        const cam = this.scene.cameras.main;
        const newZoom = cam.zoom + (this.targetZoom - cam.zoom) * this.lerpSpeed;
        cam.setZoom(newZoom);

        const curCX = cam.scrollX + (cam.width * 0.5);
        const curCY = cam.scrollY + (cam.height * 0.5);
        const nextCX = curCX + (this.targetPos.x - curCX) * this.lerpSpeed;
        const nextCY = curCY + (this.targetPos.y - curCY) * this.lerpSpeed;
        cam.centerOn(nextCX, nextCY);
    }

    _switchCameraToNext() {
        const charKey = this.cameraSequence[this.seqIndex];
        this._calculateTarget(charKey);
        this.seqIndex = (this.seqIndex + 1) % this.cameraSequence.length;
    }

    _calculateTarget(charKey) {
        if (!this.charController) return;

        // 1. Posición
        const anchor = this.charController.anchors ? this.charController.anchors[charKey] : null;
        const camOffset = this.charController.getCameraOffsets(charKey);
        let finalX = 0, finalY = 0;

        if (anchor && anchor.active) {
            finalX = anchor.x + camOffset.x;
            finalY = anchor.y + camOffset.y;
        } else {
            const elements = this.charController.characters?.characterElements;
            let sprite = null;
            if (charKey === 'player') sprite = elements.bf;
            else if (charKey === 'enemy') sprite = elements.dad;
            else if (charKey === 'gfVersion') sprite = elements.gf;

            if (sprite) {
                let animOffset = { x: 0, y: 0 };
                if (typeof this.charController._getAnimOffset === 'function') {
                    animOffset = this.charController._getAnimOffset(sprite);
                }
                finalX = (sprite.x + animOffset.x) + camOffset.x;
                finalY = (sprite.y + animOffset.y) + camOffset.y;
            }
        }

        this.targetPos.x = finalX;
        this.targetPos.y = finalY;

        // 2. Zoom [MODIFICADO]
        // Ahora usamos el zoom configurado por el usuario en las cajas
        // en lugar de calcular un auto-fit.
        this.targetZoom = this.charController.getCameraZoom(charKey);
    }

    _setUIVisibility(visible) {
        this.scene.cameras.cameras.forEach(cam => { if (cam !== this.scene.cameras.main) cam.setVisible(visible); });
        if (this.scene.sys.game.domContainer) this.scene.sys.game.domContainer.style.visibility = visible ? 'visible' : 'hidden';
    }

    destroy() { this.stop(); this.scene.input.keyboard.off('keydown', this.onKeyDown); }
}