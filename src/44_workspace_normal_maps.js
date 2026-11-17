// @editor-only
//==========================================================
// SECTION 25C: NORMAL-MAP SETTINGS AND GENERATOR
//==========================================================
(function() {
    const D = DocsDoodads, W = D.Workspace, N = D.NormalLight;

    W.extraWorldSections = W.extraWorldSections || [];
    if (!W.extraWorldSections.some(section => section.title === 'Normal Maps')) {
        W.extraWorldSections.push({ title: 'Normal Maps', fields: [
            { key: 'normalLight.enabled', label: 'Shade doodads and characters by their shape (flat maps)', type: 'checkbox' },
            { key: 'normalLight.maxLights', label: 'Nearby lights per picture', type: 'range', min: 1, max: 8, step: 1 },
            { key: 'normalLight.characters', label: 'Normal maps for characters', type: 'select', options: [
                { value: 'file', label: 'Only with an _n.png file' }, { value: 'made', label: 'Made for me' }
            ] }
        ] });
    }

    // Details → Shading: the three choices of 8.3.1. Unset means Made for me at Strength 1, Rounded.
    const sections = W.effectSections, defaults = W.propertyDefaults, apply = W.applyDoodadProperty;
    W.effectSections = function() {
        return sections.call(this).concat([{ title: 'Shading', fields: [
            { key: 'shade.mode', label: 'Shading by shape (flat maps, when Normal Maps are on)', type: 'select', options: [
                { value: 'made', label: 'Made for me' }, { value: 'file', label: 'From file (_n.png)' }, { value: 'off', label: 'Off' }
            ] },
            { key: 'shade.strength', label: 'Strength', type: 'range', min: 0.25, max: 4, step: 0.25 },
            { key: 'shade.shape', label: 'Shape', type: 'select', options: [{ value: 'round', label: 'Rounded' }, { value: 'flat', label: 'Flat' }] }
        ] }]);
    };
    W.propertyDefaults = function() { return Object.assign({}, defaults.call(this), { shade: Object.assign({}, N.shadeDefaults) }); };
    W.applyDoodadProperty = function(item, key, value) {
        const result = apply.call(this, item, key, value);
        if (item && String(key).indexOf('shade.') === 0 && item.shade) {
            const s = N.shade(item.shade), d = N.shadeDefaults;
            if (s.mode === d.mode && s.strength === d.strength && s.shape === d.shape) delete item.shade;
            else item.shade = s;
        }
        return result;
    };

    Object.assign(W, {
        normalGenJobs: [],
        normalGenKeys: new Set(),
        normalGenFailed: new Set(),
        normalGenChecked: new Set(),
        normalGenBusy: false,
        normalGenPromise: null,

        normalGenAllowed() {
            const settings = D.World.settings().normalLight || {};
            return Boolean(D.Compat.isTest() && D.FS.fs && D.FS.path && settings.enabled);
        },

        // The made map's name carries the picture's size and time, so an edited picture gets a new map.
        normalGenTarget(key, source) {
            const F = D.FS, stat = F.fs.statSync(F.path.resolve(source));
            const hash = require('crypto').createHash('sha1').update(`${key}|${stat.size}|${Math.round(stat.mtimeMs)}`).digest('hex').slice(0, 24);
            return `${N.generatedDir}/${hash}_n.png`;
        },

        queueNormalGen(request) {
            if (!request || !request.key || !request.source || this.normalGenKeys.has(request.key) || this.normalGenFailed.has(request.key)) return false;
            if (!this.normalGenAllowed()) return false;
            this.normalGenKeys.add(request.key);
            this.normalGenJobs.push(request);
            this.runNormalGen();
            return true;
        },

        // One job at a time, sliced over frames, with a progress pill only when it takes a while.
        runNormalGen(options = {}) {
            if (this.normalGenBusy) return this.normalGenPromise;
            this.normalGenBusy = true;
            const progress = D.Ui && typeof D.Ui.progress === 'function' ? D.Ui.progress('Making normal maps', { delay: 600 }) : null;
            this.normalGenPromise = (async () => {
                let done = 0;
                try {
                    while (this.normalGenJobs.length) {
                        const job = this.normalGenJobs.shift();
                        if (progress) progress.update(done, done + this.normalGenJobs.length + 1, String(job.source).split('/').pop());
                        const made = await this.makeGeneratedNormal(job, options);
                        if (!made) this.normalGenFailed.add(job.key);
                        this.normalGenKeys.delete(job.key);
                        done++;
                    }
                } finally {
                    this.normalGenBusy = false;
                    if (progress) progress.finish();
                }
                return done;
            })();
            return this.normalGenPromise;
        },

        async makeGeneratedNormal(job, options = {}) {
            const F = D.FS;
            try {
                const source = N.cleanPath(job.source);
                if (!source || !F.fs || !F.path) throw new Error('Normal maps can only be made in a playtest.');
                const target = this.normalGenTarget(job.key, source);
                if (!F.existsSync(target)) {
                    const loader = options.loader || (path => this.loadPixels(D.LiveReload ? D.LiveReload.urlFor(path) : path));
                    const picture = await loader(source);
                    const steps = D.NormalGen.job(picture.data, picture.width, picture.height, { shape: job.shape, strength: job.strength, grid: job.grid });
                    const budget = Math.max(1, Number(options.budget) || 8);
                    let started = Date.now(), step = steps.next();
                    while (!step.done) {
                        if (Date.now() - started > budget) { await new Promise(resolve => setTimeout(resolve, 0)); started = Date.now(); }
                        step = steps.next();
                    }
                    const zlib = require('zlib'), rgba = step.value;
                    const bytes = D.AsepriteSheets.encodePng(picture.width, picture.height, new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.length), data => zlib.deflateSync(data));
                    F.mkdirp(N.generatedDir);
                    F.atomicWriteFile(target, Buffer.from(bytes));
                }
                this.recordGeneratedNormal(job.key, target);
                return target;
            } catch (error) {
                D.Core.log(`Normal map for ${job.source} could not be made: ${error.message || error}`);
                return null;
            }
        },

        // The manifest keeps hand-made companions from the index and adds the made map; a replaced map's
        // file is removed once nothing names it.
        recordGeneratedNormal(key, target) {
            const F = D.FS, onDisk = F.readJson(N.manifestPath);
            const generated = Object.assign({}, N.cleanGenerated(N.manifest.generated), N.cleanGenerated(onDisk && onDisk.generated));
            const old = generated[key];
            generated[key] = target;
            const normals = onDisk && onDisk.normals && typeof onDisk.normals === 'object' ? onDisk.normals : N.manifest.normals || {};
            const manifest = { version: 1, normals, generated };
            if (!F.atomicWriteJson(N.manifestPath, manifest, 2)) throw new Error('Could not write the normal-map manifest.');
            N.setManifest(manifest);
            if (old && old !== target && !Object.values(generated).includes(old)) {
                try { F.fs.unlinkSync(F.path.resolve(old)); } catch (error) { /* already gone */ }
            }
            return N.manifest;
        },

        // Once a session per map: a picture edited since its map was made gets a new one.
        checkGeneratedNormal(request) {
            if (!request || !request.key || !request.path || this.normalGenChecked.has(request.key)) return false;
            this.normalGenChecked.add(request.key);
            if (!this.normalGenAllowed()) return false;
            try {
                if (this.normalGenTarget(request.key, N.cleanPath(request.source)) === request.path && D.FS.existsSync(request.path)) return false;
            } catch (error) { return false; }
            return this.queueNormalGen(request);
        },

        normalMapEligible(asset) {
            const path = asset && N.cleanPath(asset.path);
            return Boolean(path && /^img\//i.test(path) && /\.(png|jpe?g|webp)$/i.test(path) && N.normalPath(path));
        },

        async makeAssetNormalMap(asset, loader = path => this.loadPixels(path), strength = 2) {
            if (!this.normalMapEligible(asset)) { this.showToast('Choose a picture, not a normal map.', 'error'); return null; }
            const target = N.normalPath(asset.path), F = D.FS;
            if (!target || !F.fs || !F.path) { this.showToast('Normal maps can only be written in a playtest.', 'error'); return null; }
            const root = F.path.resolve('.'), absolute = F.path.resolve(root, target), relative = F.path.relative(root, absolute).replace(/\\/g, '/');
            if (relative !== target || relative.startsWith('../') || F.path.isAbsolute(relative)) {
                this.showToast('The normal map must stay beside its picture inside the project.', 'error');
                return null;
            }
            if (F.existsSync(target)) {
                const replace = await D.Ui.confirm(`${target} already exists. Replace it with a generated normal map?`,
                    { title: 'Replace Normal Map', ok: 'Replace', danger: true });
                if (!replace) return null;
            }
            try {
                const source = await loader(asset.path);
                const pixels = N.make(source.data, source.width, source.height, strength);
                const canvas = document.createElement('canvas');
                canvas.width = source.width; canvas.height = source.height;
                const context = canvas.getContext('2d'), image = context.createImageData(source.width, source.height);
                image.data.set(pixels); context.putImageData(image, 0, 0);
                const encoded = canvas.toDataURL('image/png').split(',')[1];
                if (!encoded) throw new Error('The generated PNG was empty.');
                F.atomicWriteFile(target, Buffer.from(encoded, 'base64'));
                await D.AssetIndex.indexPaths([target], { save: false });
                D.AssetIndex.save();
                this.showToast(`Made ${target}. Side lighting will show its generated bumps.`, 3500);
                this.refreshDrawerCards(); this.refreshInspector(); this.refreshSpriteset();
                return target;
            } catch (error) {
                this.showToast(`Could not make the normal map: ${error.message || error}`, 'error');
                return null;
            }
        }
    });

    N.requestGenerated = request => W.queueNormalGen(request);
    N.checkGenerated = request => W.checkGeneratedNormal(request);

    const renderUsage = W.renderUsagePanel;
    W.renderUsagePanel = function(asset) {
        const html = renderUsage.call(this, asset);
        if (!this.normalMapEligible(asset)) return html;
        const existing = asset.normalMap ? `Using ${D.Security.escapeHtml(asset.normalMap)}`
            : 'Doodads already get a normal map made for them when Normal Maps are on. This writes an _n.png beside the picture to paint over by hand.';
        return html + `<div style="border-top:1px solid var(--dd-line-soft);padding-top:8px;margin-top:8px;">
            <div class="dd-panel-head" style="font-weight:900;margin-bottom:4px;">Normal Map</div>
            <div style="font-size:10px;color:var(--dd-muted);margin-bottom:5px;">${existing}</div>
            <button class="dd-btn" id="dd-asset-make-normal" type="button" style="width:100%;">Make Normal Map</button>
        </div>`;
    };

    const bindUsage = W.bindUsagePanel;
    W.bindUsagePanel = function(asset) {
        const result = bindUsage.call(this, asset);
        const button = typeof document !== 'undefined' ? document.getElementById('dd-asset-make-normal') : null;
        if (button) button.onclick = () => this.makeAssetNormalMap(asset);
        return result;
    };
})();
