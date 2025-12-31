/**
 * source/funkin/ui/editors/components/controllers/stageMode/LoadStage.js
 */
export default class LoadStage {
    constructor(scene, imagesController, spriteController) {
        this.scene = scene;
        this.imagesController = imagesController;
        this.spriteController = spriteController;
    }

    load(jsonContent, charController = null, stageName = 'stage') {
        if (!jsonContent || !jsonContent.stage) {
            console.error("[LoadStage] JSON inválido.");
            return;
        }

        console.log(`[LoadStage] Procesando stage: ${stageName}`);
        const flattenedItems = this._flattenStageData(jsonContent.stage);

        if (this.imagesController) {
            this.imagesController.loadImages(stageName, flattenedItems);
        }

        if (this.spriteController) {
            this.spriteController.loadSprites(stageName, flattenedItems);
        }

        flattenedItems.forEach((item) => {
            if (item.type === 'character') {
                this.processCharacterData(item, charController);
            }
        });
    }

    _flattenStageData(items) {
        let result = [];
        items.forEach(item => {
            let content = item;
            let role = null;

            if (!item.type) {
                const keys = Object.keys(item);
                const knownRoles = ['player', 'boyfriend', 'bf', 'enemy', 'dad', 'opponent', 'playergf', 'gf', 'girlfriend', 'Group', 'group'];
                let foundKey = knownRoles.find(k => item[k]);
                if (!foundKey && keys.length === 1) foundKey = keys[0];

                if (foundKey && item[foundKey]) {
                    role = foundKey;
                    content = item[foundKey];
                }
            }

            if (!content) return;

            if (content.type === 'group' && Array.isArray(content.children)) {
                result = result.concat(this._flattenStageData(content.children));
            } else {
                const processedItem = { ...content };
                if (role && role.toLowerCase() !== 'group') {
                    processedItem._role = role;
                    if (!processedItem.type) processedItem.type = 'character';
                }
                result.push(processedItem);
            }
        });
        return result;
    }

    processCharacterData(data, charController) {
        let role = (data._role || '').toLowerCase();

        if (role === 'playergf' || role === 'girlfriend') role = 'gf';
        if (role === 'opponent' || role === 'enemy') role = 'dad';
        if (role === 'boyfriend' || role === 'player') role = 'bf';

        if (role === 'gf') {
            const char = this.getCharacterReference('gf', charController);
            if (char) this.applyCharProperties(char, data, 'GF', charController, 'gfVersion');
        }
        else if (role === 'dad') {
            const char = this.getCharacterReference('dad', charController);
            if (char) this.applyCharProperties(char, data, 'DAD', charController, 'enemy');
        }
        else if (role === 'bf') {
            const char = this.getCharacterReference('boyfriend', charController);
            if (char) this.applyCharProperties(char, data, 'BOYFRIEND', charController, 'player');
        }
    }

    getCharacterReference(name, charController) {
        if (charController && charController.characters && charController.characters.characterElements) {
            const elements = charController.characters.characterElements;
            if (name === 'boyfriend') return elements.bf;
            if (name === 'dad') return elements.dad;
            if (name === 'gf') return elements.gf;
        }
        if (this.scene[name]) return this.scene[name];
        if (name === 'boyfriend' && this.scene.bf) return this.scene.bf;
        return null;
    }

    applyCharProperties(char, data, debugName, charController = null, internalKey = null) {
        if (!char) return;

        // [CORRECCIÓN CRÍTICA] Soporte para Array de Escala
        if (typeof data.scale === 'number') {
            char.setScale(data.scale);
        } else if (Array.isArray(data.scale)) {
            char.setScale(data.scale[0], data.scale[1]);
        }

        // Posición
        if (data.position && Array.isArray(data.position)) {
            const sW = char.width * char.scaleX;
            const sH = char.height * char.scaleY;
            const visualX = data.position[0] - (sW / 2);
            const visualY = data.position[1] - sH;
            char.setPosition(visualX, visualY);
        }

        // Visuales
        if (data.visible !== undefined) char.setVisible(data.visible);
        if (data.opacity !== undefined) char.setAlpha(data.opacity);
        if (data.flip_x !== undefined) char.setFlipX(data.flip_x);
        if (data.flip_y !== undefined) char.setFlipY(data.flip_y);

        if (typeof data.layer === 'number') char.setDepth(data.layer);

        if (typeof data.scrollFactor === 'number') char.setScrollFactor(data.scrollFactor);
        else if (Array.isArray(data.scrollFactor)) char.setScrollFactor(data.scrollFactor[0], data.scrollFactor[1]);

        // Cámara
        if (charController && internalKey) {
            if (data.camera_Offset && Array.isArray(data.camera_Offset)) {
                charController.setCameraOffset(internalKey, data.camera_Offset[0], data.camera_Offset[1]);
            }
            if (typeof data.camera_zoom === 'number') {
                charController.setCameraZoom(internalKey, data.camera_zoom);
            }
        }
    }
}