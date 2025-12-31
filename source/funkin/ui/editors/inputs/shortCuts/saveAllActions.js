/**
 * source/funkin/ui/editors/inputs/shortCuts/saveAllActions.js
 */
import { createFromData } from '../../managers/ElementSerializer.js';

export default class ActionHistory {
    constructor(scene, elementSelector) {
        this.scene = scene;
        this.elementSelector = elementSelector; // Puede ser null en StageMode

        this.undoStack = [];
        this.redoStack = [];
        this.maxActions = 50;
    }

    recordChange(element, changes) {
        let hasChanges = false;
        for (let key in changes) {
            const v1 = changes[key].from;
            const v2 = changes[key].to;
            if (Math.abs(v1 - v2) > 0.0001) {
                hasChanges = true;
                break;
            }
        }
        if (!hasChanges) return;

        this.addAction({
            type: 'update_properties',
            element: element,
            changes: changes
        });
    }

    addAction(action) {
        this.redoStack = [];
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxActions) this.undoStack.shift();
        console.log(`[History] Acción guardada: ${action.type}`);
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        this._applyAction(action, true);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this._applyAction(action, false);
    }

    _applyAction(action, isUndo) {
        const el = action.element;
        if ((!el || !el.active) && action.type === 'update_properties') {
            console.warn("[History] Elemento no disponible.");
            return;
        }

        switch (action.type) {
            case 'update_properties':
                this._applyProperties(el, action.changes, isUndo);
                break;
            case 'delete':
                isUndo ? this._restoreElement(action) : this._destroyElement(action);
                break;
            case 'create':
                isUndo ? this._destroyElement(action) : this._restoreElement(action);
                break;
        }

        if (action.element && action.element.active) {
            this.scene.events.emit('element_updated', action.element);
            if (action.type === 'update_properties') {
                this.scene.events.emit('element_selected', action.element);
            }
        }
    }

    _applyProperties(element, changes, isUndo) {
        const controller = element.getData('controller');
        const charID = element.getData('charID');
        const config = element.getData('config') || {};
        let configChanged = false;

        for (const [prop, values] of Object.entries(changes)) {
            const val = isUndo ? values.from : values.to;

            // --- CASO 1: Propiedades Especiales de Personaje (Cámara) ---
            if (controller && charID) {
                if (prop === 'camOffsetX') {
                    const currentOffsets = controller.getCameraOffsets(charID);
                    controller.setCameraOffset(charID, val, currentOffsets.y);
                    continue;
                }
                if (prop === 'camOffsetY') {
                    const currentOffsets = controller.getCameraOffsets(charID);
                    controller.setCameraOffset(charID, currentOffsets.x, val);
                    continue;
                }
                if (prop === 'camZoom') {
                    controller.setCameraZoom(charID, val);
                    continue;
                }
            }

            // --- CASO 2: Configuración (Animaciones, FPS) ---
            if (prop === 'animFps') {
                if (!config.animation) config.animation = {};
                config.animation.frameRate = val;
                configChanged = true;
                continue;
            }

            // --- CASO 3: Propiedades Estándar (Visuales + Config) ---
            // Aplicar directamente al objeto visual
            if (prop === 'x') element.x = val;
            else if (prop === 'y') element.y = val;
            else if (prop === 'angle') element.setAngle(val);
            else if (prop === 'alpha') element.setAlpha(val);
            else if (prop === 'scaleX') element.scaleX = val;
            else if (prop === 'scaleY') element.scaleY = val;
            else if (prop === 'scrollFactorX') element.scrollFactorX = val;
            else if (prop === 'scrollFactorY') element.scrollFactorY = val;
            else if (prop in element) element[prop] = val; // Fallback

            // Sincronizar JSON Config (CON SEGURIDAD)
            if (prop === 'x' && config.position && Array.isArray(config.position)) config.position[0] = val;
            if (prop === 'y' && config.position && Array.isArray(config.position)) config.position[1] = val;
            if (prop === 'angle') config.angle = val;
            if (prop === 'alpha') config.opacity = val;
        }

        if (configChanged || (config && Object.keys(config).length > 0)) {
            element.setData('config', config);
        }
    }

    _restoreElement(action) {
        if (action.elementData) {
            const newElement = createFromData(this.scene, action.elementData);
            if (newElement) {
                action.element = newElement;
                if (this.elementSelector) {
                    this.elementSelector.registerElement(newElement);
                    this.elementSelector.selecting.select(newElement);
                } else {
                    this.scene.events.emit('element_restored', newElement);
                    this.scene.events.emit('element_selected', newElement);
                }
            }
        }
    }

    _destroyElement(action) {
        const el = action.element;
        if (el && el.active) {
            if (this.elementSelector) this.elementSelector.unregisterElement(el);
            el.destroy();
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}