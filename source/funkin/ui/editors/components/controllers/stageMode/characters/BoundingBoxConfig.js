/**
 * source/funkin/ui/editors/components/controllers/stageMode/characters/BoundingBoxConfig.js
 */
import Selecting from '../../../elements/Selecting.js';

export default class BoundingBoxConfig {
    constructor(scene, actionHistory) {
        this.scene = scene;
        this.actionHistory = actionHistory;
        this.isVisible = true;
        this.selectedElement = null;

        // Estado para restaurar visibilidad tras TestMode
        this._wasVisibleBeforeTest = true;

        this.gizmoContainer = this.scene.add.container(0, 0);
        this.gizmoContainer.setDepth(99999999);

        if (this.scene.cameraManager) {
            this.scene.cameraManager.assignToGame(this.gizmoContainer);
        }

        this.graphics = this.scene.add.graphics();
        this.gizmoContainer.add(this.graphics);

        this.handleSize = 10;
        this.handleColor = 0x0066FF;
        this.lineColor = 0x0066FF;

        this.handles = {};
        this._createHandles();

        this.dragState = {
            active: false,
            handle: null,
            startX: 0, startY: 0,
            initialScaleX: 1, initialScaleY: 1,
            baseWidth: 0, baseHeight: 0,
            initialAngle: 0,
            initialMouseAngle: 0,
            historyStart: { x: 0, y: 0, scaleX: 1, scaleY: 1, angle: 0 }
        };

        this._onToggle = this._onToggle.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._onDragStart = this._onDragStart.bind(this);
        this._onDrag = this._onDrag.bind(this);
        this._onDragEnd = this._onDragEnd.bind(this);

        // [NUEVO] Handlers para Test Mode
        this._onTestStart = this._onTestStart.bind(this);
        this._onTestEnd = this._onTestEnd.bind(this);

        window.addEventListener('editor-view-boundingboxes', this._onToggle);
        window.addEventListener('editor-test-start', this._onTestStart);
        window.addEventListener('editor-test-end', this._onTestEnd);

        this.scene.events.on('element_selected', this._onSelectionChange);
        this.scene.input.on('dragstart', this._onDragStart);
        this.scene.input.on('drag', this._onDrag);
        this.scene.input.on('dragend', this._onDragEnd);
    }

    _createHandles() {
        const types = ['s', 'e', 'se', 'rotate'];

        types.forEach(type => {
            const isRotate = type === 'rotate';
            const size = this.handleSize;

            const handle = this.scene.add.rectangle(0, 0, size, size, isRotate ? 0xFFFFFF : this.handleColor);
            handle.setStrokeStyle(1, 0x000000);

            handle.setInteractive({ draggable: true, cursor: this._getCursorForType(type) });
            handle.name = type;

            this.gizmoContainer.add(handle);
            this.handles[type] = handle;
        });
    }

    _getCursorForType(type) {
        switch (type) {
            case 'nw': return 'nw-resize';
            case 'ne': return 'ne-resize';
            case 'sw': return 'sw-resize';
            case 'se': return 'se-resize';
            case 'n': return 'n-resize';
            case 's': return 's-resize';
            case 'e': return 'e-resize';
            case 'w': return 'w-resize';
            case 'rotate': return 'url(public/images/ui/editors/rotate.svg) 12 12, pointer';
            default: return 'default';
        }
    }

    _onToggle() {
        this.setVisible(!this.isVisible);
    }

    // [NUEVO] Ocultar al iniciar test
    _onTestStart() {
        this._wasVisibleBeforeTest = this.isVisible;
        this.setVisible(false);
    }

    // [NUEVO] Restaurar al terminar test
    _onTestEnd() {
        if (this._wasVisibleBeforeTest) {
            this.setVisible(true);
        }
    }

    _onSelectionChange(element) {
        this.selectedElement = element;
        this.update();
    }

