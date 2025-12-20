import { ModularWindow } from '../utils/window/ModularWindow.js';

export default class DockLayoutManager {
    constructor(scene) {
        this.scene = scene;
        this.updatePending = false;

        this.onLayoutUpdateHandler = this.onLayoutUpdate.bind(this);
        this._bindEvents();

        this.scene.time.delayedCall(200, () => this._updateLayout());
    }

    _bindEvents() {
        window.addEventListener('layout-update', this.onLayoutUpdateHandler);
        this.scene.scale.on('resize', this.onLayoutUpdateHandler);
    }

    onLayoutUpdate() {
        if (!this.updatePending) {
            this.updatePending = true;
            requestAnimationFrame(this._updateLayout.bind(this));
        }
    }

    _updateLayout() {
        this.updatePending = false;
        if (!this.scene || !this.scene.scale) return;

        // 1. Usar la resolución interna del juego (ej. 1280)
        const gameWidth = this.scene.scale.width;

        const tabBar = this._getWindowById('tab-bar');
        if (!tabBar || !tabBar.windowNode) return;

        let leftOffset = 0;
        let rightOffset = 0;

        ModularWindow.openPopups.forEach(win => {
            if (win === tabBar || !win.windowNode) return;
            if (win.config.id === 'tool-bar' || win.config.id === 'bottom-bar') return;

            const isDocked = win.windowNode.classList.contains('docked');
            // Nota: offsetWidth es 0 si display es 'none', así que la verificación de visibilidad es implícita
            const isVisible = win.windowNode.style.display !== 'none';

            if (isDocked && isVisible && win.interaction && win.interaction.state) {
                const side = win.interaction.state.dockSide;

                // [CORRECCIÓN] Usar offsetWidth en lugar de getBoundingClientRect()
                // offsetWidth devuelve el ancho CSS (coordenadas del juego)
                // getBoundingClientRect devuelve el ancho renderizado en pantalla (afectado por el zoom)
                const currentWidth = win.windowNode.offsetWidth;

                if (side === 'left') {
                    if (currentWidth > leftOffset) leftOffset = currentWidth;
                }
                if (side === 'right') {
                    if (currentWidth > rightOffset) rightOffset = currentWidth;
                }
            }
        });


        let startX = leftOffset;
        if (leftOffset > 0) startX;

        let endLimit = gameWidth - rightOffset;
        if (rightOffset > 0) endLimit;

        const newWidth = Math.max(0, endLimit - startX);

        // Aplicar estilos
        tabBar.windowNode.style.left = `${startX}px`;
        tabBar.windowNode.style.width = `${newWidth}px`;
    }

    _getWindowById(id) {
        return ModularWindow.openPopups.find(win => win.config && win.config.id === id);
    }

    destroy() {
        window.removeEventListener('layout-update', this.onLayoutUpdateHandler);
        if (this.scene && this.scene.scale) {
            this.scene.scale.off('resize', this.onLayoutUpdateHandler);
        }
    }
}