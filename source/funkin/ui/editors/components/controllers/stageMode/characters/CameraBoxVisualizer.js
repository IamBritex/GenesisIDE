/**
 * source/funkin/ui/editors/components/controllers/stageMode/characters/CameraBoxVisualizer.js
 */
export class CameraBoxVisualizer {
    constructor(scene, controller) {
        this.scene = scene;
        this.controller = controller;
        this.isVisible = false;

        // Estado para restaurar
        this._wasVisibleBeforeTest = false;

        this.baseRes = { w: 1280, h: 720 };

        this.cameraOffsets = new Map([
            ['player', { x: 25, y: 90 }],
            ['enemy', { x: 520, y: 320 }],
            ['gfVersion', { x: 365, y: 340 }]
        ]);

        this.cameraZooms = new Map([
            ['player', 1],
            ['enemy', 1],
            ['gfVersion', 1]
        ]);

        this.boxes = {
            player: this._createInteractiveBox(0x00ff00, 'player'),
            enemy: this._createInteractiveBox(0xff0000, 'enemy'),
            gfVersion: this._createInteractiveBox(0xffff00, 'gfVersion')
        };

        this._onToggle = this._onToggle.bind(this);
        this._onTestStart = this._onTestStart.bind(this);
        this._onTestEnd = this._onTestEnd.bind(this);

        window.addEventListener('editor-view-cameraboxes', this._onToggle);
        window.addEventListener('editor-test-start', this._onTestStart);
        window.addEventListener('editor-test-end', this._onTestEnd);
    }

    _onToggle() {
        this.setVisible(!this.isVisible);
    }

    // [NUEVO]
    _onTestStart() {
        this._wasVisibleBeforeTest = this.isVisible;
        this.setVisible(false);
    }

    // [NUEVO]
    _onTestEnd() {
        if (this._wasVisibleBeforeTest) {
            this.setVisible(true);
        }
    }

    update() {
        if (!this.isVisible || !this.controller.characters?.characterElements) return;

        const { bf, dad, gf } = this.controller.characters.characterElements;
        this._syncBoxState(this.boxes.player, bf, 'player');
        this._syncBoxState(this.boxes.enemy, dad, 'enemy');
        this._syncBoxState(this.boxes.gfVersion, gf, 'gfVersion');
    }

    _syncBoxState(container, sprite, key) {
        if (!sprite?.active || !sprite?.visible) {
            container.setVisible(false);
            return;
        }
        container.setVisible(true);

        let baseX, baseY;
        const anchor = this.controller.anchors ? this.controller.anchors[key] : null;

        if (anchor && anchor.active) {
            baseX = anchor.x;
            baseY = anchor.y;
        } else {
            let offset = { x: 0, y: 0 };
            if (typeof this.controller._getAnimOffset === 'function') {
                offset = this.controller._getAnimOffset(sprite);
            }
            baseX = sprite.x + offset.x;
            baseY = sprite.y + offset.y;
        }

        const camOffset = this.getCameraOffsets(key);
        container.x = baseX + camOffset.x;
        container.y = baseY + camOffset.y;

        const zoom = this.getCameraZoom(key);
        const scaleFactor = 1 / zoom;

        const rect = container.getByName('mainRect');
        if (rect) rect.setScale(scaleFactor);

        const resizeHandle = container.getByName('resizeHandle');
        if (resizeHandle) {
            const cornerX = (this.baseRes.w / 2) * scaleFactor;
            const cornerY = (this.baseRes.h / 2) * scaleFactor;
            resizeHandle.setPosition(cornerX, cornerY);
            resizeHandle.setScale(1);
        }
    }

    _createInteractiveBox(color, key) {
        const container = this.scene.add.container(0, 0);
        container.setDepth(9999).setVisible(false);

        const r = this.scene.add.rectangle(0, 0, this.baseRes.w, this.baseRes.h);
        r.setStrokeStyle(4, color, 0.8).setFillStyle(color, 0.1);
        r.setName('mainRect');

        const crossSize = 30;
        const vLine = this.scene.add.rectangle(0, 0, 4, crossSize, 0xffffff);
        const hLine = this.scene.add.rectangle(0, 0, crossSize, 4, 0xffffff);

        const centerZone = this.scene.add.zone(0, 0, 80, 80);
        centerZone.setOrigin(0.5);
        centerZone.setInteractive({ cursor: 'move', draggable: true, useHandCursor: true });

        centerZone.on('drag', (pointer) => {
            const zoom = this.scene.cameras.main.zoom;
            const deltaX = (pointer.x - pointer.prevPosition.x) / zoom;
            const deltaY = (pointer.y - pointer.prevPosition.y) / zoom;

            const current = this.getCameraOffsets(key);
            this.setCameraOffset(key, current.x + deltaX, current.y + deltaY);
            this._notifyUpdate(key);
        });

        const handleSize = 12;
        const resizeHandle = this.scene.add.rectangle(0, 0, handleSize, handleSize, 0xffffff);
        resizeHandle.setStrokeStyle(2, 0x000000);
        resizeHandle.setName('resizeHandle');
        resizeHandle.setInteractive({ cursor: 'nwse-resize', draggable: true, useHandCursor: true });

        resizeHandle.on('drag', (pointer) => {
            const mouseWorldX = pointer.worldX;
            const containerWorldX = container.x;
            const distFromCenter = Math.abs(mouseWorldX - containerWorldX);

            const newWidth = Math.max(200, distFromCenter * 2);
            let newZoom = this.baseRes.w / newWidth;

            newZoom = Phaser.Math.Clamp(newZoom, 0.30, 2);

            this.setCameraZoom(key, newZoom);
            this._notifyUpdate(key);
        });

        container.add([r, vLine, hLine, centerZone, resizeHandle]);
        if (this.scene.cameraManager) this.scene.cameraManager.assignToGame(container);

        return container;
    }

    _notifyUpdate(charKey) {
        if (!this.controller.characters?.characterElements) return;
        const { bf, dad, gf } = this.controller.characters.characterElements;

        let targetSprite = null;
        if (charKey === 'player') targetSprite = bf;
        else if (charKey === 'enemy') targetSprite = dad;
        else if (charKey === 'gfVersion') targetSprite = gf;

        if (targetSprite) {
            targetSprite.setData('cameraOffset', this.getCameraOffsets(charKey));
            targetSprite.setData('camZoom', this.getCameraZoom(charKey));
            this.scene.events.emit('element_updated', targetSprite);
        }
    }

    getCameraOffsets(key) { return this.cameraOffsets.get(key) || { x: 0, y: 0 }; }
    setCameraOffset(key, x, y) { this.cameraOffsets.set(key, { x, y }); this.update(); }
    getCameraZoom(key) { return this.cameraZooms.get(key) || 1; }
    setCameraZoom(key, z) { this.cameraZooms.set(key, z); this.update(); }

    setVisible(v) {
        this.isVisible = v;
        if (!v) {
            Object.values(this.boxes).forEach(b => b.setVisible(false));
        } else {
            this.update();
        }
    }

    destroy() {
        window.removeEventListener('editor-view-cameraboxes', this._onToggle);
        window.removeEventListener('editor-test-start', this._onTestStart);
        window.removeEventListener('editor-test-end', this._onTestEnd);
        Object.values(this.boxes).forEach(b => b.destroy());
    }
}