    setVisible(visible) {
        this.isVisible = visible;
        this.gizmoContainer.setVisible(visible);
        if (visible) this.update();
    }

    _onDragStart(pointer, gameObject) {
        if (!this.isVisible || !this.selectedElement || !gameObject.name) return;
        if (!this.handles[gameObject.name]) return;

        pointer.event.stopPropagation();

        const el = this.selectedElement;

        this.dragState = {
            active: true,
            handle: gameObject.name,
            startX: pointer.worldX,
            startY: pointer.worldY,
            initialScaleX: el.scaleX,
            initialScaleY: el.scaleY,
            baseWidth: el.width,
            baseHeight: el.height,
            initialAngle: el.angle,
            initialMouseAngle: Phaser.Math.Angle.Between(el.x, el.y, pointer.worldX, pointer.worldY),
            historyStart: {
                x: el.x,
                y: el.y,
                scaleX: el.scaleX,
                scaleY: el.scaleY,
                angle: el.angle
            }
        };
    }

    _onDrag(pointer, gameObject, dragX, dragY) {
        if (!this.dragState.active || !this.selectedElement) return;

        const type = this.dragState.handle;
        const el = this.selectedElement;

        if (type === 'rotate') {
            this._handleRotation(pointer);
        } else {
            this._handleScale(pointer, type);
        }

        this.scene.events.emit('element_updated', el);
        this.update();
    }

    _onDragEnd() {
        if (this.dragState.active && this.selectedElement && this.actionHistory) {
            const el = this.selectedElement;
            const start = this.dragState.historyStart;

            const changes = {};
            let hasChanges = false;

            if (Math.abs(el.x - start.x) > 0.1) { changes.x = { from: start.x, to: el.x }; hasChanges = true; }
            if (Math.abs(el.y - start.y) > 0.1) { changes.y = { from: start.y, to: el.y }; hasChanges = true; }
            if (Math.abs(el.scaleX - start.scaleX) > 0.001) { changes.scaleX = { from: start.scaleX, to: el.scaleX }; hasChanges = true; }
            if (Math.abs(el.scaleY - start.scaleY) > 0.001) { changes.scaleY = { from: start.scaleY, to: el.scaleY }; hasChanges = true; }
            if (Math.abs(el.angle - start.angle) > 0.1) { changes.angle = { from: start.angle, to: el.angle }; hasChanges = true; }

            if (hasChanges) {
                this.actionHistory.recordChange(el, changes);
            }
        }

        if (this.dragState.active) {
            this.dragState.active = false;
        }
    }

    _handleRotation(pointer) {
        const el = this.selectedElement;
        const currentMouseAngle = Phaser.Math.Angle.Between(el.x, el.y, pointer.worldX, pointer.worldY);
        const deltaAngle = currentMouseAngle - this.dragState.initialMouseAngle;
        let newAngle = this.dragState.initialAngle + Phaser.Math.RadToDeg(deltaAngle);

        if (pointer.event.shiftKey) {
            newAngle = Math.round(newAngle / 15) * 15;
        }
        el.setAngle(newAngle);
    }

