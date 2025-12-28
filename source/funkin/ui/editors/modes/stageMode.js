/**
 * source/funkin/ui/editors/modes/stageMode.js
 */
import StageCharactersController from '../../editors/components/controllers/stageMode/StageCharactersController.js';
import StageTestMode from '../../editors/components/controllers/stageMode/StageTestMode.js';
import LoadStage from '../../editors/components/controllers/stageMode/LoadStage.js';
import StageImagesController from '../../editors/components/controllers/stageMode/StageImagesController.js';
import StageSpriteController from '../../editors/components/controllers/stageMode/StageSpriteController.js';

export default class StageMode {
    constructor(scene) {
        this.scene = scene;
        this.charactersController = null;
        this.testMode = null;

        // Datos cruciales para la persistencia
        this.currentStageData = null;
        this.currentTabId = null;

        // Controladores
        this.imagesController = new StageImagesController(scene);
        this.spriteController = new StageSpriteController(scene);

        // Cargador
        this.loadStage = new LoadStage(scene, this.imagesController, this.spriteController);

        // Bindings
        this.onTabSwitched = this.onTabSwitched.bind(this);
        this.onAllTabsClosed = this.onAllTabsClosed.bind(this);
        this.onSaveRequest = this.onSaveRequest.bind(this);
    }

    enable() {
        console.log('%c[StageMode] ENABLED', 'color: #4caf50; font-weight: bold;');

        if (!this.charactersController) {
            this.charactersController = new StageCharactersController(this.scene, this.scene.cameraManager);
            this.charactersController.init();
        } else {
            this.charactersController.setVisible(true);
        }

        if (this.imagesController) this.imagesController.setVisible(true);
        if (this.spriteController) this.spriteController.setVisible(true);

        if (!this.testMode) {
            this.testMode = new StageTestMode(this.scene, this.scene.cameraManager, this.charactersController);
        }

        // Eventos
        window.addEventListener('editor-tab-switched', this.onTabSwitched);
        window.addEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.addEventListener('editor-save-request', this.onSaveRequest);

        this.scene.events.on('update', this.update, this);
    }

    disable() {
        console.log('%c[StageMode] DISABLED', 'color: #ff0000ff; font-weight: bold;');

        if (this.charactersController) this.charactersController.setVisible(false);
        if (this.imagesController) this.imagesController.setVisible(false);
        if (this.spriteController) {
            this.spriteController.setVisible(false);
            this.spriteController.setGlobalPlayback(false);
        }

        if (this.testMode && this.testMode.isTesting) this.testMode.stopTest();

        window.removeEventListener('editor-tab-switched', this.onTabSwitched);
        window.removeEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.removeEventListener('editor-save-request', this.onSaveRequest);

        this.scene.events.off('update', this.update, this);
    }

    /**
     * Se ejecuta SOLICITADO POR EL TABBAR justo antes de cambiar de pestaña.
     */
    onSaveRequest(event) {
        const { tabId } = event.detail;

        // Solo respondemos si tenemos datos y si el ID coincide con lo que estamos editando
        // (O si simplemente guardamos lo que tenemos en pantalla en la tab que lo pide)
        if (this.currentStageData && this.currentTabId === tabId) {
            console.log(`[StageMode] Guardando estado para Tab: ${tabId}`);

            // 1. Reconstruir el JSON con lo que se ve en pantalla
            this._updateCurrentStageData();

            // 2. Enviar datos frescos al TabBar
            window.dispatchEvent(new CustomEvent('editor-update-tab-data', {
                detail: {
                    id: tabId,
                    data: JSON.parse(JSON.stringify(this.currentStageData)) // Clonar para romper referencias
                }
            }));
        }
    }

