/**
 * source/funkin/ui/editors/components/Elements.js
 */
import { StageElements } from '../../../../play/stage/StageElements.js';
import { StageSpritesheet } from '../../../../play/stage/StageSpritesheet.js';
import { serializeElement, createFromData } from '../input/ElementSerializer.js';

import Selecting from './elements/Selecting.js';
import Dragging from './elements/Dragging.js';

export class ElementSelector {
    constructor(scene, cameraManager, actionHistory) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.actionHistory = actionHistory || null;

        this.selecting = new Selecting(scene, cameraManager);
        this.dragging = new Dragging(scene, this.selecting, actionHistory);

        this.stageElements = new StageElements(this.scene, 'editor', this.cameraManager);
        this.stageSpritesheet = new StageSpritesheet(this.scene, 'editor', this.cameraManager);

        this.registeredElements = [];

        this.ctrlKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL, false);
        this.deleteKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE, false);
        this.backspaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE, false);

        this.onElementRegistered = null;
        this.onElementUnregistered = null;
        this.onSelectionChanged = null;
        this.onElementUpdated = null;

        // Redireccionar callbacks de módulos
        this.selecting.onSelectionChanged = (el) => {
            if (this.onSelectionChanged) this.onSelectionChanged(el);
        };
        this.dragging.onElementUpdated = (el) => {
            // Sincronizar flash si se mueve por Drag
            if (this.selecting.currentFlash && this.selecting.currentFlash.active) {
                this.selecting.currentFlash.setPosition(el.x, el.y);
            }
            if (this.onElementUpdated) this.onElementUpdated(el);
        };
    }

    registerElement(element) {
        if (!element || this.registeredElements.includes(element)) return;

        if (!element.name) {
            element.setName(`element_${Date.now()}_${Math.random()}`);
        }

        if (element.type === 'Sprite' || element.type === 'Image') {
            element.setInteractive(this.scene.input.makePixelPerfect(1));
        } else {
            element.setInteractive();
        }

        this.registeredElements.push(element);

        element.on('pointerdown', (pointer, localX, localY, event) => {
            if (this.selecting.isSelectionLocked) return;
            if (!pointer.leftButtonDown()) return;

            event.stopPropagation();

            this.selecting.select(element);
            this.dragging.startDrag(element, pointer);
        });

        element.on('destroy', () => this.unregisterElement(element));

        if (this.onElementRegistered) {
            this.onElementRegistered(element);
        }
    }

    unregisterElement(element) {
        this.registeredElements = this.registeredElements.filter(el => el !== element);

        if (this.selecting.selectedElement === element) {
            this.selecting.clear(false);
        }

        if (this.onElementUnregistered) {
            this.onElementUnregistered(element);
        }
    }

    get selectedElement() { return this.selecting.selectedElement; }
    set isSelectionLocked(val) {
        this.selecting.isSelectionLocked = val;
        this.dragging.isLocked = val;
    }
    set enableBoundingBox(val) { this.selecting.enableBoundingBox = val; }

    update(cursors) {
        this.selecting.update();

        if (this.selecting.selectedElement && !this.dragging.isDragging) {
            if (cursors) {
                this.handleKeyboardMovement(cursors);
            }
        }
    }

    handleKeyboardMovement(cursors) {
        if (this.isSelectionLocked) return;

        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        let amount = 5;
        if (cursors.shift.isDown) amount = 1;
        else if (this.ctrlKey.isDown) amount = 10;

        const el = this.selecting.selectedElement;
        const oldPos = { x: el.x, y: el.y };
        let moved = false;

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) { el.y -= amount; moved = true; }
        else if (Phaser.Input.Keyboard.JustDown(cursors.down)) { el.y += amount; moved = true; }
        else if (Phaser.Input.Keyboard.JustDown(cursors.left)) { el.x -= amount; moved = true; }
        else if (Phaser.Input.Keyboard.JustDown(cursors.right)) { el.x += amount; moved = true; }

        if (moved) {
            this.scene.events.emit('element_updated', el);

            // [NUEVO] Sincronizar Flash al mover con teclado
            if (this.selecting.currentFlash && this.selecting.currentFlash.active) {
                this.selecting.currentFlash.setPosition(el.x, el.y);
            }

            if (this.onElementUpdated) this.onElementUpdated(el);

            if (this.actionHistory) {
                this.actionHistory.addAction({
                    type: 'move',
                    element: el,
                    oldPos: oldPos,
                    newPos: { x: el.x, y: el.y }
                });
            }
        }
    }

    handleDeletion() {
        if (this.isSelectionLocked) return;

        const deletePressed = Phaser.Input.Keyboard.JustDown(this.deleteKey);
        const backspacePressed = Phaser.Input.Keyboard.JustDown(this.backspaceKey);

        if (deletePressed || backspacePressed) {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            this.deleteSelectedElement();
        }
    }

    deleteSelectedElement() {
        const el = this.selecting.selectedElement;
        if (!el) return;

        const charName = el.getData('characterName');
        if (charName === 'Player (BF)' || charName === 'Opponent (Dad)' || charName === 'Girlfriend (GF)') {
            console.warn(`No se pueden eliminar los personajes base (${charName})`);
            return;
        }

        const elementData = serializeElement(el);

        if (this.actionHistory) {
            this.actionHistory.addAction({
                type: 'delete',
                elementData: elementData
            });
        }

        this.selecting.clear();
        el.destroy();

        console.log("Elemento eliminado:", elementData.data.characterName || elementData.type);
    }

    createImageElement(textureKey, x, y, namePath) {
        const data = {
            type: 'Image',
            x: x, y: y,
            textureKey: textureKey,
            origin: { x: 0.5, y: 1.0 },
            scale: { x: 1, y: 1 },
            visible: true,
            flipX: false, flipY: false,
            depth: (this.registeredElements.length || 1),
            scrollFactor: { x: 1, y: 1 },
            data: { characterName: namePath }
        };
        return createFromData(this.scene, data);
    }

    createSpritesheetElement(textureKey, x, y, namePath, fps = 24) {
        const data = {
            type: 'Sprite',
            x: x, y: y,
            textureKey: textureKey,
            origin: { x: 0.5, y: 1.0 },
            scale: { x: 1, y: 1 },
            visible: true,
            flipX: false, flipY: false,
            depth: (this.registeredElements.length || 1),
            scrollFactor: { x: 1, y: 1 },
            data: {
                characterName: namePath,
                animFrameRate: fps,
                animPlayMode: 'None',
                animPlayList: {},
                animOffsets: {}
            },
            currentFrame: null
        };
        return createFromData(this.scene, data);
    }

    shutdown() {
        this.selecting.destroy();
        this.dragging.destroy();

        if (this.stageElements) { this.stageElements.destroy(); this.stageElements = null; }
        if (this.stageSpritesheet) { this.stageSpritesheet.destroy(); this.stageSpritesheet = null; }

        this.registeredElements = [];
        this.onElementRegistered = null;
        this.onElementUnregistered = null;
        this.onSelectionChanged = null;
        this.onElementUpdated = null;
        this.actionHistory = null;
    }
}