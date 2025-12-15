/**
 * source/funkin/ui/editors/utils/window/WindowDOMBuilder.js
 */
export default class WindowDOMBuilder {
    constructor(scene, config, doc) {
        this.scene = scene;
        this.config = config;
        this.doc = doc;
        this.windowNode = null;
        this.domElement = null;
    }

    build() {
        this.domElement = this.scene.add.dom(0, 0).createElement('div');
        this.domElement.setOrigin(0, 0);
        this.domElement.node.className = 'modular-window-container';

        // Estilos base invisibles para el contenedor
        this.domElement.node.style.cssText = 'position: absolute; visibility: hidden; pointer-events: none !important; width: 0px; height: 0px; overflow: visible; z-index: 0;';

        const styles = Array.from(this.doc.querySelectorAll('style, link')).map(s => s.outerHTML).join('');

        // [NUEVO] CSS inyectado para bloquear selección de texto globalmente excepto en inputs
        // Usamos !important para asegurar que sobrescriba cualquier comportamiento del navegador
        const noSelectStyle = `
            <style>
                .modular-window {
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    cursor: default;
                }
                /* Permitir selección solo en elementos de entrada */
                .modular-window input, 
                .modular-window textarea, 
                .modular-window select,
                .modular-window [contenteditable="true"] {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    cursor: text;
                }
            </style>
        `;

        const bodyContent = this.doc.body ? this.doc.body.innerHTML : '';

        const wrapper = document.createElement('div');
        wrapper.className = 'modular-window';

        let css = 'pointer-events: auto; position: absolute; display: flex; flex-direction: column;';

        const { width, height } = this.config;
        const wVal = typeof width === 'number' ? `${width}px` : width;
        const hVal = typeof height === 'number' ? `${height}px` : height;

        css += `width: ${wVal}; height: ${hVal};`;

        if (!this.config.borderRad) {
            css += 'border-radius: 0;';
        }

        // Si no hay título (barra de controles), desactivamos la sombra por defecto
        if (!this.config.showTitle) {
            css += 'box-shadow: none !important;';
        }

        wrapper.style.cssText = css;

        let innerHTML = '';
        if (this.config.showTitle) {
            innerHTML += `
                <div class="window-header window-drag-handle">
                    <span class="window-title">${this.config.title}</span>
                    <div class="window-controls"></div>
                </div>
            `;
        } else {
            wrapper.classList.add('no-title-bar');
        }
        innerHTML += `<div class="window-content">${bodyContent}</div>`;

        wrapper.innerHTML = innerHTML;

        // [MODIFICADO] Inyectamos los estilos originales + las reglas de no-selección
        this.domElement.node.innerHTML = styles + noSelectStyle;
        this.domElement.node.appendChild(wrapper);
        this.windowNode = wrapper;

        const controlsContainer = wrapper.querySelector('.window-controls');
        if (controlsContainer) {
            this._injectControls(controlsContainer);
        }

        this._disableAutocomplete(wrapper);
        this._runScripts();

        if (this.config.overlay) this._createOverlay();

        return { domElement: this.domElement, windowNode: this.windowNode };
    }

    _disableAutocomplete(wrapper) {
        wrapper.querySelectorAll('input, textarea, select').forEach(input => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
        });
    }

    _injectControls(container) {
        const createBtn = (cls, icon) => {
            const b = document.createElement('button');
            b.className = `win-btn ${cls}`;
            b.innerHTML = `<img src="public/images/ui/editors/${icon}.svg" alt="${cls}">`;
            b.tabIndex = -1;
            b.dataset.action = cls;
            container.appendChild(b);
        };
        if (this.config.minimize) createBtn('minimize', 'minimize');
        if (this.config.close) createBtn('close', 'close');
    }

    _createOverlay() {
        const ov = document.createElement('div');
        ov.className = 'modular-overlay';
        ov.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: auto; background: rgba(0,0,0,0.7); z-index: -1;`;

        const blockEvent = (e) => {
            if (e.target === ov) {
                e.stopPropagation();
                e.preventDefault();
            }
        };
        ['click', 'mousedown', 'mouseup', 'touchstart'].forEach(evt => ov.addEventListener(evt, blockEvent));
        this.domElement.node.prepend(ov);
    }

    _runScripts() {
        this.doc.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            this.domElement.node.appendChild(newScript);
        });
    }
}