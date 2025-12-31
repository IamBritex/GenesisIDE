/**
 * source/funkin/ui/editors/modes/stageMode.js
 */
import StageCharactersController from '../../editors/components/controllers/stageMode/StageCharactersController.js';
import StageTestMode from '../../editors/components/controllers/stageMode/StageTestMode.js';
import LoadStage from '../../editors/components/controllers/stageMode/LoadStage.js';
import StageImagesController from '../../editors/components/controllers/stageMode/StageImagesController.js';
import StageSpriteController from '../../editors/components/controllers/stageMode/StageSpriteController.js';
import SaveTabs from '../../editors/components/UI/tabBar/saveTabs.js';

import ActionHistory from '../inputs/shortCuts/saveAllActions.js';
import ShortCuts from '../inputs/shortCuts/shortCuts.js';
import BoundingBoxConfig from '../../editors/components/controllers/stageMode/characters/BoundingBoxConfig.js';

// [NUEVO] Importar controles de edición
import EditControls from '../../editors/components/UI/tools/edit/controls.js';

export default class StageMode {
    constructor(scene) {
        this.scene = scene;
        this.charactersController = null;
        this.testMode = null;
        this.currentStageData = null;
        this.currentTabId = null;

        this.actionHistory = new ActionHistory(scene, null);
        this.shortCuts = new ShortCuts(scene, this.actionHistory);

        this.imagesController = new StageImagesController(scene, this.actionHistory);
        this.spriteController = new StageSpriteController(scene, this.actionHistory);
        this.boundingBoxes = new BoundingBoxConfig(scene, this.actionHistory);

        this.loadStage = new LoadStage(scene, this.imagesController, this.spriteController);

        // [NUEVO] Instanciar controles de edición (Copy/Paste)
        this.editControls = new EditControls(scene, this.actionHistory, {
            images: this.imagesController,
            sprites: this.spriteController,
            // characters: this.charactersController // Opcional si se implementa a futuro
        });

        this.onTabSwitched = this.onTabSwitched.bind(this);
        this.onAllTabsClosed = this.onAllTabsClosed.bind(this);
        this.onSaveRequest = this.onSaveRequest.bind(this);
        this._onToggleTestMode = this._onToggleTestMode.bind(this);

        this.wasTesting = false;
    }

    enable() {
        console.log('%c[StageMode] ENABLED', 'color: #4caf50; font-weight: bold;');

        if (this.scene.properties) {
            this.scene.properties.setActionHistory(this.actionHistory);
        }

        if (!this.charactersController) {
            this.charactersController = new StageCharactersController(this.scene, this.scene.cameraManager, this.actionHistory);
            this.charactersController.init();
        } else {
            this.charactersController.setVisible(true);
        }

        if (this.imagesController) this.imagesController.setVisible(true);
        if (this.spriteController) this.spriteController.setVisible(true);
        if (this.boundingBoxes) this.boundingBoxes.setVisible(true);

        if (!this.testMode) {
            this.testMode = new StageTestMode(this.scene, this.scene.cameraManager, this.charactersController);
        }

        window.addEventListener('editor-tab-switched', this.onTabSwitched);
        window.addEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.addEventListener('editor-save-request', this.onSaveRequest);
        window.addEventListener('editor-toggle-test-mode', this._onToggleTestMode);

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
        if (this.boundingBoxes) this.boundingBoxes.setVisible(false);

        if (this.testMode && this.testMode.isTesting) this.testMode.stopTest();

        window.removeEventListener('editor-tab-switched', this.onTabSwitched);
        window.removeEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.removeEventListener('editor-save-request', this.onSaveRequest);
        window.removeEventListener('editor-toggle-test-mode', this._onToggleTestMode);

        this.scene.events.off('update', this.update, this);
    }

    _onToggleTestMode() {
        if (this.testMode) {
            this.testMode.toggle();
        }
    }

    // ... (Resto de métodos: onSaveRequest, onTabSwitched, etc. se mantienen igual) ...
    onSaveRequest(event) {
        const { tabId } = event.detail;
        if (this.currentTabId === tabId) {
            const freshData = SaveTabs.capture(this);
            this.currentStageData = freshData;
            window.dispatchEvent(new CustomEvent('editor-update-tab-data', {
                detail: { id: tabId, data: JSON.parse(JSON.stringify(freshData)) }
            }));
        }
    }

    onTabSwitched(event) {
        const { stageData, fileName, tabId } = event.detail;
        if (this.currentTabId !== tabId) this.actionHistory.clear();
        this.currentTabId = tabId;
        this.currentStageData = stageData ? JSON.parse(JSON.stringify(stageData)) : { stage: [], defaultZoom: 1.05 };

        if (this.charactersController) this.charactersController.setVisible(true);
        if (this.imagesController) this.imagesController.setVisible(true);
        if (this.spriteController) this.spriteController.setVisible(true);

        this.loadStage.load(this.currentStageData, this.charactersController, fileName);

        if (this.spriteController) this.spriteController.setGlobalPlayback(false);
        if (this.currentStageData.defaultZoom && this.scene.cameraManager) {
            this.scene.cameraManager.gameCamera.setZoom(this.currentStageData.defaultZoom);
        }
    }

    onAllTabsClosed() {
        this.currentStageData = null;
        this.currentTabId = null;
        this.actionHistory.clear();
        if (this.imagesController) this.imagesController.clear();
        if (this.spriteController) this.spriteController.clear();
        if (this.charactersController) this.charactersController.setVisible(false);
    }

    update(time, delta) {
        if (this.charactersController) this.charactersController.update(time, delta);
        if (this.boundingBoxes) this.boundingBoxes.update();

        if (this.testMode) {
            const isTesting = this.testMode.isActive;

            if (isTesting && !this.wasTesting) {
                window.dispatchEvent(new CustomEvent('editor-test-start'));
            } else if (!isTesting && this.wasTesting) {
                window.dispatchEvent(new CustomEvent('editor-test-end'));
            }

            this.wasTesting = isTesting;
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
        if (this.editControls) { this.editControls.destroy(); this.editControls = null; } // Limpiar controles
        if (this.shortCuts) { this.shortCuts.destroy(); this.shortCuts = null; }
        if (this.actionHistory) { this.actionHistory.clear(); this.actionHistory = null; }
        if (this.boundingBoxes) { this.boundingBoxes.destroy(); this.boundingBoxes = null; }

        if (this.testMode) { this.testMode.destroy(); this.testMode = null; }
        if (this.charactersController) { this.charactersController.destroy(); this.charactersController = null; }
        if (this.imagesController) { this.imagesController.clear(); this.imagesController = null; }
        if (this.spriteController) { this.spriteController.clear(); this.spriteController = null; }

        window.removeEventListener('editor-tab-switched', this.onTabSwitched);
        window.removeEventListener('editor-all-tabs-closed', this.onAllTabsClosed);
        window.removeEventListener('editor-save-request', this.onSaveRequest);
        window.removeEventListener('editor-toggle-test-mode', this._onToggleTestMode);

        this.scene.events.off('update', this.update, this);
    }
}