    _handleScale(pointer, type) {
        const el = this.selectedElement;
        const radians = Phaser.Math.DegToRad(el.angle);
        const cos = Math.cos(-radians);
        const sin = Math.sin(-radians);

        const dxWorld = pointer.worldX - this.dragState.startX;
        const dyWorld = pointer.worldY - this.dragState.startY;

        const dxLocal = dxWorld * cos - dyWorld * sin;
        const dyLocal = dxWorld * sin + dyWorld * cos;

        const currentW = this.dragState.baseWidth * this.dragState.initialScaleX;
        const currentH = this.dragState.baseHeight * this.dragState.initialScaleY;

        const originX = (el.originX !== undefined) ? el.originX : 0.5;
        const originY = (el.originY !== undefined) ? el.originY : 0.5;

        let newScaleX = this.dragState.initialScaleX;
        let newScaleY = this.dragState.initialScaleY;

        if (type.includes('e')) {
            if (originX !== 1) {
                const deltaW = dxLocal / (1 - originX);
                newScaleX = (currentW + deltaW) / this.dragState.baseWidth;
            }
        }
        else if (type.includes('w')) {
            if (originX !== 0) {
                const deltaW = dxLocal / (-originX);
                newScaleX = (currentW + deltaW) / this.dragState.baseWidth;
            }
        }

        if (type.includes('s')) {
            if (originY !== 1) {
                const deltaH = dyLocal / (1 - originY);
                newScaleY = (currentH + deltaH) / this.dragState.baseHeight;
            }
        }
        else if (type.includes('n')) {
            if (originY !== 0) {
                const deltaH = dyLocal / (-originY);
                newScaleY = (currentH + deltaH) / this.dragState.baseHeight;
            }
        }

        if (type.length === 2 && pointer.event.shiftKey) {
            const ratio = this.dragState.initialScaleX / this.dragState.initialScaleY;
            if (Math.abs(newScaleX) > Math.abs(newScaleY)) newScaleY = newScaleX / ratio;
            else newScaleX = newScaleY * ratio;
        }

        if (Math.abs(newScaleX) < 0.01) newScaleX = 0.01;
        if (Math.abs(newScaleY) < 0.01) newScaleY = 0.01;

        el.setScale(newScaleX, newScaleY);

        // Corrección de posición (Anchor Fix)
        const newW = this.dragState.baseWidth * newScaleX;
        const newH = this.dragState.baseHeight * newScaleY;

        let anchorRatioX = 0.5, anchorRatioY = 0.5;
        if (type.includes('n')) anchorRatioY = 1; else if (type.includes('s')) anchorRatioY = 0;
        if (type.includes('w')) anchorRatioX = 1; else if (type.includes('e')) anchorRatioX = 0;

        const currentWidth = this.dragState.baseWidth * el.scaleX;
        const currentHeight = this.dragState.baseHeight * el.scaleY;

        const localAnchorOffsetX = (anchorRatioX - originX) * currentWidth;
        const localAnchorOffsetY = (anchorRatioY - originY) * currentHeight;

        const rad = Phaser.Math.DegToRad(el.angle);
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);

        const rotatedAnchorX = localAnchorOffsetX * cosR - localAnchorOffsetY * sinR;
        const rotatedAnchorY = localAnchorOffsetX * sinR + localAnchorOffsetY * cosR;

        const fixedAnchorX = el.x + rotatedAnchorX;
        const fixedAnchorY = el.y + rotatedAnchorY;

        const dirX = (anchorRatioX === 1) ? -1 : 1;
        const dirY = (anchorRatioY === 1) ? -1 : 1;

        const newLocalOffX = (anchorRatioX - originX) * newW * Math.sign(dirX);
        const newLocalOffY = (anchorRatioY - originY) * newH * Math.sign(dirY);

        const newRotOffX = newLocalOffX * cosR - newLocalOffY * sinR;
        const newRotOffY = newLocalOffX * sinR + newLocalOffY * cosR;

