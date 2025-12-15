export default class StageMode {
    constructor(scene) {
        this.scene = scene;
    }

    enable() {
        console.log('%c[StageMode] ENABLED', 'color: #4caf50; font-weight: bold;');
        // Aquí iría la lógica para mostrar gizmos de stage, cargar fondo, etc.
    }

    disable() {
        console.log('%c[StageMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');
    }
}