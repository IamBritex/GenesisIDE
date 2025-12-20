/**
 * source/funkin/ui/editors/utils/window/WindowResizer.js
 */
export default class WindowResizer {
    constructor(scene, windowNode, sharedState, bringToFrontCallback, config) {
        this.scene = scene;
        this.windowNode = windowNode;
        this.state = sharedState;
        this.bringToFront = bringToFrontCallback;
        this.config = config || {};

        this.resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 };
        this.activeDirection = null;

        if (this.config.resizable !== false) {
            this._injectHandles();
            this._bindEvents();
        }
    }

    _injectHandles() {
        const createHandle = (dir, cursor, css) => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            handle.dataset.resizeDir = dir;
            handle.style.cssText = `position: absolute; z-index: 20; cursor: ${cursor}; user-select: none; ${css}`;
            this.windowNode.appendChild(handle);
            return handle;
        };
        const thick = '6px', corner = '12px';
        this.handles = [
            createHandle('n', 'ns-resize', `top: 0; left: 0; width: 100%; height: ${thick};`),
            createHandle('s', 'ns-resize', `bottom: 0; left: 0; width: 100%; height: ${thick};`),
            createHandle('e', 'ew-resize', `top: 0; right: 0; width: ${thick}; height: 100%;`),
            createHandle('w', 'ew-resize', `top: 0; left: 0; width: ${thick}; height: 100%;`),
            createHandle('nw', 'nwse-resize', `top: 0; left: 0; width: ${corner}; height: ${corner}; z-index: 21;`),
            createHandle('ne', 'nesw-resize', `top: 0; right: 0; width: ${corner}; height: ${corner}; z-index: 21;`),
            createHandle('sw', 'nesw-resize', `bottom: 0; left: 0; width: ${corner}; height: ${corner}; z-index: 21;`),
            createHandle('se', 'nwse-resize', `bottom: 0; right: 0; width: ${corner}; height: ${corner}; z-index: 21;`)
        ];
    }

    _bindEvents() {
        this._binds = {
            start: this._onStart.bind(this),
            move: this._onMove.bind(this),
            end: this._onEnd.bind(this)
        };
        this.handles.forEach(h => h.addEventListener('mousedown', this._binds.start));
        window.addEventListener('mousemove', this._binds.move);
        window.addEventListener('mouseup', this._binds.end);
    }

    _onStart(e) {
        if (e.button !== 0 || this.config.resizable === false) return;

        // --- [LÓGICA DE DOCKING AGREGADA] ---
        if (this.state.isDocked) {
            const side = this.state.dockSide;
            const dir = e.target.dataset.resizeDir;

            // Si está a la izquierda, SOLO permitir redimensionar hacia el Este ('e')
            if (side === 'left' && dir !== 'e') return;

            // Si está a la derecha, SOLO permitir redimensionar hacia el Oeste ('w')
            if (side === 'right' && dir !== 'w') return;

            // Si hubiera docking arriba/abajo en el futuro, se añadiría aquí.
            // Esto bloquea efectivamente esquinas y lados verticales.
        }
        // ------------------------------------

        e.stopPropagation(); e.preventDefault();

        this.state.isResizing = true;
        this.activeDirection = e.target.dataset.resizeDir;
        this.resizeStart = {
            x: e.clientX, y: e.clientY,
            width: this.windowNode.offsetWidth, height: this.windowNode.offsetHeight,
            left: parseFloat(this.windowNode.style.left) || 0, top: parseFloat(this.windowNode.style.top) || 0
        };
        document.body.style.cursor = getComputedStyle(e.target).cursor;
        if (this.bringToFront) this.bringToFront();
    }

    _onMove(e) {
        if (!this.state.isResizing || !this.activeDirection) return;

        const canvasRect = this.scene.game.canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / this.scene.scale.width;
        const scaleY = canvasRect.height / this.scene.scale.height;

        const deltaX = (e.clientX - this.resizeStart.x) / scaleX;
        const deltaY = (e.clientY - this.resizeStart.y) / scaleY;

        const minW = this.config.minWidth || 150;
        const minH = this.config.minHeight || 100;
        const dir = this.activeDirection;

        let changed = false;

        if (dir.includes('e')) {
            const newWidth = Math.max(minW, this.resizeStart.width + deltaX);
            this.windowNode.style.width = `${newWidth}px`;
            changed = true;
        } else if (dir.includes('w')) {
            let newWidth = this.resizeStart.width - deltaX;
            if (newWidth < minW) newWidth = minW;
            const widthChange = newWidth - this.resizeStart.width;
            const newLeft = this.resizeStart.left - widthChange;
            this.windowNode.style.width = `${newWidth}px`;
            this.windowNode.style.left = `${newLeft}px`;
            changed = true;
        }

        if (dir.includes('s')) {
            const newHeight = Math.max(minH, this.resizeStart.height + deltaY);
            this.windowNode.style.height = `${newHeight}px`;
        } else if (dir.includes('n')) {
            let newHeight = this.resizeStart.height - deltaY;
            if (newHeight < minH) newHeight = minH;
            const heightChange = newHeight - this.resizeStart.height;
            const newTop = this.resizeStart.top - heightChange;
            this.windowNode.style.height = `${newHeight}px`;
            this.windowNode.style.top = `${newTop}px`;
        }

        if (changed) {
            window.dispatchEvent(new CustomEvent('layout-update'));
        }
    }

    _onEnd(e) {
        if (this.state.isResizing) {
            this.state.isResizing = false;
            this.activeDirection = null;
            document.body.style.cursor = '';

            window.dispatchEvent(new CustomEvent('layout-update'));
        }
    }

    destroy() {
        if (this._binds) {
            window.removeEventListener('mousemove', this._binds.move);
            window.removeEventListener('mouseup', this._binds.end);
        }
        if (this.handles) this.handles.forEach(h => h.remove());
    }
}