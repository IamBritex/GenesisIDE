/**
 * source/funkin/ui/editors/components/elements/Draggingg.js
 */
export default class Dragging {
    constructor(scene, selectionManager, actionHistory) {
        this.scene = scene;
        this.selectionManager = selectionManager;
        this.actionHistory = actionHistory;

        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // Guardamos el estado inicial antes de empezar a mover
        this.startState = { x: 0, y: 0 };

        this.isLocked = false;
        this.onElementUpdated = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.scene.input.on('pointermove', this.onDragMove, this);
        this.scene.input.on('pointerup', this.onDragEnd, this);
    }

    startDrag(element, pointer) {
        if (this.isLocked || !element) return;

        this.isDragging = true;

        // 1. CAPTURAR PROPIEDADES INICIALES
        this.startState.x = element.x;
        this.startState.y = element.y;

        this.dragOffset.x = element.x - pointer.worldX;
        this.dragOffset.y = element.y - pointer.worldY;
    }

    onDragMove(pointer) {
        if (!this.isDragging || !pointer.leftButtonDown()) {
            if (this.isDragging) this.onDragEnd(pointer);
            return;
        }

        const el = this.selectionManager.selectedElement;
        if (!el || this.isLocked) return;

        // Mover visualmente
        el.x = pointer.worldX + this.dragOffset.x;
        el.y = pointer.worldY + this.dragOffset.y;

        this.scene.events.emit('element_updated', el);
        if (this.onElementUpdated) this.onElementUpdated(el);
    }

    onDragEnd(pointer) {
        if (!this.isDragging) return;

        this.isDragging = false;
        const el = this.selectionManager.selectedElement;

        if (!el) return;

        // 2. DETECTAR CAMBIOS Y GUARDAR COMO PROPIEDADES
        // Comparamos estado inicial (startDrag) vs actual
        const changes = {};
        let hasChanges = false;

        if (el.x !== this.startState.x) {
            changes.x = { from: this.startState.x, to: el.x };
            hasChanges = true;
        }
        if (el.y !== this.startState.y) {
            changes.y = { from: this.startState.y, to: el.y };
            hasChanges = true;
        }

        if (hasChanges && this.actionHistory) {
            // Usamos el nuevo método genérico recordChange
            this.actionHistory.recordChange(el, changes);
        }
    }

    destroy() {
        this.scene.input.off('pointermove', this.onDragMove, this);
        this.scene.input.off('pointerup', this.onDragEnd, this);
        this.selectionManager = null;
        this.actionHistory = null;
    }
}