import ImagesPreload from './images.js';
import SfxPreload from './sfx.js';
import SoundsPreload from './sounds.js';
import WindowsPreload from './windows.js';

export class GeneralPreload {
    /**
     * Carga todos los recursos del editor delegando en los submódulos.
     * @param {Phaser.Scene} scene La escena que realiza la carga.
     */
    static preload(scene) {
        ImagesPreload.preload(scene);
        SfxPreload.preload(scene);
        SoundsPreload.preload(scene);
        WindowsPreload.preload(scene);
    }
}