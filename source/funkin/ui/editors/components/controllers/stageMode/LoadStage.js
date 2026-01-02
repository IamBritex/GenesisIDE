
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
        // [CHANSELUR] Iniciamos la recursion sin grupo padre
        const flattenedItems = this._flattenStageData(jsonContent.stage, null);

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

    // [CHANSELUR] Agregado parentGroup para pasar la herencia
    _flattenStageData(items, parentGroup = null) {
        let result = [];
        items.forEach(item => {
            let content = item;
            let role = null;
            let keyName = null; // Guardamos el nombre de la llave (ej: "Group")

            if (!item.type) {
                const keys = Object.keys(item);
                // [CHANSELUR] Agregue Group y group a la lista de roles conocidos
                const knownRoles = ['player', 'boyfriend', 'bf', 'enemy', 'dad', 'opponent', 'playergf', 'gf', 'girlfriend', 'Group', 'group'];
                let foundKey = knownRoles.find(k => item[k]);
                if (!foundKey && keys.length === 1) foundKey = keys[0];

                if (foundKey && item[foundKey]) {
                    role = foundKey;
                    keyName = foundKey;
                    content = item[foundKey];
                }
            }

            if (!content) return;

            // [CHANSELUR] Detectar si es un grupo y procesar recursivamente
            if (content.type === 'group' && Array.isArray(content.children)) {
                // Usamos el nombre de la llave como nombre del grupo
                const groupName = keyName || role || "Group";
                // Recursion: concatenamos los hijos aplanados, pasando el nombre de este grupo
                result = result.concat(this._flattenStageData(content.children, groupName));
            } else {
                const processedItem = { ...content };
                if (role && role.toLowerCase() !== 'group') {
                    processedItem._role = role;
                    if (!processedItem.type) processedItem.type = 'character';
                }

                // [CHANSELUR] AQUI ESTA LA MAGIA: Si viene de un padre, le pegamos la etiqueta
                if (parentGroup) {
                    processedItem.group = parentGroup;
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

        if (typeof data.scale === 'number') {
            char.setScale(data.scale);
        } else if (Array.isArray(data.scale)) {
            char.setScale(data.scale[0], data.scale[1]);
        }

        if (data.position && Array.isArray(data.position)) {
            const sW = char.width * char.scaleX;
            const sH = char.height * char.scaleY;
            const visualX = data.position[0] - (sW / 2);
            const visualY = data.position[1] - sH;
            char.setPosition(visualX, visualY);
        }

        if (data.visible !== undefined) char.setVisible(data.visible);
        if (data.opacity !== undefined) char.setAlpha(data.opacity);
        if (data.flip_x !== undefined) char.setFlipX(data.flip_x);
        if (data.flip_y !== undefined) char.setFlipY(data.flip_y);

        if (typeof data.layer === 'number') char.setDepth(data.layer);

        if (typeof data.scrollFactor === 'number') char.setScrollFactor(data.scrollFactor);
        else if (Array.isArray(data.scrollFactor)) char.setScrollFactor(data.scrollFactor[0], data.scrollFactor[1]);

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
