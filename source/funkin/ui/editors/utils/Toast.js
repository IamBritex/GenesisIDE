/**
 * source/funkin/ui/editors/utils/Toast.js
 */
export class ToastManager {
    constructor(scene) {
        this.scene = scene;
        this.domContainer = null;
        this.toastContainer = null;
        this.template = null;

        this._init();
    }

    _init() {
        // 1. Obtener HTML del Cache
        const content = this.scene.cache.text.get('toastHtml');
        if (!content) {
            console.warn('[ToastManager] "toastHtml" no está cargado.');
            return;
        }

        // 2. Crear contenedor invisible para parsear estilos y template
        this.domContainer = document.createElement('div');
        this.domContainer.innerHTML = content;
        document.body.appendChild(this.domContainer);

        // 3. Extraer template
        const tempElement = this.domContainer.querySelector('#toast-template .toast-notification');
        if (tempElement) {
            this.template = tempElement;
        }

        // 4. Crear contenedor real para los Toasts en pantalla
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Muestra una notificación.
     * @param {string} title - Título de la alerta.
     * @param {string} message - Mensaje descriptivo.
     * @param {string} [type='info'] - Tipo: 'info', 'success', 'error'.
     * @param {number} [duration=3000] - Duración en ms.
     */
    show(title, message, type = 'info', duration = 3000) {
        if (!this.template || !this.toastContainer) return;

        // Clonar template
        const toast = this.template.cloneNode(true);

        // Rellenar datos
        const titleEl = toast.querySelector('.toast-title');
        const bodyEl = toast.querySelector('.toast-body');

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = message;

        // Aplicar tipo
        toast.classList.add(type);

        // Añadir al DOM
        this.toastContainer.appendChild(toast);

        // Forzar reflow para activar transición CSS
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Programar cierre
        setTimeout(() => {
            this._close(toast);
        }, duration);
    }

    _close(toast) {
        if (!toast) return;
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Esperar a que termine la transición CSS (0.3s)
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 350);
    }

    destroy() {
        if (this.domContainer) this.domContainer.remove();
        if (this.toastContainer) this.toastContainer.remove();
    }
}