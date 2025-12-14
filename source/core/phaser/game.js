import { touchHere } from "../touchHere.js";

// Configuración principal del juego
const gameConfig = {
    type: Phaser.AUTO,
    // Resolución nativa del juego
    width: 1280,
    height: 720,

    parent: "game-container",

    dom: {
        createContainer: true
    },

    scene: [touchHere],

    backgroundColor: "#000000",

    // --- MODO FIT ACTIVADO ---
    scale: {
        mode: Phaser.Scale.FIT,          // Ajustar al contenedor sin deformar
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centrar automáticamente
        expandParent: true,              // Llenar el div padre
        fullscreenTarget: "game-container",
    },

    autoFocus: true,
    disableContextMenu: true,
};

// Iniciar el juego
window.game = new Phaser.Game(gameConfig);
