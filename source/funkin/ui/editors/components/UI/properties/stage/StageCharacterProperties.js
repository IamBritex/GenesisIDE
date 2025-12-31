/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageCharacterProperties.js
 */
import StageGeneralProperties from './StageGeneralProperties.js';

export default class StageCharacterProperties extends StageGeneralProperties {
    constructor(scene) {
        super(scene);
    }

    bind(element) {
        super.bind(element);

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
                const z = parseFloat(dom.camZoom?.value) || 1;
                controller.setCameraZoom(charID, z);
            };

            // [CRUCIAL] Usamos _setupInput con los nombres de propiedad "virtuales"
            // que ActionHistory está esperando ('camOffsetX', etc.)
            // y leemos el valor directamente del controlador, no del sprite.

            if (dom.camX) {
                dom.camX.oninput = updateCam;
                this._setupInput(dom.camX, 'camOffsetX', () => controller.getCameraOffsets(charID).x, element);
            }

            if (dom.camY) {
                dom.camY.oninput = updateCam;
                this._setupInput(dom.camY, 'camOffsetY', () => controller.getCameraOffsets(charID).y, element);
            }

            if (dom.camZoom) {
                dom.camZoom.oninput = updateZoom;
                this._setupInput(dom.camZoom, 'camZoom', () => controller.getCameraZoom(charID), element);
            }
        }
    }

    updateValues(element) {
        super.updateValues(element); // Actualiza propiedades base (x, y, scale) con redondeo

        const elType = document.getElementById('propType');
        if (elType) elType.value = element.getData('characterName') || 'Unknown';

        const controller = element.getData('controller');
        const charID = element.getData('charID');

        if (controller && charID) {
            const off = controller.getCameraOffsets(charID);
            const get = (id) => document.getElementById(id);
            // Usamos this._round para garantizar solo 2 decimales en la UI
            const setVal = (id, v) => { const e = get(id); if (e) e.value = this._round(v); };

            setVal('propCamX', off.x);
            setVal('propCamY', off.y);
            setVal('propCamZoom', controller.getCameraZoom(charID));
        }
    }
}