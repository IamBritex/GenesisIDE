export class CameraBoxVisualizer {
    constructor(scene, controller) {
        this.scene = scene;
        this.controller = controller;

        this.baseResolution = { width: 1280, height: 720 };

        this.bfBox = this._createBox(0x00ff00, 0.2);
        this.dadBox = this._createBox(0xff0000, 0.2);
        this.gfBox = this._createBox(0xffff00, 0.2);

        this.group = this.scene.add.group([this.bfBox, this.dadBox, this.gfBox]);

        if (this.scene.cameraManager) {
            this.scene.cameraManager.assignToGame(this.bfBox);
            this.scene.cameraManager.assignToGame(this.dadBox);
            this.scene.cameraManager.assignToGame(this.gfBox);
        }

        this.group.setDepth(9996);
        this.isVisible = false;
    }

    _createBox(color, alpha) {
        const rect = this.scene.add.rectangle(0, 0, this.baseResolution.width, this.baseResolution.height);
        rect.setOrigin(0.5, 0.5);
        rect.setFillStyle(color, alpha);
        rect.setStrokeStyle(2, color, 0.8);
        rect.setVisible(false);
        return rect;
    }

    update() {
        if (!this.isVisible || !this.controller.characters || !this.controller.characters.characterElements) return;

        const { bf, dad, gf } = this.controller.characters.characterElements;

        this._updateBox(this.bfBox, bf, 'player');
        this._updateBox(this.dadBox, dad, 'enemy');
        this._updateBox(this.gfBox, gf, 'gfVersion');
    }

    _updateBox(box, sprite, charKey) {
        if (!sprite || !sprite.active || !sprite.visible) {
            box.setVisible(false);
            return;
        }

        box.setVisible(true);
        const offsets = this.controller.getCameraOffsets(charKey);

        // --- LÓGICA DE POSICIÓN ESTÁTICA ---
        // El objetivo es calcular dónde estaría el sprite si estuviera en su pose base (idle),
        // ignorando los desplazamientos temporales de las animaciones (singLeft, etc).

        // 1. Recuperar dimensiones estables (Idle) calculadas al inicio
        const stableWidth = sprite.getData('stableWidth') || (sprite.width * sprite.scaleX);
        const stableHeight = sprite.getData('stableHeight') || (sprite.height * sprite.scaleY);

        // 2. Determinar el Offset de la animación ACTUAL
        let currentAnimOffset = [0, 0];
        const offsetsMap = sprite.getData('offsets');

        if (offsetsMap && sprite.anims && sprite.anims.currentAnim) {
            // El key de la animación suele ser "textureKey_animName". 
            // Intentamos limpiar el prefijo para buscar en el mapa.
            const textureKey = sprite.getData('textureKey') || '';
            const fullAnimKey = sprite.anims.currentAnim.key;

            // Opción A: Buscar por coincidencia exacta si el mapa tiene keys completos (raro)
            if (offsetsMap.has(fullAnimKey)) {
                currentAnimOffset = offsetsMap.get(fullAnimKey);
            }
            // Opción B: Quitar prefijo (más común en FNF data logic)
            else if (textureKey && fullAnimKey.startsWith(textureKey + '_')) {
                const animName = fullAnimKey.replace(textureKey + '_', '');
                currentAnimOffset = offsetsMap.get(animName) || [0, 0];
            }
        }

        // 3. Calcular la Posición "Base" (Lógica)
        // Sprite.X = BaseX + (Offset * Scale)
        // Por tanto: BaseX = Sprite.X - (Offset * Scale)
        const logicalX = sprite.x - (currentAnimOffset[0] * sprite.scaleX);
        const logicalY = sprite.y - (currentAnimOffset[1] * sprite.scaleY);

        // 4. Calcular el Centro "Estable"
        // Usamos la posición lógica + la mitad de las dimensiones estables
        const centerX = logicalX + (stableWidth / 2);
        const centerY = logicalY + (stableHeight / 2);

        // 5. Aplicar
        box.x = centerX + offsets.x;
        box.y = centerY + offsets.y;
    }

    setVisible(visible) {
        this.isVisible = visible;
        if (!visible) {
            this.bfBox.setVisible(false);
            this.dadBox.setVisible(false);
            this.gfBox.setVisible(false);
        }
    }

    destroy() {
        this.group.destroy(true);
    }
}