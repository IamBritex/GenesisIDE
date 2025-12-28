/**
 * source/funkin/ui/editors/components/controllers/stageMode/characters/CharacterSwapper.js
 * Módulo encargado de gestionar el intercambio de personajes (Snapshot -> Destroy -> Reload -> Restore).
 */
export default class CharacterSwapper {
    constructor(scene, controller) {
        this.scene = scene;
        this.controller = controller;
        this.isLoading = false;
    }

    /**
     * Realiza el cambio de personaje.
     * @param {string} slot - El slot a cambiar ('player', 'enemy', 'gfVersion').
     * @param {string} newCharId - El ID del nuevo personaje (ej: 'pico', 'tankman').
     */
    swap(slot, newCharId) {
        if (this.isLoading) return;

        // Referencias rápidas
        const charsEngine = this.controller.characters;
        const currentAssignments = this.controller.currentAssignments;

        // 1. Validación básica
        if (currentAssignments[slot] === newCharId) return;

        console.log(`[CharacterSwapper] Iniciando SWAP: ${slot} -> ${newCharId}`);
        this.isLoading = true;
        this.controller.isLoading = true; // Bloquear controller también

        // 2. SNAPSHOT: Guardar estado actual de TODOS los personajes
        // Necesitamos esto porque el motor regenerará todo el grupo.
        const snapshots = this._createSnapshots(charsEngine);

        // 3. ACTUALIZAR CONFIGURACIÓN
        // Actualizamos el registro en el controlador
        currentAssignments[slot] = newCharId;

        // Actualizamos el motor interno (Characters.js) para que sepa qué cargar ahora
        if (slot === 'player') charsEngine.player = newCharId;
        if (slot === 'enemy') charsEngine.enemy = newCharId;
        if (slot === 'gfVersion') charsEngine.gfVersion = newCharId;

        // 4. LIMPIEZA: Destruir sprites visuales viejos para evitar duplicados
        this._destroyOldSprites(charsEngine);

        // 5. RECARGA: Iniciar secuencia de carga de Phaser
        this._reloadAssets(charsEngine, snapshots, slot, newCharId);
    }

    _createSnapshots(engine) {
        const slotsMap = [
            { key: 'player', internal: 'bf' },
            { key: 'enemy', internal: 'dad' },
            { key: 'gfVersion', internal: 'gf' }
        ];

        const snaps = {};

        slotsMap.forEach(s => {
            const sprite = engine.characterElements ? engine.characterElements[s.internal] : null;
            if (sprite && sprite.active) {
                // Calcular "Ancla" (Pies) para mantener la posición en el suelo
                // sin importar si el nuevo sprite es más alto o bajo.
                const sW = sprite.width * sprite.scaleX;
                const sH = sprite.height * sprite.scaleY;

                snaps[s.key] = {
                    exists: true,
                    internalKey: s.internal,
                    x: sprite.x,
                    y: sprite.y,
                    // Punto central inferior (Pies)
                    anchorX: sprite.x + (sW / 2),
                    anchorY: sprite.y + sH,

                    scaleX: sprite.scaleX,
                    scaleY: sprite.scaleY,
                    depth: sprite.depth,
                    alpha: sprite.alpha,
                    flipX: sprite.flipX,
                    // Guardamos el asset que tenía este slot
                    assetId: sprite.getData('charAsset')
                };
            }
        });
        return snaps;
    }

    _destroyOldSprites(engine) {
        if (!engine.characterElements) return;
        ['bf', 'dad', 'gf'].forEach(key => {
            const sprite = engine.characterElements[key];
            if (sprite) sprite.destroy();
        });
        // Limpiamos la referencia en el motor para obligarlo a crear nuevos
        engine.characterElements = { bf: null, dad: null, gf: null };
    }

    _reloadAssets(engine, snapshots, changedSlotKey, newAssetId) {
        // A. Cargar JSONs
        engine.loadCharacterJSONs();

        this.scene.load.once('complete', () => {
            // B. Procesar Imágenes (PNG/XML)
            engine.processAndLoadImages();

            this.scene.load.once('complete', () => {
                // C. Crear Animaciones y Sprites
                engine.createAnimationsAndSprites();

                // D. Restaurar Estado (El paso mágico)
                this._restoreState(engine, snapshots, changedSlotKey, newAssetId);

                // Finalizar
                this.isLoading = false;
                this.controller.isLoading = false;
                console.log(`[CharacterSwapper] Swap completado.`);

            }, this);

            this.scene.load.start();
        }, this);

        this.scene.load.start();
    }

    _restoreState(engine, snapshots, changedSlotKey, newAssetId) {
        // Llamar a configuraciones base del controlador
        this.controller._setupEditorInteractions();
        this.controller._resetToStaticFrame();

        // Recorrer los snapshots para aplicar posiciones
        Object.keys(snapshots).forEach(slotKey => {
            const snap = snapshots[slotKey];
            if (!snap || !snap.exists) return;

            const newSprite = engine.characterElements[snap.internalKey];
            if (!newSprite) return;

            // Propiedades visuales base
            newSprite.setDepth(snap.depth);
            newSprite.setAlpha(snap.alpha);
            newSprite.setVisible(true);
            newSprite.setOrigin(0, 0); // Editor standard

            if (slotKey === changedSlotKey) {
                // --- ES EL PERSONAJE NUEVO ---
                // Usar escala nativa (1) por defecto para el nuevo personaje
                newSprite.setScale(1);

                // Calcular posición usando el Ancla del anterior (Pies)
                const nW = newSprite.width * newSprite.scaleX;
                const nH = newSprite.height * newSprite.scaleY;

                newSprite.x = snap.anchorX - (nW / 2);
                newSprite.y = snap.anchorY - nH;

                // Actualizar metadata
                newSprite.setData('charAsset', newAssetId);

                // Seleccionarlo automáticamente
                this.scene.events.emit('element_selected', newSprite);

            } else {
                // --- ES UN PERSONAJE VIEJO (NO CAMBIADO) ---
                // Restaurar exactamente como estaba
                newSprite.setScale(snap.scaleX, snap.scaleY);
                newSprite.x = snap.x;
                newSprite.y = snap.y;
                newSprite.setFlipX(snap.flipX);
                newSprite.setData('charAsset', snap.assetId);
            }

            // Guardar dimensiones estables para cálculos futuros
            const finalW = newSprite.width * newSprite.scaleX;
            const finalH = newSprite.height * newSprite.scaleY;
            newSprite.setData('stableWidth', finalW);
            newSprite.setData('stableHeight', finalH);
        });
    }
}