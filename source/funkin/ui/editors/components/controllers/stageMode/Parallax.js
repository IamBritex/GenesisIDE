/**
 * source/funkin/ui/editors/components/controllers/stageMode/Parallax.js
 * Controlador encargado de gestionar el comportamiento de scroll (Parallax) de los elementos.
 */
export default class Parallax {
    /**
     * @param {Phaser.Scene} scene - La escena del editor.
     */
    constructor(scene) {
        this.scene = scene;
        this.isActive = true;

        this._setupListeners();
    }

    _setupListeners() {
        // Escuchar cuando cualquier elemento es modificado (por Properties.js o Dragging)
        this.scene.events.on('element_updated', this.updateElementParallax, this);
    }

    /**
     * Se ejecuta cada vez que un elemento cambia.
     * Asegura que el ScrollFactor visual coincida con los datos lógicos.
     * @param {Phaser.GameObjects.GameObject} element 
     */
    updateElementParallax(element) {
        if (!this.isActive || !element || !element.active) return;

        // Verificar si el objeto soporta ScrollFactor
        if (typeof element.setScrollFactor !== 'function') return;

        // 1. Obtener valores actuales (ya sea modificados por UI o Drag)
        const sx = element.scrollFactorX;
        const sy = element.scrollFactorY;

        // 2. Persistencia: Guardar en 'data' para que al exportar el JSON se conserven
        // (El serializador usará estos datos)
        element.setData('scrollFactorX', sx);
        element.setData('scrollFactorY', sy);

        // 3. (Opcional) Lógica avanzada de Parallax Automático
        // Si quisieras que el parallax dependiera de la profundidad (Z), aquí iría esa fórmula.
        // Por ahora, respetamos la configuración manual del usuario.

        // Reforzar la aplicación (útil si hubo cambios de cámara)
        element.setScrollFactor(sx, sy);
    }

    destroy() {
        this.scene.events.off('element_updated', this.updateElementParallax, this);
        this.isActive = false;
    }
}