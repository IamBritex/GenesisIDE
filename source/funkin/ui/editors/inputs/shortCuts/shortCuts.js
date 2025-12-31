/**
 * source/funkin/ui/editors/inputs/shortCuts/shortCuts.js
 */
export default class ShortCuts {
    constructor(scene, actionHistory) {
        this.scene = scene;
        this.history = actionHistory;

        this.keysState = {
            w: false, a: false, s: false, d: false,
            q: false, e: false,
            plus: false, minus: false,
            shift: false
        };

        this.baseSpeed = 15;
        this.turboMultiplier = 2.5;
        this.baseZoomFactor = 1.02;
        this.turboZoomAdded = 0.03;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.update = this.update.bind(this);

        this.onUndo = () => this.history.undo();
        this.onRedo = () => this.history.redo();

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        window.addEventListener('editor-undo', this.onUndo);
        window.addEventListener('editor-redo', this.onRedo);

        this.scene.events.on('update', this.update);
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();

        // 1. PRIORIDAD: Ctrl + Tab
        if (event.ctrlKey && key === 'tab') {
            event.preventDefault();
            event.stopPropagation();
            const tabBar = this.scene.tabBar;
            if (tabBar && tabBar.tabs && tabBar.tabs.length > 1) {
                const currentIndex = tabBar.tabs.findIndex(t => t.id === tabBar.activeTabId);
                let nextIndex;
                if (event.shiftKey) {
                    nextIndex = currentIndex - 1;
                    if (nextIndex < 0) nextIndex = tabBar.tabs.length - 1;
                } else {
                    nextIndex = currentIndex + 1;
                    if (nextIndex >= tabBar.tabs.length) nextIndex = 0;
                }
                const nextTab = tabBar.tabs[nextIndex];
                if (nextTab) tabBar.setActiveTab(nextTab.id);
            }
            return;
        }

        // 2. EDICIÓN Y COMANDOS CON CTRL (Undo, Redo, Copy, Paste, Cut)
        // [SOLUCIÓN] Mover esto ANTES de las teclas simples para evitar conflictos (ej: Ctrl+C vs C)
        if (event.ctrlKey) {
            // Undo / Redo
            if (key === 'z') {
                event.preventDefault();
                if (event.shiftKey) this.history.redo();
                else this.history.undo();
                return;
            }
            if (key === 'y') {
                event.preventDefault();
                this.history.redo();
                return;
            }

            // Copy / Paste / Cut
            if (key === 'c') {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent('editor-copy'));
                return;
            }
            if (key === 'v') {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent('editor-paste'));
                return;
            }
            if (key === 'x') {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent('editor-cut'));
                return;
            }

            // Zoom
            if (event.key === '=' || event.key === '+') { event.preventDefault(); this.keysState.plus = true; }
            if (event.key === '-' || event.key === '_') { event.preventDefault(); this.keysState.minus = true; }

            // Si se presionó Ctrl, no seguir procesando teclas simples
            return;
        }

        // 3. TEST MODE (Enter)
        if (key === 'enter') {
            const target = event.target;
            const active = document.activeElement;
            const isInput = (el) => el && (
                el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
            );
            if (isInput(target) || isInput(active)) {
                if (active && typeof active.blur === 'function') active.blur();
                return;
            }
            window.dispatchEvent(new CustomEvent('editor-toggle-test-mode'));
            return;
        }

        // 4. Validación General de Inputs (No ejecutar nada si escribimos)
        const activeTag = document.activeElement ? document.activeElement.tagName : null;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
            return;
        }

        // 5. SHORTCUTS GLOBALES SIMPLES
        if (key === 'r') { window.dispatchEvent(new CustomEvent('editor-zoom-reset')); return; }
        if (key === 'c') { window.dispatchEvent(new CustomEvent('editor-view-cameraboxes')); return; }

        // 6. MOVIMIENTO Y ZOOM MANUAL
        if (['w', 'a', 's', 'd'].includes(key)) this.keysState[key] = true;
        if (key === 'q') this.keysState.q = true;
        if (key === 'e') this.keysState.e = true;
        if (event.key === 'Shift') this.keysState.shift = true;
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) this.keysState[key] = false;
        if (key === 'q') this.keysState.q = false;
        if (key === 'e') this.keysState.e = false;
        if (event.key === '=' || event.key === '+') this.keysState.plus = false;
        if (event.key === '-' || event.key === '_') this.keysState.minus = false;
        if (event.key === 'Shift') this.keysState.shift = false;
    }

    update() {
        const cam = this.scene.cameras.main;
        if (!cam) return;

        let speed = (this.baseSpeed / cam.zoom);
        if (this.keysState.shift) speed *= this.turboMultiplier;

        if (this.keysState.w) cam.scrollY -= speed;
        if (this.keysState.s) cam.scrollY += speed;
        if (this.keysState.a) cam.scrollX -= speed;
        if (this.keysState.d) cam.scrollX += speed;

        let currentZoom = cam.zoom;
        let didZoom = false;
        const factor = this.keysState.shift ? (this.baseZoomFactor + this.turboZoomAdded) : this.baseZoomFactor;

        if (this.keysState.e || this.keysState.plus) { currentZoom *= factor; didZoom = true; }
        if (this.keysState.q || this.keysState.minus) { currentZoom /= factor; didZoom = true; }

        if (didZoom) {
            if (currentZoom < 0.05) currentZoom = 0.05;
            if (currentZoom > 10) currentZoom = 10;
            cam.setZoom(currentZoom);
        }
    }

    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('editor-undo', this.onUndo);
        window.removeEventListener('editor-redo', this.onRedo);
        this.scene.events.off('update', this.update);
    }
}