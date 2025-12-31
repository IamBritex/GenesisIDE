/**
 * source/funkin/ui/editors/managers/DockLayoutManager.js
 */
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

        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;

        // Alturas fijas de las barras
        const topH = 38;
        const botH = 45;
        const availableHeight = gameHeight - topH - botH;

        const tabBar = this._getWindowById('tab-bar');
        const bottomBar = this._getWindowById('bottom-bar');
        const toolBar = this._getWindowById('tool-bar');

        // 1. Asegurar barras horizontales
        if (toolBar && toolBar.windowNode) {
            toolBar.windowNode.style.width = `${gameWidth}px`;
            toolBar.windowNode.style.height = `${topH}px`;
        }
        if (bottomBar && bottomBar.windowNode) {
            bottomBar.windowNode.style.top = `${gameHeight - botH}px`;
            bottomBar.windowNode.style.width = `${gameWidth}px`;
            bottomBar.windowNode.style.height = `${botH}px`;
        }

        let leftOffset = 0;
        let rightOffset = 0;

        // 2. Ajustar paneles laterales (Explorer, Properties, etc.)
        ModularWindow.openPopups.forEach(win => {
            if (!win.windowNode) return;
            const configId = win.config.id;

            // Ignorar las barras principales
            if (configId === 'tool-bar' || configId === 'bottom-bar' || configId === 'tab-bar') return;

            const isDocked = win.windowNode.classList.contains('docked');
            const isVisible = win.windowNode.style.display !== 'none';

            if (isDocked && isVisible && win.interaction && win.interaction.state) {
                const side = win.interaction.state.dockSide;
                const currentWidth = win.windowNode.offsetWidth;

                // [CORRECCIÓN CRÍTICA] Forzar altura y posición vertical
                win.windowNode.style.top = `${topH}px`;
                win.windowNode.style.height = `${availableHeight}px`;

                if (side === 'left') {
                    win.windowNode.style.left = '0px';
                    if (currentWidth > leftOffset) leftOffset = currentWidth;
                }
                if (side === 'right') {
                    win.windowNode.style.left = `${gameWidth - currentWidth}px`;
                    if (currentWidth > rightOffset) rightOffset = currentWidth;
                }
            }
        });

        // 3. Ajustar TabBar al espacio central restante
        if (tabBar && tabBar.windowNode) {
            let startX = leftOffset;
            let endLimit = gameWidth - rightOffset;
            const newWidth = Math.max(0, endLimit - startX);

            tabBar.windowNode.style.left = `${startX}px`;
            tabBar.windowNode.style.width = `${newWidth}px`;
        }
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