/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageGeneralProperties.js
 */
export default class StageGeneralProperties {
    constructor(scene) {
        this.scene = scene;
        this.linkScale = false;
        this.linkScroll = false;
    }

    bind(element) {
        const get = (id) => document.getElementById(id);

        // Elementos comunes en el HTML
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

        // --- Transforms ---
        if (dom.x) dom.x.oninput = () => { const v = parseFloat(dom.x.value) || 0; element.setX(v); this._updateConfig(element, 'position', [v, element.y]); };
        if (dom.y) dom.y.oninput = () => { const v = parseFloat(dom.y.value) || 0; element.setY(v); this._updateConfig(element, 'position', [element.x, v]); };

        const updateScale = (sourceAxis) => {
            let vx = parseFloat(dom.scaleX.value) || 1;
            let vy = parseFloat(dom.scaleY.value) || 1;

            if (this.linkScale) {
                if (sourceAxis === 'x') vy = vx; else vx = vy;
                dom.scaleX.value = vx;
                dom.scaleY.value = vy;
            }

            element.setScale(vx, vy);
            if (vx === vy) this._updateConfig(element, 'scale', vx);
            else this._updateConfig(element, 'scale', [vx, vy]);
        };

        if (dom.scaleX) dom.scaleX.oninput = () => updateScale('x');
        if (dom.scaleY) dom.scaleY.oninput = () => updateScale('y');

        if (dom.btnLinkScale) {
            dom.btnLinkScale.onclick = () => {
                this.linkScale = !this.linkScale;
                toggleLinkStyle(dom.btnLinkScale, this.linkScale);
                if (this.linkScale) updateScale('x');
            };
        }

        if (dom.angle) dom.angle.oninput = () => { const v = parseFloat(dom.angle.value) || 0; element.setAngle(v); this._updateConfig(element, 'angle', v); };

        // --- Visuals ---
        if (dom.alpha) dom.alpha.oninput = () => { const v = parseFloat(dom.alpha.value); element.setAlpha(v); this._updateConfig(element, 'opacity', v); };
        if (dom.layer) dom.layer.oninput = () => { const v = parseInt(dom.layer.value) || 0; element.setDepth(v); this._updateConfig(element, 'layer', v); };

        if (dom.flipX) dom.flipX.onchange = () => { element.setFlipX(dom.flipX.checked); this._updateConfig(element, 'flip_x', dom.flipX.checked); };
        if (dom.flipY) dom.flipY.onchange = () => { element.setFlipY(dom.flipY.checked); this._updateConfig(element, 'flip_y', dom.flipY.checked); };

        // --- Scroll Link ---
        const updateScroll = (sourceAxis) => {
            let sx = parseFloat(dom.scrollX?.value) || 0;
            let sy = parseFloat(dom.scrollY?.value) || 0;

            if (this.linkScroll) {
                if (sourceAxis === 'x') sy = sx; else sx = sy;
                if (dom.scrollX) dom.scrollX.value = sx;
                if (dom.scrollY) dom.scrollY.value = sy;
            }

            element.setScrollFactor(sx, sy);
            this._updateConfig(element, 'scrollFactor', [sx, sy]);
        };

        if (dom.scrollX) dom.scrollX.oninput = () => updateScroll('x');
        if (dom.scrollY) dom.scrollY.oninput = () => updateScroll('y');

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
        const setVal = (id, v) => { const e = get(id); if (e) e.value = v; };
        const setCheck = (id, v) => { const e = get(id); if (e) e.checked = v; };

        setVal('propX', Math.round(element.x));
        setVal('propY', Math.round(element.y));
        setVal('propScaleX', element.scaleX);
        setVal('propScaleY', element.scaleY);
        setVal('propAngle', Math.round(element.angle));
        setVal('propAlpha', element.alpha);
        setVal('propLayer', element.depth);
        setCheck('propFlipX', element.flipX);
        setCheck('propFlipY', element.flipY);
        setVal('propScrollX', element.scrollFactorX);
        setVal('propScrollY', element.scrollFactorY);
    }
}