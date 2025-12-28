/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageImagesProperties.js
 */
import StageGeneralProperties from './StageGeneralProperties.js';

export default class StageImagesProperties extends StageGeneralProperties {
    constructor(scene) {
        super(scene);
    }

    bind(element) {
        // Hereda bindings generales
        super.bind(element);
        // propType es readonly, no necesita listener
    }

    updateValues(element) {
        super.updateValues(element);
        const elType = document.getElementById('propType');
        if (elType) elType.value = element.getData('imagePath') || 'Unknown';
    }
}