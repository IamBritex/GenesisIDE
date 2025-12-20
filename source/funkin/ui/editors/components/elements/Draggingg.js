/**
 * source/funkin/ui/editors/components/elements/Dragging.js
 * Maneja la lógica de arrastrar y soltar (Drag & Drop) y el historial de movimientos.
 */
export default class Dragging {
    constructor(scene, selectionManager, actionHistory) {
        this.scene = scene;
        this.selectionManager = selectionManager; // Referencia a Selecting.js para saber qué mover
        this.actionHistory = actionHistory;

        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStart = { x: 0, y: 0 };
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

        this.dragStart.x = element.x;
        this.dragStart.y = element.y;

        // Calcular offset relativo al puntero para evitar saltos
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

        el.x = pointer.worldX + this.dragOffset.x;
        el.y = pointer.worldY + this.dragOffset.y;

        // Notificar actualización en tiempo real (para UI Properties)
        this.scene.events.emit('element_updated', el);

        if (this.onElementUpdated) {
            this.onElementUpdated(el);
        }
    }

    onDragEnd(pointer) {
        if (!this.isDragging) return;
        if (!pointer.leftButtonReleased()) return;

        this.isDragging = false;

        const el = this.selectionManager.selectedElement;
        if (!el) return;

        // Solo registrar en historial si hubo movimiento real
        if (el.x !== this.dragStart.x || el.y !== this.dragStart.y) {
            if (this.actionHistory) {
                this.actionHistory.addAction({
                    type: 'move',
                    element: el,
                    oldPos: { x: this.dragStart.x, y: this.dragStart.y },
                    newPos: { x: el.x, y: el.y }
                });
            }
            // Emitir actualización final
            this.scene.events.emit('element_updated', el);
        }
    }

    destroy() {
        this.scene.input.off('pointermove', this.onDragMove, this);
        this.scene.input.off('pointerup', this.onDragEnd, this);
        this.selectionManager = null;
        this.actionHistory = null;
    }
}