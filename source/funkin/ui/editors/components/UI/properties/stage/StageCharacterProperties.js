/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageCharacterProperties.js
 */
import StageGeneralProperties from './StageGeneralProperties.js';

export default class StageCharacterProperties extends StageGeneralProperties {
    constructor(scene) {
        super(scene);
    }

    bind(element) {
        // Hereda bindings generales
        super.bind(element);

        // Bindings de cámara
        const get = (id) => document.getElementById(id);
        const controller = element.getData('controller');
        const charID = element.getData('charID');

        const dom = { camX: get('propCamX'), camY: get('propCamY'), camZoom: get('propCamZoom') };

        if (controller && charID) {
            const updateCam = () => {
                const cx = parseFloat(dom.camX?.value) || 0;
                const cy = parseFloat(dom.camY?.value) || 0;
                controller.setCameraOffset(charID, cx, cy);
            };
            const updateZoom = () => {
                controller.setCameraZoom(charID, parseFloat(dom.camZoom?.value) || 1);
            };

            if (dom.camX) dom.camX.oninput = updateCam;
            if (dom.camY) dom.camY.oninput = updateCam;
            if (dom.camZoom) dom.camZoom.oninput = updateZoom;
        }
    }

    updateValues(element) {
        super.updateValues(element);

        const elType = document.getElementById('propType');
        if (elType) elType.value = element.getData('characterName') || 'Unknown';

        const controller = element.getData('controller');
        const charID = element.getData('charID');
        if (controller && charID) {
            const off = controller.getCameraOffsets(charID);
            const get = (id) => document.getElementById(id);
            const setVal = (id, v) => { const e = get(id); if (e) e.value = v; };
            setVal('propCamX', off.x);
            setVal('propCamY', off.y);
            setVal('propCamZoom', controller.getCameraZoom(charID));
        }
    }
}