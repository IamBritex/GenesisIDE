/**
 * source/funkin/ui/editors/utils/window/WindowInteraction.js
 */
import WindowDragger from './WindowDragger.js';
import WindowResizer from './WindowResizer.js';

export default class WindowInteraction {
    constructor(scene, windowNode, config, callbacks, focusCallback, occupancyChecker) {
        this.scene = scene;
        this.windowNode = windowNode;
        this.config = config;
        this.callbacks = callbacks || {};
        this.focusCallback = focusCallback;
        this.occupancyChecker = occupancyChecker;
        this.domContainer = null;

        this.state = {
            isDragging: false,
            isResizing: false,
            isMinimized: false,
            originalHeight: null,
            originalWidth: null,
            lastHeight: 0,
            dockSide: null
        };

        this.resizer = new WindowResizer(scene, windowNode, this.state, this.bringToFront.bind(this), config);
        this.dragger = new WindowDragger(scene, windowNode, config, this.state, {
            ...this.callbacks,
            onDragEnd: (e) => {
                this._onDockStateChange();
                if (this.callbacks.onDragEnd) this.callbacks.onDragEnd(e);
            }
        },
            this.bringToFront.bind(this),
            this
        );

        this._bindGeneralEvents();
    }

    _bindGeneralEvents() {
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

        const stopProp = (e) => {
            e.stopPropagation();
            this.bringToFront();
        };

        this.windowNode.addEventListener('mousedown', stopProp);
        this.windowNode.addEventListener('pointerdown', stopProp);
        this.windowNode.addEventListener('touchstart', stopProp);
        this.windowNode.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: false });
    }

    _onDockStateChange() {
        const isDocked = this.windowNode.classList.contains('docked');
        if (isDocked) {
            this.windowNode.style.borderRadius = '0';
            this.windowNode.style.boxShadow = 'none';
        } else {
            this.windowNode.style.borderRadius = this.config.borderRad ? '' : '0';
            if (this.config.showTitle) {
                this.windowNode.style.boxShadow = '';
            } else {
                this.windowNode.style.boxShadow = 'none';
            }
        }
    }

    bringToFront() {
        if (this.focusCallback) {
            this.focusCallback();
        }
    }

    toggleMinimizeButton(visible) {
        const minBtn = this.windowNode.querySelector('.win-btn[data-action="minimize"]');
        if (minBtn) minBtn.style.display = visible ? 'flex' : 'none';
    }

    toggleMinimize() {
        // [IMPORTANTE] Debe coincidir con height de .window-header en CSS
        const HEADER_HEIGHT = 42;

        const minBtnImg = this.windowNode.querySelector('.win-btn[data-action="minimize"] img');

        if (!this.state.isMinimized) {
            // -- MINIMIZAR --
            this.state.lastHeight = this.windowNode.offsetHeight;

            // Forzamos la altura actual antes de animar para que la transición de CSS funcione
            this.windowNode.style.height = `${this.state.lastHeight}px`;
            // Forzar reflow
            this.windowNode.offsetHeight;

            this.windowNode.classList.add('minimized');

            // Fijar altura solo al header
            this.windowNode.style.height = `${HEADER_HEIGHT}px`;
            this.windowNode.style.overflow = 'hidden';

            if (minBtnImg) minBtnImg.src = 'public/images/ui/editors/maximize.svg';
        } else {
            // -- RESTAURAR --
            this.windowNode.classList.remove('minimized');

            // Restaurar altura anterior
            this.windowNode.style.height = `${this.state.lastHeight}px`;

            setTimeout(() => {
                if (!this.state.isMinimized) {
                    // Si estaba en 'auto' o era docked, ajustamos
                    if (this.config.height === 'auto' && !this.state.isDocked) {
                        this.windowNode.style.height = 'auto';
                    } else if (this.state.isDocked) {
                        // Si está dockeada, mantenemos la altura calculada
                    }
                    this.windowNode.style.overflow = 'visible';
                }
            }, 300); // 300ms debe coincidir con la transición CSS

            if (minBtnImg) minBtnImg.src = 'public/images/ui/editors/minimize.svg';
        }
        this.state.isMinimized = !this.state.isMinimized;
    }

    destroy() {
        if (this.dragger) this.dragger.destroy();
        if (this.resizer) this.resizer.destroy();
        this.domContainer = null;
    }
}