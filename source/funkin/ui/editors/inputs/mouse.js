/**
 * source/funkin/ui/editors/inputs/mouse.js
 */


export default class MouseHandler {
    constructor(scene) {
        this.scene = scene
        this.isPanning = false
        this.init()
    }

    init() {
        this.scene.game.canvas.addEventListener(
            "mousedown",
            (e) => {
                if (e.button === 1) {
                    // Botón central
                    e.preventDefault()
                }
            },
            { passive: false },
        )

        this.scene.game.canvas.addEventListener("contextmenu", (e) => {
            e.preventDefault() // Prevenir menú contextual del click derecho
        })

        // 1. Sonidos de Click
        this.scene.input.on("pointerdown", (pointer) => {
            if (pointer.leftButtonDown()) {
                if (this.scene.sound.get("clickDown") || this.scene.cache.audio.exists("clickDown")) {
                    this.scene.sound.play("clickDown", { volume: 0.1 })
                }
            }
        })

        this.scene.input.on("pointerup", (pointer) => {
            if (!this.isPanning && pointer.leftButtonReleased()) {
                if (this.scene.sound.get("clickUp") || this.scene.cache.audio.exists("clickUp")) {
                    this.scene.sound.play("clickUp", { volume: 0.1 })
                }
            }
        })

        // 2. Panning (Rueda / Botón Central)
        this.scene.input.on("pointerdown", (pointer) => {
            if (pointer.middleButtonDown()) {
                this.isPanning = true
                this.scene.game.canvas.style.cursor = "grabbing"
            }
        })

        this.scene.input.on("pointermove", (pointer) => {
            if (!this.isPanning) return

            const cam = this.scene.cameras.main
            const dx = (pointer.position.x - pointer.prevPosition.x) / cam.zoom
            const dy = (pointer.position.y - pointer.prevPosition.y) / cam.zoom

            cam.scrollX -= dx
            cam.scrollY -= dy
        })

        this.scene.input.on("pointerup", (pointer) => {
            if (pointer.middleButtonReleased()) {
                this.stopPanning()
            }
        })

        // Seguridad
        this.scene.input.on("gameout", () => this.stopPanning())

        // 3. Zoom (Rueda del Mouse)
        this.scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const cam = this.scene.cameras.main
            const zoomSpeed = 0.1
            let newZoom = cam.zoom - (deltaY > 0 ? zoomSpeed : -zoomSpeed)
            newZoom = Phaser.Math.Clamp(newZoom, 0.1, 5)

            cam.setZoom(newZoom)
        })
    }

    stopPanning() {
        if (this.isPanning) {
            this.isPanning = false
            this.scene.game.canvas.style.cursor = "default"
        }
    }
}
