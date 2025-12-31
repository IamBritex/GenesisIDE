/**
 * source/funkin/ui/editors/components/UI/tools/edit/controls.js
 * Manejador de operaciones de edición (Cortar, Copiar, Pegar).
 */
// [SOLUCIÓN] Ruta corregida según tu indicación
import { serializeElement } from '../../../../managers/ElementSerializer.js';

export default class EditControls {
    constructor(scene, actionHistory, controllers) {
        this.scene = scene;
        this.actionHistory = actionHistory;
        this.controllers = controllers;

        this.clipboard = null;
        this.selectedElement = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.scene.events.on('element_selected', (el) => {
            this.selectedElement = el;
        });

        window.addEventListener('editor-copy', () => this.copy());
        window.addEventListener('editor-paste', () => this.paste());
        window.addEventListener('editor-cut', () => this.cut());
    }

    copy() {
        if (!this.selectedElement) return;

        const data = serializeElement(this.selectedElement);
        if (data) {
            this.clipboard = JSON.parse(JSON.stringify(data));
            console.log('[EditControls] Copiado:', this.clipboard);
            if (this.scene.toast) this.scene.toast.show('Copied', 'Element copied to clipboard', 'info');
        }
    }

    cut() {
        if (!this.selectedElement) return;
        this.copy();
        this._deleteCurrent();
    }

    paste() {
        if (!this.clipboard) return;

        const pasteData = JSON.parse(JSON.stringify(this.clipboard));

        // Offset visual
        pasteData.x += 20;
        pasteData.y += 20;
        if (pasteData.position && Array.isArray(pasteData.position)) {
            pasteData.position[0] += 20;
            pasteData.position[1] += 20;
        }

        let newElement = null;

        if (pasteData.type === 'image' || pasteData.type === 'stage_image') {
            if (this.controllers.images) newElement = this.controllers.images.paste(pasteData);
        } else if (pasteData.type === 'spritesheet' || pasteData.type === 'sprite') {
            if (this.controllers.sprites) newElement = this.controllers.sprites.paste(pasteData);
        } else if (pasteData.type === 'character') {
            if (this.scene.toast) this.scene.toast.show('Info', 'Paste not supported for characters.', 'warning');
            return;
        }

        if (newElement) {
            // [IMPORTANTE] Registrar creación en historial para Undo
            if (this.actionHistory) {
                this.actionHistory.addAction({
                    type: 'create',
                    element: newElement,
                    elementData: pasteData
                });
            }

            this.scene.events.emit('element_selected', newElement);
            if (this.scene.toast) this.scene.toast.show('Pasted', 'Element duplicated', 'success');
        }
    }

    _deleteCurrent() {
        const el = this.selectedElement;
        if (!el) return;

        const elementData = serializeElement(el);

        // Deseleccionar antes de destruir para evitar errores
        this.scene.events.emit('element_deselected');
        this.selectedElement = null;

        el.destroy();

        // [IMPORTANTE] Registrar eliminación en historial para Undo (que restaurará el elemento)
        if (this.actionHistory) {
            this.actionHistory.addAction({
                type: 'delete',
                element: el,
                elementData: elementData
            });
        }
    }

    destroy() {
        window.removeEventListener('editor-copy', () => this.copy());
        window.removeEventListener('editor-paste', () => this.paste());
        window.removeEventListener('editor-cut', () => this.cut());
    }
}