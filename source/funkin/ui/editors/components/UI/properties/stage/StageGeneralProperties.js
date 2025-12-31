/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageGeneralProperties.js
 */
export default class StageGeneralProperties {
    constructor(scene) {
        this.scene = scene;
        this.linkScale = false;
        this.linkScroll = false;
        this.actionHistory = null;
        this.startValues = {};
    }

    setActionHistory(history) {
        this.actionHistory = history;
    }

    // [NUEVO] Utilidad para redondear a 2 decimales
    _round(num) {
        if (typeof num !== 'number') return num;
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    _setupInput(input, propName, valueGetter, element) {
        if (!input) return;

        input.onfocus = () => {
            this.startValues[propName] = valueGetter();
            input.select();
        };

        input.onchange = () => {
            const finalVal = valueGetter(); // Valor ya procesado por el oninput del bind
            const startVal = this.startValues[propName];

            if (this.actionHistory && element && startVal !== undefined) {
                if (Math.abs(startVal - finalVal) > 0.0001) {
                    const changes = {};
                    changes[propName] = { from: startVal, to: finalVal };
                    this.actionHistory.recordChange(element, changes);
                }
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
        });
    }

    bind(element) {
        const get = (id) => document.getElementById(id);
        const dom = {
            x: get('propX'), y: get('propY'),
            scaleX: get('propScaleX'), scaleY: get('propScaleY'),
            angle: get('propAngle'),
            alpha: get('propAlpha'), layer: get('propLayer'),
            scrollX: get('propScrollX'), scrollY: get('propScrollY'),
            flipX: get('propFlipX'), flipY: get('propFlipY'),
            btnLinkScale: get('btnLinkScale'),
            btnLinkScroll: get('btnLinkScroll')
        };

        const toggleLinkStyle = (btn, isActive) => {
            if (btn) {
                btn.style.opacity = isActive ? '1' : '0.4';
                btn.style.color = isActive ? 'var(--accent-color)' : 'var(--text-muted)';
                btn.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
            }
        };

        toggleLinkStyle(dom.btnLinkScale, this.linkScale);
        toggleLinkStyle(dom.btnLinkScroll, this.linkScroll);

        // Transforms
        if (dom.x) {
            dom.x.oninput = () => { const v = parseFloat(dom.x.value) || 0; element.setX(v); this._updateConfig(element, 'position', [v, element.y]); };
            this._setupInput(dom.x, 'x', () => element.x, element);
        }
        if (dom.y) {
            dom.y.oninput = () => { const v = parseFloat(dom.y.value) || 0; element.setY(v); this._updateConfig(element, 'position', [element.x, v]); };
            this._setupInput(dom.y, 'y', () => element.y, element);
        }

        // Scale
        const updateScale = (sourceAxis) => {
            let vx = parseFloat(dom.scaleX.value) || 1;
            let vy = parseFloat(dom.scaleY.value) || 1;
            if (this.linkScale) {
                if (sourceAxis === 'x') vy = vx; else vx = vy;
                dom.scaleX.value = this._round(vx);
                dom.scaleY.value = this._round(vy);
            }
            element.setScale(vx, vy);
            if (vx === vy) this._updateConfig(element, 'scale', vx);
            else this._updateConfig(element, 'scale', [vx, vy]);
        };

        if (dom.scaleX) {
            dom.scaleX.oninput = () => updateScale('x');
            this._setupInput(dom.scaleX, 'scaleX', () => element.scaleX, element);
            // Sobreescribir onchange para LinkScale
            const defaultChangeX = dom.scaleX.onchange;
            dom.scaleX.onchange = () => {
                if (this.linkScale && this.actionHistory) {
                    const changes = {
                        scaleX: { from: this.startValues['scaleX'], to: element.scaleX },
                        scaleY: { from: this.startValues['scaleY'], to: element.scaleY }
                    };
                    this.actionHistory.recordChange(element, changes);
                } else {
                    defaultChangeX();
                }
            };
            const defaultFocusX = dom.scaleX.onfocus;
            dom.scaleX.onfocus = () => { defaultFocusX(); this.startValues['scaleY'] = element.scaleY; };
        }

        if (dom.scaleY) {
            dom.scaleY.oninput = () => updateScale('y');
            this._setupInput(dom.scaleY, 'scaleY', () => element.scaleY, element);
        }
        if (dom.btnLinkScale) {
            dom.btnLinkScale.onclick = () => {
                this.linkScale = !this.linkScale;
                toggleLinkStyle(dom.btnLinkScale, this.linkScale);
                if (this.linkScale) updateScale('x');
            };
        }

        // Angle & Alpha
        if (dom.angle) {
            dom.angle.oninput = () => { const v = parseFloat(dom.angle.value) || 0; element.setAngle(v); this._updateConfig(element, 'angle', v); };
            this._setupInput(dom.angle, 'angle', () => element.angle, element);
        }
        if (dom.alpha) {
            dom.alpha.oninput = () => { const v = parseFloat(dom.alpha.value); element.setAlpha(v); this._updateConfig(element, 'opacity', v); };
            this._setupInput(dom.alpha, 'alpha', () => element.alpha, element);
        }
        if (dom.layer) {
            dom.layer.oninput = () => { const v = parseInt(dom.layer.value) || 0; element.setDepth(v); this._updateConfig(element, 'layer', v); };
            this._setupInput(dom.layer, 'depth', () => element.depth, element);
        }

        // Flip
        const recordFlip = (prop) => {
            if (this.actionHistory) {
                const val = element[prop];
                this.actionHistory.recordChange(element, { [prop]: { from: !val, to: val } });
            }
        };
        if (dom.flipX) dom.flipX.onchange = () => {
            element.setFlipX(dom.flipX.checked); this._updateConfig(element, 'flip_x', dom.flipX.checked); recordFlip('flipX');
        };
        if (dom.flipY) dom.flipY.onchange = () => {
            element.setFlipY(dom.flipY.checked); this._updateConfig(element, 'flip_y', dom.flipY.checked); recordFlip('flipY');
        };

        // Scroll
        const updateScroll = (sourceAxis) => {
            let sx = parseFloat(dom.scrollX?.value) || 0;
            let sy = parseFloat(dom.scrollY?.value) || 0;
            if (this.linkScroll) {
                if (sourceAxis === 'x') sy = sx; else sx = sy;
                if (dom.scrollX) dom.scrollX.value = this._round(sx);
                if (dom.scrollY) dom.scrollY.value = this._round(sy);
            }
            element.setScrollFactor(sx, sy);
            this._updateConfig(element, 'scrollFactor', [sx, sy]);
        };
        if (dom.scrollX) {
            dom.scrollX.oninput = () => updateScroll('x');
            this._setupInput(dom.scrollX, 'scrollFactorX', () => element.scrollFactorX, element);
            // Sobreescribir onchange para LinkScroll
            const defCX = dom.scrollX.onchange;
            dom.scrollX.onchange = () => {
                if (this.linkScroll && this.actionHistory) {
                    this.actionHistory.recordChange(element, {
                        scrollFactorX: { from: this.startValues['scrollFactorX'], to: element.scrollFactorX },
                        scrollFactorY: { from: this.startValues['scrollFactorY'], to: element.scrollFactorY }
                    });
                } else {
                    defCX();
                }
            };
            const defFX = dom.scrollX.onfocus;
            dom.scrollX.onfocus = () => { defFX(); this.startValues['scrollFactorY'] = element.scrollFactorY; };
        }
        if (dom.scrollY) {
            dom.scrollY.oninput = () => updateScroll('y');
            this._setupInput(dom.scrollY, 'scrollFactorY', () => element.scrollFactorY, element);
        }
        if (dom.btnLinkScroll) {
            dom.btnLinkScroll.onclick = () => {
                this.linkScroll = !this.linkScroll;
                toggleLinkStyle(dom.btnLinkScroll, this.linkScroll);
                if (this.linkScroll) updateScroll('x');
            };
        }
    }

    _updateConfig(element, key, value) {
        let config = element.getData('config');
        if (config) {
            config[key] = value;
            element.setData('config', config);
        }
        this.scene.events.emit('element_updated', element);
    }

    updateValues(element) {
        if (!element) return;
        const get = (id) => document.getElementById(id);
        const setVal = (id, v) => { const e = get(id); if (e) e.value = this._round(v); }; // [MODIFICADO] Usar redondeo
        const setCheck = (id, v) => { const e = get(id); if (e) e.checked = v; };

        setVal('propX', element.x);
        setVal('propY', element.y);
        setVal('propScaleX', element.scaleX);
        setVal('propScaleY', element.scaleY);
        setVal('propAngle', element.angle);
        setVal('propAlpha', element.alpha);
        setVal('propLayer', element.depth);
        setCheck('propFlipX', element.flipX);
        setCheck('propFlipY', element.flipY);
        setVal('propScrollX', element.scrollFactorX);
        setVal('propScrollY', element.scrollFactorY);
    }
}