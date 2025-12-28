/**
 * source/funkin/ui/editors/components/UI/properties/stage/StageSpritesProperties.js
 */
import StageGeneralProperties from './StageGeneralProperties.js';
import { ModularWindow } from '../../../../utils/window/ModularWindow.js';

export default class StageSpritesProperties extends StageGeneralProperties {
    constructor(scene) {
        super(scene);
        this.selectedAnimKey = null;
    }

    bind(element) {
        // Hereda bindings generales (Transform/Visuals)
        super.bind(element);

        // Bindings de animaciones
        this._bindAnimInputs(element);
    }

    _bindAnimInputs(element) {
        const get = (id) => document.getElementById(id);
        const ui = {
            mode: get('anim_mode'), fps: get('anim_fps'), beats: get('anim_beats'),
            listContainer: get('anim_list_container'), btnAdd: get('btn_add_anim'),
            btnRemove: get('btn_remove_anim'), detailBox: get('anim_detail_container'),
            lblEditing: get('lbl_editing_anim'), key: get('curr_anim_key'),
            prefix: get('curr_anim_prefix'), indices: get('curr_anim_indices')
        };

        const saveAnimConfig = () => {
            const config = element.getData('config') || {};
            if (!config.animation) config.animation = { play_list: {} };
            config.animation.play_mode = ui.mode.value;
            config.animation.frameRate = parseInt(ui.fps.value) || 24;
            const beatStr = ui.beats.value || "1";
            config.animation.beat = beatStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

            // Usamos helper del padre para guardar
            element.setData('config', config);
            this.scene.events.emit('element_updated', element);
        };

        ui.mode.onchange = saveAnimConfig;
        ui.fps.oninput = saveAnimConfig;
        ui.beats.oninput = saveAnimConfig;

        this._renderListLogic(element, ui, saveAnimConfig);
    }

    _renderListLogic(element, ui, saveAnimConfig) {
        const getPlaylist = () => {
            const config = element.getData('config');
            return (config && config.animation && config.animation.play_list) ? config.animation.play_list : {};
        };
        const updateDetailView = () => {
            const key = this.selectedAnimKey;
            const playlist = getPlaylist();
            if (key && playlist[key]) {
                ui.detailBox.style.display = 'block';
                const data = playlist[key];
                if (ui.lblEditing) ui.lblEditing.textContent = key;
                ui.key.value = key;
                ui.prefix.value = data.prefix || '';
                ui.indices.value = (data.indices && Array.isArray(data.indices)) ? data.indices.join(', ') : '';
            } else ui.detailBox.style.display = 'none';
        };
        const renderList = () => {
            const playlist = getPlaylist();
            const keys = Object.keys(playlist);
            ui.listContainer.innerHTML = '';
            if (keys.length === 0) ui.listContainer.innerHTML = '<div style="font-style:italic; opacity:0.5; text-align:center; padding:10px;">No animations</div>';
            keys.forEach(key => {
                const card = document.createElement('div');
                card.className = 'anim-card';
                if (key === this.selectedAnimKey) card.classList.add('active');
                card.innerHTML = `<span>${key}</span><span class="material-icons anim-icon">movie</span>`;
                card.onclick = () => { this.selectedAnimKey = key; renderList(); updateDetailView(); };
                ui.listContainer.appendChild(card);
            });
            updateDetailView();
        };

        ui.btnAdd.onclick = () => { this.openAddAnimationModal(element, () => renderList()); };
        ui.btnRemove.onclick = () => {
            if (this.selectedAnimKey) {
                this.openDeleteAnimationModal(this.selectedAnimKey, () => {
                    const pl = getPlaylist(); delete pl[this.selectedAnimKey]; saveAnimConfig(); this.selectedAnimKey = null; renderList();
                });
            }
        };
        renderList();
    }

    openDeleteAnimationModal(animKey, onConfirm) {
        const htmlContent = this.scene.cache.text.get('windowStageAnimationsHtml');
        if (!htmlContent) return;
        const win = new ModularWindow(this.scene, { content: htmlContent, title: "Delete Animation", width: 350, height: 250, minimizable: false });
        if (window.initStageAnimModal) window.initStageAnimModal({ mode: 'delete', animKey: animKey, onConfirm: () => { win.close(); if (onConfirm) onConfirm(); }, onCancel: () => win.close() });
        else win.close();
    }

    openAddAnimationModal(element, onComplete) {
        const htmlContent = this.scene.cache.text.get('windowStageAnimationsHtml');
        if (!htmlContent) return;
        const win = new ModularWindow(this.scene, { content: htmlContent });

        // Copia de la lógica de texturas de versiones anteriores
        const textureKey = element.texture.key;
        const frames = this.scene.textures.get(textureKey).getFrameNames();
        const groups = {};
        frames.forEach(frameName => {
            if (frameName === '__BASE') return;
            const match = frameName.match(/^(.*?)(\d+)$/);
            let prefix = match ? match[1].trim() : frameName;
            let suffix = match ? match[2] : "";
            if (suffix.length > 2) {
                const cutPoint = suffix.length - 2;
                prefix += suffix.substring(0, cutPoint);
                suffix = suffix.substring(cutPoint);
            }
            if (!groups[prefix]) groups[prefix] = { firstFrame: frameName, indices: [] };
            if (suffix) groups[prefix].indices.push(suffix);
        });

        const animData = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        Object.keys(groups).forEach(rawPrefix => {
            const group = groups[rawPrefix];
            const frame = this.scene.textures.getFrame(textureKey, group.firstFrame);
            let thumbData = null;
            if (frame) {
                const w = frame.cutWidth || frame.width;
                const h = frame.cutHeight || frame.height;
                if (w > 0 && h > 0) { canvas.width = w; canvas.height = h; ctx.clearRect(0, 0, w, h); ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, w, h, 0, 0, w, h); thumbData = canvas.toDataURL(); }
            }
            group.indices.sort((a, b) => parseInt(a) - parseInt(b));
            animData.push({ displayName: rawPrefix + "00", rawPrefix: rawPrefix, thumb: thumbData, allIndices: group.indices });
        });

        const playlist = (element.getData('config') || {}).animation?.play_list || {};
        if (window.initStageAnimModal) {
            window.initStageAnimModal({
                mode: 'select', animData: animData, existingKeys: Object.keys(playlist),
                onAccept: (data) => {
                    const config = element.getData('config') || {};
                    if (!config.animation) config.animation = { play_list: {} };
                    if (!config.animation.play_list) config.animation.play_list = {};
                    config.animation.play_list[data.key] = { prefix: data.prefix, indices: data.indices };
                    element.setData('config', config);
                    this.scene.events.emit('element_updated', element);
                    this.selectedAnimKey = data.key;
                    win.close();
                    if (onComplete) onComplete();
                },
                onCancel: () => win.close()
            });
        } else win.close();
    }

    updateValues(element) {
        super.updateValues(element);
        const elType = document.getElementById('propType');
        if (elType) elType.value = element.getData('namePath') || '';

        const config = element.getData('config') || {};
        if (config.animation) {
            const get = (id) => document.getElementById(id);
            const setVal = (id, v) => { const e = get(id); if (e) e.value = v; };
            setVal('anim_mode', config.animation.play_mode || 'Loop');
            setVal('anim_fps', config.animation.frameRate || 24);
            setVal('anim_beats', (config.animation.beat && Array.isArray(config.animation.beat)) ? config.animation.beat.join(', ') : '1');
        }
    }
}