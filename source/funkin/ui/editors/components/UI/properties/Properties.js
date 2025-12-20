/**
 * source/funkin/ui/editors/components/UI/properties/Properties.js
 */
export default class Properties {
    constructor(scene) {
        this.scene = scene;
        this.targetElement = null;
        this.isUpdatingUI = false;
        this.dom = null;

        this._initListeners();
        this.scene.time.delayedCall(500, () => this._refreshDOM());
    }

    _initListeners() {
        this.scene.events.off('element_selected');
        this.scene.events.off('element_updated');

        this.scene.events.on('element_selected', (element) => {
            if (!this.dom) this._refreshDOM();
            this.setTarget(element);
        });

        this.scene.events.on('element_updated', (element) => {
            if (this.targetElement === element) {
                this.updateUI();
            }
        });
    }

    _refreshDOM() {
        const get = (id) => document.getElementById(id);

        this.dom = {
            emptyState: get('propEmpty'),
            content: get('propContent'),
            viewGeneric: get('view-generic'),
            viewCharacter: get('view-character'),

            gen: {
                name: get('prop-name'),
                x: get('prop-x'),
                y: get('prop-y'),
                scaleX: get('prop-scale-x'),
                scaleY: get('prop-scale-y'),
                // [NUEVO] Inputs para Parallax Genérico
                scrollX: get('prop-scroll-x'),
                scrollY: get('prop-scroll-y'),
                visible: get('prop-visible'),
                alpha: get('prop-alpha'),
                colorHex: get('prop-color-hex'),
                colorPreview: get('prop-color-preview')
            },

            char: {
                select: get('char-select'),
                x: get('char-x'),
                y: get('char-y'),
                scaleX: get('char-scale-x'),
                scaleY: get('char-scale-y'),
                angle: get('char-angle'),
                depth: get('char-depth'),
                scrollX: get('char-scroll-x'),
                scrollY: get('char-scroll-y'),
                alpha: get('char-alpha'),
                alphaVal: get('char-alpha-val'),
                flipX: get('char-flip-x'),
                flipY: get('char-flip-y'),
                camX: get('char-cam-x'),
                camY: get('char-cam-y')
            }
        };

        if (this.dom.content) {
            this._bindGenericEvents();
            this._bindCharacterEvents();
        }
    }

    setTarget(element) {
        this.targetElement = element;
        if (!this.dom || !this.dom.emptyState) { this._refreshDOM(); if (!this.dom.emptyState) return; }

        if (!element) {
            this.dom.emptyState.classList.remove('hidden');
            this.dom.content.classList.add('hidden');
            return;
        }

        this.dom.emptyState.classList.add('hidden');
        this.dom.content.classList.remove('hidden');

        const charName = element.getData('characterName');
        const isCharacter = charName !== undefined && ['Player (BF)', 'Opponent (Dad)', 'Girlfriend (GF)'].includes(charName);

        if (isCharacter) {
            this.dom.viewGeneric.classList.add('hidden');
            this.dom.viewCharacter.classList.remove('hidden');
        } else {
            this.dom.viewCharacter.classList.add('hidden');
            this.dom.viewGeneric.classList.remove('hidden');
        }

        this.updateUI();
    }

    updateUI() {
        if (!this.targetElement || !this.targetElement.active) return;
        this.isUpdatingUI = true;

        const el = this.targetElement;
        const isCharacter = this.dom.viewCharacter && !this.dom.viewCharacter.classList.contains('hidden');

        if (isCharacter) {
            // UI PERSONAJE
            const width = el.width * el.scaleX;
            const height = el.height * el.scaleY;
            const bottomCenterX = el.x + (width / 2);
            const bottomCenterY = el.y + height;

            if (this.dom.char.x) this.dom.char.x.value = Math.round(bottomCenterX);
            if (this.dom.char.y) this.dom.char.y.value = Math.round(bottomCenterY);
            if (this.dom.char.scaleX) this.dom.char.scaleX.value = el.scaleX.toFixed(2);
            if (this.dom.char.scaleY) this.dom.char.scaleY.value = el.scaleY.toFixed(2);
            if (this.dom.char.angle) this.dom.char.angle.value = Math.round(el.angle);
            if (this.dom.char.depth) this.dom.char.depth.value = el.depth;
            if (this.dom.char.scrollX) this.dom.char.scrollX.value = el.scrollFactorX.toFixed(2);
            if (this.dom.char.scrollY) this.dom.char.scrollY.value = el.scrollFactorY.toFixed(2);

            if (this.dom.char.alpha) {
                this.dom.char.alpha.value = el.alpha;
                if (this.dom.char.alphaVal) this.dom.char.alphaVal.textContent = el.alpha.toFixed(2);
            }
            if (this.dom.char.flipX) this.dom.char.flipX.checked = el.flipX;
            if (this.dom.char.flipY) this.dom.char.flipY.checked = el.flipY;

            const camOffset = el.getData('cameraOffset') || { x: 0, y: 0 };
            if (this.dom.char.camX) this.dom.char.camX.value = camOffset.x;
            if (this.dom.char.camY) this.dom.char.camY.value = camOffset.y;

        } else {
            // UI GENÉRICA
            if (this.dom.gen.name) this.dom.gen.name.value = el.name || '';
            if (this.dom.gen.x) this.dom.gen.x.value = Math.round(el.x);
            if (this.dom.gen.y) this.dom.gen.y.value = Math.round(el.y);
            if (this.dom.gen.scaleX) this.dom.gen.scaleX.value = el.scaleX.toFixed(2);
            if (this.dom.gen.scaleY) this.dom.gen.scaleY.value = el.scaleY.toFixed(2);

            // [NUEVO] Actualizar valores de Parallax Genérico
            if (this.dom.gen.scrollX) this.dom.gen.scrollX.value = el.scrollFactorX.toFixed(2);
            if (this.dom.gen.scrollY) this.dom.gen.scrollY.value = el.scrollFactorY.toFixed(2);

            if (this.dom.gen.visible) this.dom.gen.visible.checked = el.visible;
            if (this.dom.gen.alpha) this.dom.gen.alpha.value = el.alpha.toFixed(2);
        }

        this.isUpdatingUI = false;
    }

