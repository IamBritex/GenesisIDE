/**
 * source/funkin/ui/editors/components/UI/tools/view/zoom.js
 * Lógica de control para el Zoom del Editor.
 */
export default class ZoomTool {
    constructor(scene) {
        this.scene = scene;
        this.step = 0.25;

        // Vincular contexto para no perder 'this'
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.reset = this.reset.bind(this);

        this._bindEvents();
        console.log('[ZoomTool] Herramienta de Zoom Inicializada');
    }

    _bindEvents() {
        window.addEventListener('editor-zoom-in', this.zoomIn);
        window.addEventListener('editor-zoom-out', this.zoomOut);
        window.addEventListener('editor-zoom-reset', this.reset);
    }

    zoomIn() {
        console.log('[ZoomTool] Zoom In solicitado');
        this._modifyZoom(this.step);
    }

    zoomOut() {
        console.log('[ZoomTool] Zoom Out solicitado');
        this._modifyZoom(-this.step);
    }

    reset() {
        console.log('[ZoomTool] Reset Zoom solicitado');
        const cam = this.scene.cameras.main;
        if (cam) {
            cam.setZoom(1);
            cam.centerOn(0, 0);
        }
    }

    _modifyZoom(amount) {
        const cam = this.scene.cameras.main;
        if (!cam) return;

        let newZoom = cam.zoom + amount;
        // Limitar entre 0.1x y 10x
        if (newZoom < 0.1) newZoom = 0.1;
        if (newZoom > 10) newZoom = 10;

        cam.setZoom(newZoom);
    }

    destroy() {
        window.removeEventListener('editor-zoom-in', this.zoomIn);
        window.removeEventListener('editor-zoom-out', this.zoomOut);
        window.removeEventListener('editor-zoom-reset', this.reset);
    }
}