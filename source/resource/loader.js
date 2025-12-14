/**
 * loader.js
 * Carga secuencial de módulos para actualizar la UI de carga.
 */

// Lista de módulos a cargar con su nombre visible
const modulesToLoad = [
    { name: "Genesis API", path: "../funkin/API/genesis.js" },
    { name: "Phaser Core", path: "../core/phaser/game.js" },
    { name: "Editors", path: "../funkin/ui/editors/IDE.js" }
];

async function loadGameModules() {
    const textElement = document.getElementById('loader-text');

    try {
        // Recorremos la lista y cargamos uno por uno
        for (const mod of modulesToLoad) {
            if (textElement) {
                textElement.innerText = `Loading ${mod.name}...`;
            }

            await import(mod.path);

        }

        console.log("Todos los módulos cargados.");

        // 3. Finalizar carga
        const loader = document.getElementById('app-loader');
        if (loader) {
            if (textElement) textElement.innerText = "Ready!";

            // Transición de salida
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 500);
        }

    } catch (error) {
        console.error("Error cargando módulos:", error);
        if (textElement) {
            textElement.innerText = "Error Loading Game Assets";
            textElement.style.color = "red";
        }
    }
}

// Iniciar el proceso
loadGameModules();