/**
 * source/funkin/ui/editors/components/UI/properties/Properties.js
 */
import StageCharacterProperties from './stage/StageCharacterProperties.js';
import StageImagesProperties from './stage/StageImagesProperties.js';
import StageSpritesProperties from './stage/StageSpritesProperties.js';

export default class Properties {
    constructor(scene) {
        this.scene = scene;
        this.selectedElement = null;
        this.currentViewType = null;

        // Carga de Templates HTML
        this.templates = {
            character: this.scene.cache.html.get('stage_properties_characters'),
            image: this.scene.cache.html.get('stage_properties_images'),
            spritesheet: this.scene.cache.html.get('stage_properties_sprites')
        };

        // Instancias de los manejadores modulares
        this.handlers = {
            character: new StageCharacterProperties(scene),
            image: new StageImagesProperties(scene),
            spritesheet: new StageSpritesProperties(scene)
        };

        this.initListeners();
    }

    getFieldsContainer() {
        return document.getElementById('prop-fields');
    }

    initListeners() {
        this.scene.events.on('element_selected', (element) => this.onElementSelected(element));

        // Actualización en tiempo real (cuando se arrastra el objeto)
        this.scene.events.on('element_updated', (element) => {
            if (this.selectedElement === element && this.currentViewType) {
                this.handlers[this.currentViewType].updateValues(element);
            }
        });

        this.scene.events.on('element_deselected', () => {
            this.selectedElement = null;
            this.currentViewType = null;
            const container = this.getFieldsContainer();
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
            const noSel = document.getElementById('noSelectionMsg');
            if (noSel) noSel.style.display = 'block';
        });
    }

    onElementSelected(element) {
        this.selectedElement = element;
        const container = this.getFieldsContainer();
        if (!container) return;

        // Determinar tipo
        const type = element.getData('type');
        let targetType = 'character';

        if (type === 'stage_image' || type === 'image') targetType = 'image';
        else if (type === 'spritesheet') targetType = 'spritesheet';
        else if (type === 'character') targetType = 'character';

        // Renderizar si cambia el tipo de vista
        if (this.currentViewType !== targetType) {
            if (this.templates[targetType]) {
                container.innerHTML = this.templates[targetType];
                this.currentViewType = targetType;

                // Enlazar eventos del DOM usando el handler específico
                this.handlers[targetType].bind(element);
            } else {
                container.innerHTML = `<div style="padding:10px; color:red;">Template not found for: ${targetType}</div>`;
            }
        } else {
            // Si es el mismo tipo, re-enlazamos por si cambiamos de un sprite a otro del mismo tipo
            this.handlers[targetType].bind(element);
        }

        container.style.display = 'block';
        const noSel = document.getElementById('noSelectionMsg');
        if (noSel) noSel.style.display = 'none';

        // Llenar valores iniciales
        this.handlers[targetType].updateValues(element);
    }
}