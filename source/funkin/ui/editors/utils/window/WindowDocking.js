/**
 * source/funkin/ui/editors/utils/window/WindowDocking.js
 */
export default class WindowDocking {
    constructor(scene) {
        this.scene = scene;
        this.edgeThreshold = 20;
        this.dockPreview = null;
        this.topLimit = 38;
        this.bottomLimit = 56;
    }

    /**
     * Calcula si la ventana debe acoplarse, verificando ocupación.
     */
    getDockingState(mouseX, mouseY, winWidth, winHeight, occupancyChecker) {
        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;
        const availableHeight = gameHeight - this.topLimit - this.bottomLimit;

        let snappedX = null;
        let snappedY = null;
        let snappedWidth = null;
        let snappedHeight = null;
        let isDocked = false;
        let side = null;

        // 1. Izquierda
        if (mouseX <= this.edgeThreshold) {
            // [NUEVO] Verificamos si está ocupado
            if (occupancyChecker && occupancyChecker('left')) {
                // Está ocupado, no hacemos nada (isDocked se mantiene false)
            } else {
                snappedX = 0;
                snappedY = this.topLimit;
                snappedHeight = availableHeight;
                snappedWidth = winWidth < 300 ? 300 : winWidth;
                isDocked = true;
                side = 'left';
            }
        }
        // 2. Derecha
        else if (mouseX >= gameWidth - this.edgeThreshold) {
            // [NUEVO] Verificamos si está ocupado
            if (occupancyChecker && occupancyChecker('right')) {
                // Ocupado
            } else {
                snappedX = gameWidth - winWidth;
                if (snappedX < gameWidth - 300) snappedX = gameWidth - 300;

                snappedY = this.topLimit;
                snappedHeight = availableHeight;
                snappedWidth = gameWidth - snappedX;
                isDocked = true;
                side = 'right';
            }
        }

        return {
            x: snappedX,
            y: snappedY,
            width: snappedWidth,
            height: snappedHeight,
            isDocked,
            side
        };
    }

    showFeedback(dockState, winWidth, winHeight) {
        if (!this.dockPreview) {
            this.dockPreview = this.scene.add.graphics();
            this.dockPreview.setScrollFactor(0);
            this.dockPreview.setDepth(9000);
            if (this.scene.cameraManager) {
                this.scene.cameraManager.assignToHUD(this.dockPreview);
            }
        }

        this.dockPreview.clear();

        if (dockState.isDocked) {
            const rectX = dockState.x;
            const rectY = dockState.y;
            const rectW = dockState.width || winWidth;
            const rectH = dockState.height || winHeight;

            this.dockPreview.fillStyle(0x007acc, 0.3);
            this.dockPreview.fillRoundedRect(rectX, rectY, rectW, rectH, 0);

            this.dockPreview.lineStyle(2, 0x007acc, 0.8);
            this.dockPreview.strokeRoundedRect(rectX, rectY, rectW, rectH, 0);
        }
    }

    hideFeedback() {
        if (this.dockPreview) {
            this.dockPreview.clear();
        }
    }
}