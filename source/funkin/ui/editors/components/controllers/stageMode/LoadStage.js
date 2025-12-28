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

        // Aplanamos la estructura para extraer elementos dentro de Grupos
        const flattenedItems = this._flattenStageData(jsonContent.stage);

        console.log(`[LoadStage] Elementos encontrados (total): ${flattenedItems.length}`);

        // 1. Cargar Imágenes Estáticas
        if (this.imagesController) {
            this.imagesController.loadImages(stageName, flattenedItems);
        }

        // 2. Cargar Spritesheets Animados
        if (this.spriteController) {
            this.spriteController.loadSprites(stageName, flattenedItems);
        }

        // 3. Procesar Personajes
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
                const childrenFlat = this._flattenStageData(content.children);
                result = result.concat(childrenFlat);
            } else {
                const processedItem = { ...content };
                if (role) processedItem._role = role;
                result.push(processedItem);
            }
        });

        return result;
    }

    processCharacterData(data, charController) {
        const role = (data._role || '').toLowerCase();

        // GF
        if (role === 'playergf' || role === 'gf' || role === 'girlfriend') {
            const char = this.getCharacterReference('gf', charController);
            if (char) this.applyCharProperties(char, data, 'GF', charController, 'gfVersion');
        }
        // DAD / ENEMY
        else if (role === 'enemy' || role === 'dad' || role === 'opponent') {
            const char = this.getCharacterReference('dad', charController);
            if (char) this.applyCharProperties(char, data, 'DAD', charController, 'enemy');
        }
        // BF / PLAYER
        else if (role === 'player' || role === 'boyfriend' || role === 'bf') {
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

        // Escala
        if (typeof data.scale === 'number') char.setScale(data.scale);

        // [CORREGIDO] Cálculo de Posición (Anchor logic)
        // Ajustamos para que la coordenada X,Y sea el centro de los pies, no la esquina superior izquierda
        if (data.position && Array.isArray(data.position)) {
            const sW = char.width * char.scaleX;
            const sH = char.height * char.scaleY;

            // X: Centrado (Restamos la mitad del ancho)
            const visualX = data.position[0] - (sW / 2);
            // Y: Pies (Restamos la altura completa)
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

        // Propiedades de Cámara
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