export default class ChartMode {
    constructor(scene) {
        this.scene = scene;
    }

    enable() {
        console.log('%c[ChartMode] ENABLED', 'color: #4caf50; font-weight: bold;');
        // Aquí iría la lógica para mostrar la grilla de notas
    }

    disable() {
        console.log('%c[ChartMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');
    }
}