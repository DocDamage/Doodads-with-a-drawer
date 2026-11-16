// @editor-only
(function() {
    const W = DocsDoodads.Workspace, Q = DocsDoodads.Quest, U = DocsDoodads.Ui;
    Object.assign(W, {
        startQuest(replay = false) {
            const previous = U.prefs().quest;
            if (!replay && previous && previous.status !== 'active') return false;
            const mapId = this.currentMapId();
            const quest = !replay && previous ? previous : { status: 'active', mapId, baseline: DocsDoodads.doodads(mapId).length, completed: [], played: false, saved: false };
            U.setPref('quest', quest); U.setPref('welcomed', true); U.setPref('whatsNewSeen', DocsDoodads.WhatsNew.id);
            this.stopQuestUi(); this.updateQuest();
            if (this.mounted && U.prefs().quest.status === 'active') {
                this._questTimer = setInterval(() => this.updateQuest(), 500);
                if (this._questTimer && this._questTimer.unref) this._questTimer.unref();
            }
            return true;
        },
        resumeQuest() { const quest = U.prefs().quest; return quest && quest.status === 'active' ? this.startQuest() : false; },
        questState(quest) {
            const items = DocsDoodads.doodads(quest.mapId);
            const sameMap = Number(quest.mapId) === Number(this.currentMapId());
            return { placed: Math.max(0, items.length - quest.baseline), lights: items.filter(d => d && d.light && d.light.enabled).length,
                minutes: sameMap ? this.previewMinutes !== null && this.previewMinutes !== undefined ? this.previewMinutes : DocsDoodads.api.time() : null,
                played: quest.played, saved: quest.saved };
        },
        markQuest(key) {
            const quest = U.prefs().quest;
            if (!quest || quest.status !== 'active' || !['played', 'saved'].includes(key)) return;
            if (key === 'saved' && !quest.played) return;
            U.setPref('quest', Object.assign({}, quest, { [key]: true })); this.updateQuest();
        },
        updateQuest() {
            const quest = U.prefs().quest;
            if (!quest || quest.status !== 'active') { this.stopQuestUi(); return false; }
            const rows = Q.progress(this.questState(quest));
            const completed = Array.from(new Set((quest.completed || []).concat(rows.filter(step => step.done).map(step => step.id))));
            const next = Object.assign({}, quest, { completed, status: completed.length === Q.steps.length ? 'done' : 'active' });
            if (JSON.stringify(next) !== JSON.stringify(quest)) U.setPref('quest', next);
            if (next.status === 'done') { this.stopQuestUi(); this.showToast('First map complete! Replay the quest from How to Use whenever you like.', 'success'); return true; }
            if (this.mounted) this.renderQuest(next);
            return false;
        },
        pauseQuest(status) {
            const quest = U.prefs().quest;
            if (quest) U.setPref('quest', Object.assign({}, quest, { status: status === 'skipped' ? 'skipped' : 'paused' }));
            this.stopQuestUi();
        },
        stopQuestUi() {
            if (this._questTimer) clearInterval(this._questTimer);
            this._questTimer = null;
            if (typeof document !== 'undefined') for (const id of ['dd-first-map-quest', 'dd-quest-pointer']) {
                const node = document.getElementById(id); if (node && node.parentNode) node.parentNode.removeChild(node);
            }
            this._questDrawn = '';
        },
        renderQuest(quest) {
            const signature = JSON.stringify([quest.completed, this.currentMapId(), DocsDoodads.AssetIndex.list.length > 0]);
            if (signature === this._questDrawn && document.getElementById('dd-first-map-quest')) return;
            const old = document.getElementById('dd-first-map-quest'); if (old && old.parentNode) old.parentNode.removeChild(old);
            const previousPointer = document.getElementById('dd-quest-pointer'); if (previousPointer && previousPointer.parentNode) previousPointer.parentNode.removeChild(previousPointer);
            this._questDrawn = signature;
            const card = document.createElement('div'); card.id = 'dd-first-map-quest'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;right:18px;bottom:45px;z-index:10038;width:250px;max-width:calc(100vw - 36px);padding:12px;font-size:12px;';
            const done = new Set(quest.completed || []), next = Q.steps.find(step => !done.has(step.id));
            card.innerHTML = '<div class="dd-panel-head" data-dd-help="your-first-map"><b> Your first map</b></div>'
                + '<ol style="padding-left:22px;line-height:1.8;">' + Q.steps.map(step => '<li style="' + (done.has(step.id) ? 'color:var(--dd-muted);text-decoration:line-through;' : '') + '">' + (done.has(step.id) ? '✓ ' : '') + step.text + '</li>').join('') + '</ol>'
                + (Number(quest.mapId) !== Number(this.currentMapId()) ? '<p>Continue on map ' + Number(quest.mapId) + '.</p>' : '')
                + (!DocsDoodads.AssetIndex.list.length ? '<button class="dd-btn" id="dd-quest-samples">Add Sample Items</button>' : '')
                + '<div style="display:flex;gap:5px;margin-top:8px;"><button class="dd-btn" id="dd-quest-point">Show me</button><button class="dd-btn" id="dd-quest-pause">Not now</button><button class="dd-btn" id="dd-quest-skip">Skip</button></div>';
            (this.container || document.body).appendChild(card);
            const bind = (id, fn) => { const element = document.getElementById(id); if (element) element.onclick = fn; };
            bind('dd-quest-samples', async () => { await this.addSampleContent(); this._questDrawn = ''; this.updateQuest(); });
            bind('dd-quest-pause', () => this.pauseQuest('paused')); bind('dd-quest-skip', () => this.pauseQuest('skipped'));
            bind('dd-quest-point', () => {
                const oldPointer = document.getElementById('dd-quest-pointer'); if (oldPointer && oldPointer.parentNode) oldPointer.parentNode.removeChild(oldPointer);
                if (!next) return;
                if (next.id === 'night') {
                    this.selectedAsset = this.selectedEvent = this.selectedDoodad = null; this.selectedDoodads = [];
                    this.refreshInspector();
                }
                const pointer = document.createElement('div'); pointer.id = 'dd-quest-pointer'; pointer.className = 'dd-tour dd-glass';
                pointer.style.cssText = 'position:fixed;z-index:10039;width:250px;padding:10px;pointer-events:none;';
                const hints = {
                    place: 'Pick art in the Item Bag, choose Stamp and click the map three times.',
                    lamp: 'Pick a placed object. In Details, More → Light → Emit light makes it a lamp. Or stamp the Sample Lamp Post prefab.',
                    night: 'Drag the preview clock to 20:00 to see your lamps after dark.',
                    played: 'Right-click a free tile, then Play From Here. Reopen the editor to continue.',
                    saved: 'After trying the map, reopen the editor and press Save.'
                };
                pointer.textContent = hints[next.id] || next.text;
                (this.container || document.body).appendChild(pointer); this.placeTour(pointer, next.at);
            });
        }
    });
    const play = W.playFromHere;
    W.playFromHere = async function(x, y) { const ok = await play.call(this, x, y); if (ok) this.markQuest('played'); return ok; };
    for (const name of ['saveAll', 'saveMapOnly']) {
        const original = DocsDoodads.Persistence[name];
        DocsDoodads.Persistence[name] = function(...args) {
            const result = original.apply(this, args), quest = U.prefs().quest;
            const mapId = name === 'saveMapOnly' ? Number(args[0] || W.currentMapId()) : null;
            if (result === true && quest && (mapId === null || mapId === Number(quest.mapId))) W.markQuest('saved');
            return result;
        };
    }
})();
