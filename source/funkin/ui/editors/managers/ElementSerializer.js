/**
 * source/funkin/ui/editors/managers/ElementSerializer.js
 * Módulo encargado de convertir elementos visuales a datos y viceversa.
 */

export function serializeElement(element) {
    if (!element) return null;

    const type = element.getData('type') || 'image';
    const namePath = element.getData('namePath');
    const config = element.getData('config') || {}; // Guardar configuración original (animaciones, etc.)

    // Detectar escala (Array o Número)
    let savedScale = element.scaleX;
    if (Math.abs(element.scaleX - element.scaleY) >= 0.001) {
        savedScale = [element.scaleX, element.scaleY];
    }

    const data = {
        type: type,
        x: element.x,
        y: element.y,
        textureKey: element.texture.key,
        frameName: element.frame ? element.frame.name : null,
        width: element.width,
        height: element.height,
        origin: { x: element.originX, y: element.originY },
        scale: savedScale,
        scrollFactor: { x: element.scrollFactorX, y: element.scrollFactorY },
        angle: element.angle,
        alpha: element.alpha,
        visible: element.visible,
        flipX: element.flipX,
        flipY: element.flipY,
        depth: element.depth,
        // Datos internos importantes
        data: {
            namePath: namePath,
            type: type,
            config: config
        }
    };

    return data;
}

export function createFromData(scene, data) {
    if (!data || !scene) return null;

    // Verificar si existe la textura
    if (!scene.textures.exists(data.textureKey)) {
        console.warn(`[ElementSerializer] Textura faltante: ${data.textureKey}`);
        return null;
    }

    let element = null;

    // Crear Sprite o Imagen según el tipo
    if (data.type === 'spritesheet' || data.type === 'Sprite') {
        element = scene.add.sprite(data.x, data.y, data.textureKey, data.frameName);
    } else {
        element = scene.add.image(data.x, data.y, data.textureKey, data.frameName);
    }

    // Restaurar Propiedades Físicas
    if (data.origin) element.setOrigin(data.origin.x, data.origin.y);

    if (data.scale) {
        if (Array.isArray(data.scale)) element.setScale(data.scale[0], data.scale[1]);
        else element.setScale(data.scale);
    }

    if (data.scrollFactor) element.setScrollFactor(data.scrollFactor.x, data.scrollFactor.y);
    if (data.angle !== undefined) element.setAngle(data.angle);
    if (data.alpha !== undefined) element.setAlpha(data.alpha);
    if (data.visible !== undefined) element.setVisible(data.visible);
    if (data.flipX !== undefined) element.setFlipX(data.flipX);
    if (data.flipY !== undefined) element.setFlipY(data.flipY);
    if (data.depth !== undefined) element.setDepth(data.depth);

    // Restaurar Data Manager (Metadata)
    if (data.data) {
        Object.keys(data.data).forEach(k => {
            element.setData(k, data.data[k]);
        });
    }

    // Asignar a la cámara del juego (para que no sea UI)
    if (scene.cameraManager) {
        scene.cameraManager.assignToGame(element);
    }

    return element;
}