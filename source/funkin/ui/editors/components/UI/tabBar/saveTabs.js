/**
 * source/funkin/ui/editors/components/UI/tabBar/saveTabs.js
 * Sistema centralizado para capturar el estado actual del editor (Snapshot).
 */
export default class SaveTabs {
    /**
     * Captura el estado actual de todos los elementos del StageMode.
     * @param {import('../../../../modes/stageMode.js').default} stageMode - Instancia del modo editor.
     * @returns {Object} Objeto JSON con la estructura { stage: [...], defaultZoom: number }
     */
    static capture(stageMode) {
        if (!stageMode) {
            console.error('[SaveTabs] No se proporcionó una instancia válida de StageMode.');
            return null;
        }

        console.log('[SaveTabs] Iniciando captura de estado detallada...');

        const combinedList = [];

        // Helper para procesar escala de forma precisa
        const getScale = (obj) => {
            const sx = obj.scaleX;
            const sy = obj.scaleY;
            // Si la diferencia es mínima, guardamos un número. Si es notable, un array.
            if (Math.abs(sx - sy) < 0.001) return sx;
            return [sx, sy];
        };

        // --- 1. Capturar IMÁGENES ---
        if (stageMode.imagesController && stageMode.imagesController.activeSprites) {
            stageMode.imagesController.activeSprites.forEach(img => {
                if (!img.active) return;

                const textureName = img.getData('namePath') || img.getData('imagePath');
                if (!textureName || textureName === 'unknown') return;

                const savedObj = {
                    type: 'image',
                    namePath: textureName,
                    position: [Math.round(img.x), Math.round(img.y)],
                    origin: [img.originX, img.originY],
                    scale: getScale(img),
                    scrollFactor: [img.scrollFactorX, img.scrollFactorY],
                    opacity: img.alpha,
                    angle: img.angle,
                    flip_x: img.flipX,
                    flip_y: img.flipY,
                    layer: img.depth,
                    visible: img.visible,
                    color: img.tintTopLeft !== 0xffffff ? img.tintTopLeft : undefined // Soporte futuro para tint
                };

                combinedList.push({ z: img.depth, data: savedObj });
            });
        }

        // --- 2. Capturar SPRITES (Spritesheets) ---
        if (stageMode.spriteController && stageMode.spriteController.activeSprites) {
            stageMode.spriteController.activeSprites.forEach(spr => {
                if (!spr.active) return;
                const baseConfig = spr.getData('config') || {};
                const spriteName = spr.getData('namePath') || baseConfig.namePath;

                if (!spriteName) return;

                const savedObj = {
                    type: 'spritesheet',
                    namePath: spriteName,
                    position: [Math.round(spr.x), Math.round(spr.y)],
                    origin: [spr.originX, spr.originY],
                    scale: getScale(spr),
                    scrollFactor: [spr.scrollFactorX, spr.scrollFactorY],
                    opacity: spr.alpha,
                    angle: spr.angle,
                    flip_x: spr.flipX,
                    flip_y: spr.flipY,
                    layer: spr.depth,
                    visible: spr.visible,
                    animation: baseConfig.animation || { play_list: {}, play_mode: 'Loop', frameRate: 24 }
                };

                combinedList.push({ z: spr.depth, data: savedObj });
            });
        }

        // --- 3. Capturar PERSONAJES ---
        // Delegamos al controlador, pero nos aseguramos que él use la lógica correcta de escala
        if (stageMode.charactersController) {
            if (typeof stageMode.charactersController.getDataForSave === 'function') {
                const charData = stageMode.charactersController.getDataForSave();
                if (charData && Array.isArray(charData)) {
                    combinedList.push(...charData);
                }
            }
        }

        // --- 4. ORDENAR POR CAPAS (Z) ---
        combinedList.sort((a, b) => a.z - b.z);

        // --- 5. Construir JSON Final ---
        const finalJSON = {
            stage: combinedList.map(item => item.data),
            defaultZoom: 1.05
        };

        if (stageMode.scene && stageMode.scene.cameraManager) {
            finalJSON.defaultZoom = stageMode.scene.cameraManager.gameCamera.zoom;
        }

        return finalJSON;
    }
}