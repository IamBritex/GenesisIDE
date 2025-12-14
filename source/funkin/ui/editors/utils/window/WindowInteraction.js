/**
 * source/funkin/ui/editors/utils/window/WindowInteraction.js
 */
export default class WindowInteraction {
    constructor(scene, windowNode, config, callbacks) {
        this.scene = scene;
        this.windowNode = windowNode;
        this.config = config;
        this.callbacks = callbacks || {};

        this.state = {
            isDragging: false,
            isMinimized: false,
            isDocked: false,
            dragOffset: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            lastHeight: 0
        };

        this._bindEvents();
    }

    _bindEvents() {
        const header = this.windowNode.querySelector('.window-header');
        if (header) {
            header.addEventListener('click', (e) => {
                const btn = e.target.closest('.win-btn');
                if (!btn) return;
                e.stopPropagation();
                if (btn.dataset.action === 'close') this.callbacks.onClose && this.callbacks.onClose();
                if (btn.dataset.action === 'minimize') this.toggleMinimize();
            });
        }

        if (this.config.draggable) {
            const handle = this.windowNode.querySelector('.window-drag-handle');
            if (handle) {
                this._dragBinds = {
                    start: this._onDragStart.bind(this),
                    move: this._onDragMove.bind(this),
                    end: this._onDragEnd.bind(this)
                };
                handle.addEventListener('mousedown', this._dragBinds.start);
                window.addEventListener('mousemove', this._dragBinds.move);
                window.addEventListener('mouseup', this._dragBinds.end);
            }
        }

        this.windowNode.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.bringToFront();
        });

        this.windowNode.addEventListener('wheel', e => e.stopPropagation());
    }

    _onDragStart(e) {
        if (e.target.closest('button, a, input, textarea, select')) return;

        if (this.callbacks.onDragStart) this.callbacks.onDragStart(e);
        if (this.state.isDocked) return;

        this.state.isDragging = true;
        this.bringToFront();

        const canvasRect = this.scene.game.canvas.getBoundingClientRect();
        this.state.scale.x = canvasRect.width / this.scene.scale.width;
        this.state.scale.y = canvasRect.height / this.scene.scale.height;

        const winRect = this.windowNode.getBoundingClientRect();
        this.state.dragOffset.x = e.clientX - winRect.left;
        this.state.dragOffset.y = e.clientY - winRect.top;

        this.windowNode.style.margin = '0';
        this.windowNode.style.transform = 'none';
    }

    _onDragMove(e) {
        if (!this.state.isDragging) return;
        e.preventDefault();

        const canvasRect = this.scene.game.canvas.getBoundingClientRect();
        const visualX = e.clientX - canvasRect.left - this.state.dragOffset.x;
        const visualY = e.clientY - canvasRect.top - this.state.dragOffset.y;

        const logicX = visualX / this.state.scale.x;
        const logicY = visualY / this.state.scale.y;

        this.windowNode.style.left = `${logicX}px`;
        this.windowNode.style.top = `${logicY}px`;

        if (this.callbacks.onDragMove) this.callbacks.onDragMove(e, logicX, logicY);
    }

    _onDragEnd(e) {
        if (this.state.isDragging) {
            this.state.isDragging = false;
            this.windowNode.style.zIndex = '10000';
            // IMPORTANTE: Llamar al callback para que ModularWindow guarde la posición
            if (this.callbacks.onDragEnd) this.callbacks.onDragEnd(e);
        }
    }

    bringToFront() {
        this.windowNode.style.zIndex = '10001';
    }

    toggleMinimize() {
        const HEADER_HEIGHT = 42;
        if (!this.state.isMinimized) {
            this.state.lastHeight = this.windowNode.offsetHeight;
            this.windowNode.style.height = `${this.state.lastHeight}px`;
            this.windowNode.offsetHeight; // force reflow
            this.windowNode.classList.add('minimized');
            this.windowNode.style.height = `${HEADER_HEIGHT}px`;
            this.windowNode.style.overflow = 'hidden';
        } else {
            this.windowNode.classList.remove('minimized');
            this.windowNode.style.height = `${this.state.lastHeight}px`;
            setTimeout(() => {
                if (!this.state.isMinimized) {
                    this.windowNode.style.height = this.config.height === 'auto' ? 'auto' : `${this.config.height}px`;
                    this.windowNode.style.overflow = 'visible';
                }
            }, 300);
        }
        this.state.isMinimized = !this.state.isMinimized;
    }

    destroy() {
        if (this._dragBinds) {
            window.removeEventListener('mousemove', this._dragBinds.move);
            window.removeEventListener('mouseup', this._dragBinds.end);
        }
    }
}