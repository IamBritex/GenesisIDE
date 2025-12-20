/**
 * source/funkin/ui/editors/components/elements/Selecting.js
 * Módulo encargado de la selección visual y efectos de resaltado.
 */
export default class Selecting {
    constructor(scene, cameraManager) {
        this.scene = scene;
        this.cameraManager = cameraManager;

        this.selectedElement = null;
        this.selectionBox = this.scene.add.graphics();
        this.isBoxVisible = false;
        this.boxColor = 0xff0000;
        this.boxThickness = 2;
        this.enableBoundingBox = false;

        this.onSelectionChanged = null;
        this.isSelectionLocked = false;

        // Referencia al destello actual para poder moverlo
        this.currentFlash = null;

        // Configuración visual de la caja
        if (this.cameraManager) {
            this.cameraManager.assignToGame(this.selectionBox);
        }
        this.selectionBox.setDepth(9998);
    }

    /**
     * EFECTO DESTATICO (Flash)
     * Método estático utilitario.
     * Retorna el sprite del destello para que pueda ser manipulado (movido) externamente.
     */
    static flash(scene, element, cameraManager = null) {
        if (!element || !element.active) return null;

        let flashSprite = null;

        // Caso 1: Sprites / Imágenes
        if (element.type === 'Sprite' || element.type === 'Image') {
            if (!element.texture || element.texture.key === '__MISSING') {
                return null;
            }

            flashSprite = scene.add.sprite(
                element.x,
                element.y,
                element.texture,
                element.frame ? element.frame.name : null
            );

            flashSprite.setOrigin(element.originX, element.originY);
            flashSprite.setScale(element.scaleX, element.scaleY);
            flashSprite.setFlipX(element.flipX);
            flashSprite.setFlipY(element.flipY);
            flashSprite.setRotation(element.rotation);
            flashSprite.setScrollFactor(element.scrollFactorX, element.scrollFactorY);
            flashSprite.setDepth(element.depth + 1);
            flashSprite.setTintFill(0xFFFFFF);
            flashSprite.setAlpha(1);

            if (cameraManager) {
                cameraManager.assignToGame(flashSprite);
            }

            scene.tweens.add({
                targets: flashSprite,
                alpha: 0,
                duration: 600,
                ease: 'Cubic.out',
                onComplete: () => {
                    if (flashSprite && flashSprite.active) flashSprite.destroy();
                }
            });
        }
        // Caso 2: Rectángulos (Solo borde, no retorna sprite movible)
        else if (element.type === 'Rectangle' || element.setStrokeStyle) {
            const oldStroke = element.lineWidth || 0;
            const oldColor = element.strokeColor || 0xffffff;

            element.setStrokeStyle(4, 0xFFFFFF, 1.0);

            scene.time.delayedCall(200, () => {
                if (element.active) {
                    element.setStrokeStyle(oldStroke, oldColor);
                }
            });
        }

        return flashSprite;
    }

    select(element) {
        if (this.selectedElement === element) return;

        this.selectedElement = element;
        this.selectionBox.clear();

        // Limpiar referencia de flash anterior si existe
        if (this.currentFlash && this.currentFlash.active) {
            this.currentFlash.destroy();
            this.currentFlash = null;
        }

        // Crear nuevo flash y guardarlo
        if (element) {
            this.currentFlash = Selecting.flash(this.scene, element, this.cameraManager);
        }

        this.scene.events.emit('element_selected', element);

        if (this.onSelectionChanged) {
            this.onSelectionChanged(element);
        }
    }

    clear(triggerCallback = true) {
        if (this.selectedElement) {
            this.selectedElement = null;
            this.selectionBox.clear();
            this.currentFlash = null; // Limpiar referencia

            this.scene.events.emit('element_selected', null);

            if (triggerCallback && this.onSelectionChanged) {
                this.onSelectionChanged(null);
            }
        }
    }

    update() {
        // Sincronizar posición del flash con el elemento (para elementos genéricos)
        if (this.currentFlash && this.currentFlash.active && this.selectedElement && this.selectedElement.active) {
            this.currentFlash.setPosition(this.selectedElement.x, this.selectedElement.y);
        }

        if (!this.enableBoundingBox) {
            this.selectionBox.clear();
            return;
        }

        if (this.selectedElement && this.selectedElement.active) {
            this.drawSelectionBox();
        } else if (this.selectedElement) {
            this.clear(true);
        }
    }

    drawSelectionBox() {
        this.selectionBox.clear();

        if (!this.selectedElement) return;

        const bounds = this.selectedElement.getBounds();
        this.selectionBox.lineStyle(this.boxThickness, this.boxColor, 1);
        this.selectionBox.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    destroy() {
        this.selectionBox.destroy();
        this.selectedElement = null;
        this.currentFlash = null;
        this.onSelectionChanged = null;
    }
}