    _bindGenericEvents() {
        const update = (fn) => {
            if (this.targetElement && !this.isUpdatingUI) {
                fn(this.targetElement);
                this.scene.events.emit('element_updated', this.targetElement);
            }
        };
        const getFloat = (e) => parseFloat(e.target.value) || 0;

        this.dom.gen.name?.addEventListener('input', (e) => update(el => el.setName(e.target.value)));
        this.dom.gen.x?.addEventListener('input', (e) => update(el => el.x = getFloat(e)));
        this.dom.gen.y?.addEventListener('input', (e) => update(el => el.y = getFloat(e)));
        this.dom.gen.scaleX?.addEventListener('input', (e) => update(el => el.scaleX = getFloat(e)));
        this.dom.gen.scaleY?.addEventListener('input', (e) => update(el => el.scaleY = getFloat(e)));

        // [NUEVO] Bindings para Parallax Genérico
        this.dom.gen.scrollX?.addEventListener('input', (e) => update(el => el.setScrollFactor(getFloat(e), el.scrollFactorY)));
        this.dom.gen.scrollY?.addEventListener('input', (e) => update(el => el.setScrollFactor(el.scrollFactorX, getFloat(e))));

        this.dom.gen.visible?.addEventListener('change', (e) => update(el => el.setVisible(e.target.checked)));
        this.dom.gen.alpha?.addEventListener('input', (e) => update(el => el.setAlpha(getFloat(e))));

        this.dom.gen.colorHex?.addEventListener('change', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            const color = Phaser.Display.Color.HexStringToColor(hex).color;
            update(el => {
                if (el.setTint) el.setTint(color); else if (el.setFillStyle) el.setFillStyle(color, el.fillAlpha || 1);
                this.dom.gen.colorPreview.style.backgroundColor = hex;
            });
        });
    }

    _bindCharacterEvents() {
        const update = (fn) => {
            if (this.targetElement && !this.isUpdatingUI) {
                fn(this.targetElement);
                this.scene.events.emit('element_updated', this.targetElement);
            }
        };
        const getFloat = (e) => parseFloat(e.target.value) || 0;

        // Posición especial
        const updatePos = () => {
            if (!this.targetElement || this.isUpdatingUI) return;
            const uiX = parseFloat(this.dom.char.x.value) || 0;
            const uiY = parseFloat(this.dom.char.y.value) || 0;
            const el = this.targetElement;
            const width = el.width * el.scaleX;
            const height = el.height * el.scaleY;

            el.x = uiX - (width / 2);
            el.y = uiY - height;
            this.scene.events.emit('element_updated', el);
        };

        this.dom.char.x?.addEventListener('input', updatePos);
        this.dom.char.y?.addEventListener('input', updatePos);
        this.dom.char.scaleX?.addEventListener('input', (e) => update(el => el.scaleX = getFloat(e)));
        this.dom.char.scaleY?.addEventListener('input', (e) => update(el => el.scaleY = getFloat(e)));
        this.dom.char.angle?.addEventListener('input', (e) => update(el => el.setAngle(getFloat(e))));
        this.dom.char.depth?.addEventListener('input', (e) => update(el => el.setDepth(parseInt(e.target.value) || 0)));
        this.dom.char.scrollX?.addEventListener('input', (e) => update(el => el.setScrollFactor(getFloat(e), el.scrollFactorY)));
        this.dom.char.scrollY?.addEventListener('input', (e) => update(el => el.setScrollFactor(el.scrollFactorX, getFloat(e))));

        this.dom.char.alpha?.addEventListener('input', (e) => {
            const val = getFloat(e);
            if (this.dom.char.alphaVal) this.dom.char.alphaVal.textContent = val.toFixed(2);
            update(el => el.setAlpha(val));
        });

        this.dom.char.flipX?.addEventListener('change', (e) => update(el => el.setFlipX(e.target.checked)));
        this.dom.char.flipY?.addEventListener('change', (e) => update(el => el.setFlipY(e.target.checked)));

        const updateCam = () => {
            if (!this.targetElement || this.isUpdatingUI) return;
            const cx = parseFloat(this.dom.char.camX.value) || 0;
            const cy = parseFloat(this.dom.char.camY.value) || 0;
            this.targetElement.setData('cameraOffset', { x: cx, y: cy });

            const controller = this.targetElement.getData('controller');
            const charKey = this.targetElement.getData('charID');
            if (controller && charKey) controller.setCameraOffset(charKey, cx, cy);
        };
        this.dom.char.camX?.addEventListener('input', updateCam);
        this.dom.char.camY?.addEventListener('input', updateCam);
    }
}