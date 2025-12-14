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
        // 1. Crear Contenedor Phaser (Inicialmente invisible para calcular centro)
        this.domElement = this.scene.add.dom(0, 0).createElement('div');
        this.domElement.setOrigin(0, 0);
        this.domElement.node.className = 'modular-window-container';
        // Visibility hidden permite calcular offsetWidth/Height sin mostrarse
        this.domElement.node.style.cssText = 'position: absolute; visibility: hidden; z-index: 100; pointer-events: none;';

        const styles = Array.from(this.doc.querySelectorAll('style, link')).map(s => s.outerHTML).join('');
        const bodyContent = this.doc.body ? this.doc.body.innerHTML : '';

        const wrapper = document.createElement('div');
        wrapper.className = 'modular-window';
        wrapper.style.cssText = 'pointer-events: auto; position: absolute; display: flex; flex-direction: column;';
        
        const { width, height } = this.config;
        wrapper.style.width = width === 'auto' ? 'auto' : `${width}px`;
        wrapper.style.height = height === 'auto' ? 'auto' : `${height}px`;

        wrapper.innerHTML = `
            <div class="window-header window-drag-handle">
                <span class="window-title">${this.config.title}</span>
                <div class="window-controls"></div>
            </div>
            <div class="window-content">${bodyContent}</div>
        `;

        this.domElement.node.innerHTML = styles;
        this.domElement.node.appendChild(wrapper);
        this.windowNode = wrapper;

        this._injectControls(wrapper.querySelector('.window-controls'));
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
        ov.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: auto; background: rgba(0,0,0,0.7); z-index: 90;`;
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