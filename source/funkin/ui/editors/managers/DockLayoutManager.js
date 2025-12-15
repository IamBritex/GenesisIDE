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
        const tabBar = this._getWindowById('tab-bar');
        if (!tabBar || !tabBar.windowNode) return;

        let leftOffset = 0;
        let rightOffset = 0;

        ModularWindow.openPopups.forEach(win => {
            if (win === tabBar || !win.windowNode) return;
            if (win.config.id === 'tool-bar' || win.config.id === 'bottom-bar') return;

            const isDocked = win.windowNode.classList.contains('docked');
            const isVisible = win.windowNode.style.display !== 'none';

            if (isDocked && isVisible && win.interaction && win.interaction.state) {
                const side = win.interaction.state.dockSide;
                const rect = win.windowNode.getBoundingClientRect();

                if (side === 'left') {
                    if (rect.width > leftOffset) leftOffset = rect.width;
                }
                if (side === 'right') {
                    if (rect.width > rightOffset) rightOffset = rect.width;
                }
            }
        });

        // [GAP AUMENTADO] 4px para asegurar que no toque los bordes
        const GAP = 43;

        let startX = leftOffset;
        if (leftOffset > 0) startX += GAP;

        let endLimit = gameWidth - rightOffset;
        if (rightOffset > 0) endLimit -= GAP;

        const newWidth = Math.max(0, endLimit - startX);

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