        el.setPosition(fixedAnchorX - newRotOffX, fixedAnchorY - newRotOffY);
    }

    update() {
        this.graphics.clear();
        Object.values(this.handles).forEach(h => h.setVisible(false));

        if (!this.isVisible) return;

        const el = this.selectedElement;
        if (!el || !el.active) {
            if (el && !el.active) this.selectedElement = null;
            return;
        }

        const camera = this.scene.cameras.main;
        const zoom = camera ? camera.zoom : 1;
        const invZoom = 1 / zoom;

        this.gizmoContainer.setScrollFactor(1, 1);
        const sfX = el.scrollFactorX !== undefined ? el.scrollFactorX : 1;
        const sfY = el.scrollFactorY !== undefined ? el.scrollFactorY : 1;
        const visualX = el.x + camera.scrollX * (1 - sfX);
        const visualY = el.y + camera.scrollY * (1 - sfY);

        const width = el.width * el.scaleX;
        const height = el.height * el.scaleY;
        const originX = (el.originX !== undefined) ? el.originX : 0.5;
        const originY = (el.originY !== undefined) ? el.originY : 0.5;

        const x1 = -width * originX;
        const x2 = width * (1 - originX);
        const y1 = -height * originY;
        const y2 = height * (1 - originY);

        const rotateOffset = 40 * invZoom;

        const points = {
            nw: { x: x1, y: y1 },
            n: { x: (x1 + x2) / 2, y: y1 },
            ne: { x: x2, y: y1 },
            e: { x: x2, y: (y1 + y2) / 2 },
            se: { x: x2, y: y2 },
            s: { x: (x1 + x2) / 2, y: y2 },
            sw: { x: x1, y: y2 },
            w: { x: x1, y: (y1 + y2) / 2 },
            rotate: { x: (x1 + x2) / 2, y: y1 - rotateOffset }
        };

        const rotatePoint = (px, py, angle, cx, cy) => {
            const rad = Phaser.Math.DegToRad(angle);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            return {
                x: (px * cos - py * sin) + cx,
                y: (px * sin + py * cos) + cy
            };
        };

        this.graphics.lineStyle(2 * invZoom, this.lineColor, 1);
        this.graphics.beginPath();
        const corners = ['nw', 'ne', 'se', 'sw'];
        const worldCorners = corners.map(k => rotatePoint(points[k].x, points[k].y, el.angle, visualX, visualY));
        this.graphics.moveTo(worldCorners[0].x, worldCorners[0].y);
        this.graphics.lineTo(worldCorners[1].x, worldCorners[1].y);
        this.graphics.lineTo(worldCorners[2].x, worldCorners[2].y);
        this.graphics.lineTo(worldCorners[3].x, worldCorners[3].y);
        this.graphics.closePath();
        this.graphics.strokePath();

        const topMid = rotatePoint(points.n.x, points.n.y, el.angle, visualX, visualY);
        const rotPos = rotatePoint(points.rotate.x, points.rotate.y, el.angle, visualX, visualY);
        this.graphics.lineStyle(1 * invZoom, this.lineColor, 0.8);
        this.graphics.moveTo(topMid.x, topMid.y);
        this.graphics.lineTo(rotPos.x, rotPos.y);
        this.graphics.strokePath();

        Object.keys(points).forEach(key => {
            const handle = this.handles[key];
            if (handle) {
                const p = rotatePoint(points[key].x, points[key].y, el.angle, visualX, visualY);
                handle.setPosition(p.x, p.y);
                handle.setRotation(Phaser.Math.DegToRad(el.angle));
                handle.setScale(invZoom);
                handle.setVisible(true);

                if (key === 'rotate') {
                    handle.setAlpha(0.01);
                    this.graphics.fillStyle(0xFFFFFF, 1);
                    this.graphics.lineStyle(1 * invZoom, 0x000000, 1);
                    this.graphics.fillCircle(p.x, p.y, 6 * invZoom);
                    this.graphics.strokeCircle(p.x, p.y, 6 * invZoom);
                } else {
                    handle.setAlpha(1);
                }
            }
        });
    }

    destroy() {
        window.removeEventListener('editor-view-boundingboxes', this._onToggle);
        window.removeEventListener('editor-test-start', this._onTestStart);
        window.removeEventListener('editor-test-end', this._onTestEnd);

        this.scene.events.off('element_selected', this._onSelectionChange);
        this.scene.input.off('dragstart', this._onDragStart);
        this.scene.input.off('drag', this._onDrag);
        this.scene.input.off('dragend', this._onDragEnd);

        if (this.gizmoContainer) {
            this.gizmoContainer.destroy();
        }
    }
}