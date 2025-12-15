export default class CharacterMode {
    constructor(scene) {
        this.scene = scene;
    }

    enable() {
        console.log('%c[CharacterMode] ENABLED', 'color: #4caf50; font-weight: bold;');
        // Aquí iría la lógica para activar gizmos de personaje
    }

    disable() {
        console.log('%c[CharacterMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');
    }
}