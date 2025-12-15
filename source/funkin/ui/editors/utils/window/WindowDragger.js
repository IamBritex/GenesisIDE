/**
 * source/funkin/ui/editors/utils/window/WindowDragger.js
 */
import WindowDocking from './WindowDocking.js';

export default class WindowDragger {
    constructor(scene, windowNode, config, sharedState, callbacks, bringToFrontCallback, interactionRef) {
        this.scene = scene;
        this.windowNode = windowNode;
        this.config = config;
        this.state = sharedState;
        this.callbacks = callbacks;
        this.bringToFront = bringToFrontCallback;
        this.interaction = interactionRef;

        this.docking = new WindowDocking(scene);
        this.currentDockState = null;

        this.dragOffset = { x: 0, y: 0 };
        this.scale = { x: 1, y: 1 };

        // Estado para la resistencia al despegue
        this.dockWait = { active: false, x: 0, y: 0 };

        this._bindEvents();
    }

    _bindEvents() {
        if (this.config.draggable) {
            const handle = this.windowNode.querySelector('.window-drag-handle');
            if (handle) {
                this._binds = {
                    start: this._onStart.bind(this),
                    move: this._onMove.bind(this),
                    end: this._onEnd.bind(this)
                };
                handle.addEventListener('mousedown', this._binds.start);
                window.addEventListener('mousemove', this._binds.move);
                window.addEventListener('mouseup', this._binds.end);
            }
        }
    }

    _onStart(e) {
        if (e.target.closest('button, a, input, textarea, select')) return;
        if (this.state.isResizing) return;

        if (this.callbacks.onDragStart) this.callbacks.onDragStart(e);

        this.state.isDragging = true;
        this.bringToFront();

        const canvasRect = this.scene.game.canvas.getBoundingClientRect();
        this.scale.x = canvasRect.width / this.scene.scale.width;
        this.scale.y = canvasRect.height / this.scene.scale.height;

        const winRect = this.windowNode.getBoundingClientRect();
        this.dragOffset.x = e.clientX - winRect.left;
        this.dragOffset.y = e.clientY - winRect.top;

        // [STICKY DOCKING]
        if (this.windowNode.classList.contains('docked')) {
            this.dockWait = {
                active: true,
                x: e.clientX,
                y: e.clientY
            };
            return;
        }

        this._startFreeDrag();
    }

    _startFreeDrag() {
        if (this.state.originalHeight) {
            this.windowNode.style.height = typeof this.state.originalHeight === 'number'
                ? `${this.state.originalHeight}px`
                : this.state.originalHeight;
            this.state.originalHeight = null;
        }
        if (this.state.originalWidth) {
            this.windowNode.style.width = typeof this.state.originalWidth === 'number'
                ? `${this.state.originalWidth}px`
                : this.state.originalWidth;
            this.state.originalWidth = null;
        }

        if (this.interaction) this.interaction.toggleMinimizeButton(true);

        this.windowNode.style.margin = '0';
        this.windowNode.style.transform = 'none';
        this.windowNode.classList.add('dragging');
        this.windowNode.classList.remove('docked');

        // [NUEVO] Liberar el lado ocupado
        this.state.dockSide = null;

        if (this.interaction && this.interaction._onDockStateChange) {
            this.interaction._onDockStateChange();
        }
    }

    _onMove(e) {
        if (!this.state.isDragging) return;

        // [VERIFICACIÓN DE UMBRAL]
        if (this.dockWait.active) {
            const dist = Math.hypot(e.clientX - this.dockWait.x, e.clientY - this.dockWait.y);

            if (dist < 40) {
                return;
            } else {
                this.dockWait.active = false;
                this._startFreeDrag();

                const currentWidth = this.windowNode.offsetWidth;
                if (this.dragOffset.x > currentWidth - 30) {
                    this.dragOffset.x = currentWidth / 2;
                }
            }
        }

        e.preventDefault();

        const canvasRect = this.scene.game.canvas.getBoundingClientRect();
        const visualX = e.clientX - canvasRect.left - this.dragOffset.x;
        const visualY = e.clientY - canvasRect.top - this.dragOffset.y;
        const logicX = visualX / this.scale.x;
        const logicY = visualY / this.scale.y;

        this.windowNode.style.left = `${logicX}px`;
        this.windowNode.style.top = `${logicY}px`;

        if (this.docking) {
            const mouseLogicX = (e.clientX - canvasRect.left) / this.scale.x;
            const mouseLogicY = (e.clientY - canvasRect.top) / this.scale.y;

            // [MODIFICADO] Pasamos el checker al calcular el estado
            const updatedDockState = this.docking.getDockingState(
                mouseLogicX,
                mouseLogicY,
                this.windowNode.offsetWidth,
                this.windowNode.offsetHeight,
                this.interaction ? this.interaction.occupancyChecker : null
            );

            this.docking.showFeedback(updatedDockState, this.windowNode.offsetWidth, this.windowNode.offsetHeight);
        }

        if (this.callbacks.onDragMove) this.callbacks.onDragMove(e, logicX, logicY);
    }

    _onEnd(e) {
        const wasWaiting = this.dockWait.active;
        this.dockWait.active = false;

        if (this.state.isDragging) {
            this.state.isDragging = false;

            if (wasWaiting) {
                return;
            }

            this.windowNode.classList.remove('dragging');
            this.windowNode.style.zIndex = '10000'; // Fallback temporal antes del focus

            if (this.docking) {
                const canvasRect = this.scene.game.canvas.getBoundingClientRect();
                const mouseLogicX = (e.clientX - canvasRect.left) / this.scale.x;
                const mouseLogicY = (e.clientY - canvasRect.top) / this.scale.y;

                // [MODIFICADO] Pasamos el checker también al soltar
                const dockState = this.docking.getDockingState(
                    mouseLogicX,
                    mouseLogicY,
                    this.windowNode.offsetWidth,
                    this.windowNode.offsetHeight,
                    this.interaction ? this.interaction.occupancyChecker : null
                );

                if (dockState.isDocked) {
                    this.state.originalWidth = this.windowNode.style.width || this.windowNode.offsetWidth;
                    this.state.originalHeight = this.windowNode.style.height || this.windowNode.offsetHeight;

                    this.windowNode.style.left = `${dockState.x}px`;
                    this.windowNode.style.top = `${dockState.y}px`;

                    if (dockState.width) this.windowNode.style.width = `${dockState.width}px`;
                    if (dockState.height) this.windowNode.style.height = `${dockState.height}px`;

                    this.windowNode.classList.add('docked');

                    // [NUEVO] Registrar ocupación
                    this.state.dockSide = dockState.side;

                    if (this.interaction) this.interaction.toggleMinimizeButton(false);
                } else {
                    this.windowNode.classList.remove('docked');
                    this.state.dockSide = null;
                }

                this.docking.hideFeedback();
            }

            if (this.callbacks.onDragEnd) this.callbacks.onDragEnd(e);
        }
    }

    destroy() {
        if (this._binds) {
            window.removeEventListener('mousemove', this._binds.move);
            window.removeEventListener('mouseup', this._binds.end);
        }
        if (this.docking) this.docking.hideFeedback();
    }
}