    _updateCurrentStageData() {
        if (!this.currentStageData) return;

        // Limpiamos la lista de objetos del JSON para reconstruirla
        const newObjectsList = [];

        // --- 1. Guardar IMÁGENES ---
        if (this.imagesController && this.imagesController.activeImages) {
            this.imagesController.activeImages.forEach(img => {
                if (!img.active) return; // Ignorar destruidos

                // Leemos las propiedades DIRECTAS del objeto Phaser (Lo que ves es lo que guardas)
                const savedObj = {
                    type: 'image',
                    namePath: img.getData('namePath') || 'unknown',
                    position: [Math.round(img.x), Math.round(img.y)],
                    // Si escala X e Y son iguales, guardar un número, si no, array
                    scale: (Math.abs(img.scaleX - img.scaleY) < 0.001) ? img.scaleX : [img.scaleX, img.scaleY],
                    scrollFactor: [img.scrollFactorX, img.scrollFactorY],
                    opacity: img.alpha,
                    angle: img.angle,
                    flip_x: img.flipX,
                    flip_y: img.flipY,
                    layer: img.depth
                };
                newObjectsList.push({ z: img.depth, data: savedObj });
            });
        }

        // --- 2. Guardar SPRITES ---
        if (this.spriteController && this.spriteController.activeSprites) {
            this.spriteController.activeSprites.forEach(spr => {
                if (!spr.active) return;

                // Recuperamos config base para no perder la playlist de animaciones
                const baseConfig = spr.getData('config') || {};

                const savedObj = {
                    type: 'spritesheet',
                    namePath: spr.getData('namePath') || baseConfig.namePath || 'unknown',
                    position: [Math.round(spr.x), Math.round(spr.y)],
                    scale: (Math.abs(spr.scaleX - spr.scaleY) < 0.001) ? spr.scaleX : [spr.scaleX, spr.scaleY],
                    scrollFactor: [spr.scrollFactorX, spr.scrollFactorY],
                    opacity: spr.alpha,
                    angle: spr.angle,
                    flip_x: spr.flipX,
                    flip_y: spr.flipY,
                    layer: spr.depth,
                    // Mantenemos la configuración de animación que se edita en el panel de propiedades
                    animation: baseConfig.animation || { play_list: {} }
                };
                newObjectsList.push({ z: spr.depth, data: savedObj });
            });
        }

        // Ordenar por Z (Depth) para que al cargar se pinten en orden correcto
        newObjectsList.sort((a, b) => a.z - b.z);

        // Asignar al JSON principal
        this.currentStageData.objects = newObjectsList.map(item => item.data);

        // Guardar también datos de cámara si hubieran cambiado (Opcional)
        if (this.scene.cameraManager) {
            this.currentStageData.defaultZoom = this.scene.cameraManager.defaultZoom;
        }
    }

    onTabSwitched(event) {
        const { stageData, fileName, tabId } = event.detail; // Asegúrate que TabBar envía tabId
        if (stageData) {
            console.log(`[StageMode] Cargando Stage: ${fileName} (ID: ${tabId})`);

            // Guardamos ID y clonamos datos para trabajar localmente
            this.currentTabId = tabId;
            this.currentStageData = JSON.parse(JSON.stringify(stageData));

            if (this.charactersController) this.charactersController.setVisible(true);
            if (this.imagesController) this.imagesController.setVisible(true);
            if (this.spriteController) this.spriteController.setVisible(true);

            // Cargar usando los datos recibidos
            this.loadStage.load(this.currentStageData, this.charactersController, fileName);

            if (this.spriteController) this.spriteController.setGlobalPlayback(false);
        }
    }

    onAllTabsClosed() {
        this.currentStageData = null;
        this.currentTabId = null;
        if (this.imagesController) this.imagesController.clear();
        if (this.spriteController) this.spriteController.clear();
        if (this.charactersController) this.charactersController.setVisible(false);
    }

    update(time, delta) {
        if (this.charactersController) this.charactersController.update(time, delta);

        if (this.testMode) {
            this.testMode.update(time, delta);
            if (this.spriteController) {
                if (this.testMode.isActive && !this.spriteController.isPlaying) {
                    this.spriteController.setGlobalPlayback(true);
                } else if (!this.testMode.isActive && this.spriteController.isPlaying) {
                    this.spriteController.setGlobalPlayback(false);
                }
                if (this.testMode.isActive) {
                    this.spriteController.beatHit(this.testMode.lastBeat);
                }
            }
        }
    }

    destroy() {
        if (this.testMode) { this.testMode.destroy(); this.testMode = null; }
        if (this.charactersController) { this.charactersController.destroy(); this.charactersController = null; }
        if (this.imagesController) { this.imagesController.clear(); this.imagesController = null; }
        if (this.spriteController) { this.spriteController.clear(); this.spriteController = null; }

        window.removeEventListener('editor-tab-switched', this.onTabSwitched);
        window.removeEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.removeEventListener('editor-save-request', this.onSaveRequest);

        this.scene.events.off('update', this.update, this);
    }
}