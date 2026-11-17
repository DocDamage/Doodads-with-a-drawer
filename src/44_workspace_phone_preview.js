// @editor-only
//==========================================================
// SECTION 25P: THE PLAYTEST ON A PHONE (8.3.5)
//==========================================================
// A read-only web server for the project folder, on this computer's local network address only, started
// from View → Phone Preview after the user agrees. Every address carries a random token; only the game's
// own folders are served (never saves, dot files or the plugin's cache of backups and reports); only GET
// and HEAD are answered. The phone runs the plugin with the editor off and reloads where it stood when a
// data file is saved. It stops on Stop, when the editor closes and when the playtest window closes.
DocsDoodads.LanPreview = {
    server: null,
    info: null,
    sockets: null,
    allowedTop: ['index.html', 'js', 'img', 'audio', 'data', 'fonts', 'css', 'effects', 'icon', 'movies', 'models'],
    deniedData: ['docs_doodads_cache'],
    pollEvery: 2000,
    types: {
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
        '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'video/webm', '.mp4': 'video/mp4', '.woff': 'font/woff',
        '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.efk': 'application/octet-stream',
        '.efkefc': 'application/octet-stream', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream',
        '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8'
    },

    // Private IPv4 ranges a phone on the same Wi-Fi can reach. Loopback and public addresses are refused.
    privateAddress(ip) {
        const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(ip || ''));
        if (!m) return false;
        const [a, b] = [Number(m[1]), Number(m[2])];
        if ([m[1], m[2], m[3], m[4]].some(part => Number(part) > 255)) return false;
        return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
    },

    // The first private address, home networks (192.168) before office ones; interfaces sorted by name.
    pickAddress(interfaces) {
        const found = [];
        for (const name of Object.keys(interfaces || {}).sort()) {
            for (const entry of interfaces[name] || []) {
                const family = entry && (entry.family === 4 ? 'IPv4' : entry.family);
                if (entry && family === 'IPv4' && !entry.internal && this.privateAddress(entry.address)) found.push(entry.address);
            }
        }
        const rank = ip => ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2;
        found.sort((a, b) => rank(a) - rank(b));
        return found[0] || null;
    },

    // url → { status } to refuse, { status: 301, location }, { kind: 'changed' }, or { file, rel, index }.
    resolveRequest(root, url, token, pathModule) {
        const raw = String(url || '');
        if (raw.length > 2048) return { status: 414 };
        const cut = raw.search(/[?#]/), pathname = cut >= 0 ? raw.slice(0, cut) : raw;
        const prefix = `/${token}/`;
        if (!token || !/^[a-f0-9]{32}$/.test(token)) return { status: 404 };
        if (pathname === `/${token}`) return { status: 301, location: prefix };
        if (!pathname.startsWith(prefix)) return { status: 404 };
        const rest = pathname.slice(prefix.length);
        let parts;
        try { parts = rest === '' ? ['index.html'] : rest.split('/').map(decodeURIComponent); } catch (error) { return { status: 400 }; }
        if (parts.length === 1 && parts[0] === '__changed') return { kind: 'changed' };
        for (const part of parts) {
            // Windows drops trailing dots and spaces and expands 8.3 short names, so refuse those spellings.
            if (!part || part === '.' || part === '..' || part.startsWith('.') || /[\\/\0:<>|"*?]/.test(part) || /[. ]$/.test(part) || /~\d/.test(part)) {
                return { status: 404 };
            }
        }
        const top = parts[0].toLowerCase();
        if (!this.allowedTop.includes(top) || (top === 'index.html') !== (parts.length === 1)) return { status: 404 };
        if (top === 'data' && parts.length > 2 && this.deniedData.includes(parts[1].toLowerCase())) return { status: 404 };
        const file = pathModule.resolve(root, ...parts), rel = pathModule.relative(root, file);
        if (!rel || rel.startsWith('..') || pathModule.isAbsolute(rel)) return { status: 404 };
        return { file, rel: rel.split(pathModule.sep).join('/'), index: top === 'index.html' };
    },

    // The real file must still be inside the project and outside the denied folders after links are followed.
    realAllowed(realRoot, realFile, pathModule) {
        const rel = pathModule.relative(realRoot, realFile);
        if (!rel || rel.startsWith('..') || pathModule.isAbsolute(rel)) return false;
        const parts = rel.split(pathModule.sep).map(part => part.toLowerCase());
        if (!this.allowedTop.includes(parts[0])) return false;
        return !(parts[0] === 'data' && parts.length > 2 && this.deniedData.includes(parts[1]));
    },

    contentType(file) {
        const match = /\.[^./\\]+$/.exec(String(file).toLowerCase());
        return (match && this.types[match[0]]) || 'application/octet-stream';
    },

    // Runs on the phone, before the game: remember where the player stands, reload when a data file is
    // saved, and start straight on that spot instead of the title. Plain, self-contained script.
    phoneMain(config) {
        var w = typeof window !== 'undefined' ? window : globalThis;
        var key = 'docsPhonePreview';
        var state = { last: null, stopped: false, patched: false, tries: 0 };
        function spot() {
            try {
                if (w.$gameMap && w.$gamePlayer && w.$gameMap.mapId() > 0) {
                    return { mapId: w.$gameMap.mapId(), x: w.$gamePlayer.x, y: w.$gamePlayer.y, d: w.$gamePlayer.direction() };
                }
            } catch (error) { /* not in a map yet */ }
            return null;
        }
        function remember() {
            var at = spot();
            try { if (at) w.sessionStorage.setItem(key, JSON.stringify(at)); } catch (error) { /* private mode */ }
        }
        function takeSpot() {
            try {
                var raw = w.sessionStorage.getItem(key);
                w.sessionStorage.removeItem(key);
                var at = raw ? JSON.parse(raw) : null;
                if (at && at.mapId > 0 && w.$dataMapInfos && w.$dataMapInfos[at.mapId]) return at;
            } catch (error) { /* nothing kept */ }
            return null;
        }
        function patch() {
            if (state.patched) return true;
            if (typeof w.Scene_Boot !== 'function' || !w.Scene_Boot.prototype.startNormalGame) return false;
            var start = w.Scene_Boot.prototype.startNormalGame;
            w.Scene_Boot.prototype.startNormalGame = function() {
                var at = takeSpot();
                if (!at) return start.apply(this, arguments);
                w.DataManager.setupNewGame();
                w.$gamePlayer.reserveTransfer(at.mapId, at.x, at.y, at.d || 2, 0);
                w.SceneManager.goto(w.Scene_Map);
            };
            state.patched = true;
            return true;
        }
        function waitForGame() {
            if (!patch() && state.tries++ < 2400) w.setTimeout(waitForGame, 25);
        }
        function poll() {
            if (state.stopped) return;
            w.fetch(config.changed, { cache: 'no-store' }).then(function(response) { return response.ok ? response.json() : null; }).then(function(body) {
                if (!body || typeof body.saved !== 'number') return;
                if (state.last === null) state.last = body.saved;
                else if (body.saved !== state.last) { state.last = body.saved; remember(); state.stopped = true; w.location.reload(); }
            }).catch(function() { /* the computer stopped serving */ }).then(function() {
                if (!state.stopped) w.setTimeout(poll, config.every || 2000);
            });
        }
        waitForGame();
        poll();
        return state;
    },

    injectIndex(html) {
        const script = `<script>(${this.phoneMain.toString().replace(/^phoneMain\s*\(/, 'function(')})(${JSON.stringify({ changed: '__changed', every: this.pollEvery })});</script>`;
        const text = String(html);
        const head = text.search(/<\/head>/i);
        return head >= 0 ? text.slice(0, head) + script + text.slice(head) : script + text;
    },

    // The newest save among data/*.json and js/plugins.js, read at most once a second.
    changedAt(ctx, now = Date.now()) {
        if (ctx.changedCache && now - ctx.changedCache.at < 1000) return ctx.changedCache.value;
        let newest = 0;
        const fs = ctx.fs, path = ctx.path;
        const look = file => { try { newest = Math.max(newest, Math.round(fs.statSync(file).mtimeMs)); } catch (error) { /* missing */ } };
        try {
            for (const name of fs.readdirSync(path.join(ctx.root, 'data'))) if (/\.json$/i.test(name)) look(path.join(ctx.root, 'data', name));
        } catch (error) { /* no data folder */ }
        look(path.join(ctx.root, 'js', 'plugins.js'));
        ctx.changedCache = { at: now, value: newest };
        return newest;
    },

    headers(extra = {}) {
        return Object.assign({
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
            'Cross-Origin-Resource-Policy': 'same-origin', 'X-Frame-Options': 'DENY'
        }, extra);
    },

    refuse(res, status, extra = {}) {
        const text = { 301: 'Moved', 400: 'Bad request', 404: 'Not found', 405: 'Only reading is allowed', 414: 'Address too long', 416: 'Range not satisfiable' }[status] || 'Error';
        res.writeHead(status, this.headers(Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, extra)));
        res.end(text);
    },

    handle(req, res, ctx) {
        try {
            if (req.method !== 'GET' && req.method !== 'HEAD') return this.refuse(res, 405, { Allow: 'GET, HEAD' });
            const found = this.resolveRequest(ctx.root, req.url, ctx.token, ctx.path);
            if (found.status === 301) return this.refuse(res, 301, { Location: found.location });
            if (found.status) return this.refuse(res, found.status);
            if (found.kind === 'changed') {
                const body = JSON.stringify({ saved: this.changedAt(ctx) });
                res.writeHead(200, this.headers({ 'Content-Type': 'application/json; charset=utf-8' }));
                return res.end(req.method === 'HEAD' ? undefined : body);
            }
            let real, stat;
            try {
                real = (ctx.fs.realpathSync.native || ctx.fs.realpathSync)(found.file);
                stat = ctx.fs.statSync(real);
            } catch (error) { return this.refuse(res, 404); }
            if (!stat.isFile() || !this.realAllowed(ctx.realRoot, real, ctx.path)) return this.refuse(res, 404);
            const type = this.contentType(real);
            if (found.index) {
                const body = Buffer.from(this.injectIndex(ctx.fs.readFileSync(real, 'utf8')), 'utf8');
                res.writeHead(200, this.headers({ 'Content-Type': type, 'Content-Length': body.length }));
                return res.end(req.method === 'HEAD' ? undefined : body);
            }
            let start = 0, end = stat.size - 1, status = 200;
            const extra = { 'Content-Type': type, 'Accept-Ranges': 'bytes' };
            const range = req.headers && req.headers.range;
            if (range) {
                const m = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
                if (!m || (m[1] === '' && m[2] === '')) return this.refuse(res, 416, { 'Content-Range': `bytes */${stat.size}` });
                if (m[1] === '') { start = Math.max(0, stat.size - Number(m[2])); }
                else { start = Number(m[1]); if (m[2] !== '') end = Math.min(end, Number(m[2])); }
                if (start > end || start >= stat.size) return this.refuse(res, 416, { 'Content-Range': `bytes */${stat.size}` });
                status = 206;
                extra['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
            }
            extra['Content-Length'] = stat.size ? end - start + 1 : 0;
            res.writeHead(status, this.headers(extra));
            if (req.method === 'HEAD' || !stat.size) return res.end();
            const stream = ctx.fs.createReadStream(real, { start, end });
            stream.on('error', () => res.destroy());
            stream.pipe(res);
        } catch (error) {
            try { this.refuse(res, 404); } catch (ignored) { res.destroy(); }
        }
    },

    async start(options = {}) {
        if (this.server) return this.info;
        const http = options.http || require('http'), os = options.os || require('os');
        const path = options.path || require('path'), fs = options.fs || require('fs'), crypto = options.crypto || require('crypto');
        const address = options.address || this.pickAddress(os.networkInterfaces());
        if (!address || !this.privateAddress(address)) {
            throw new Error('No local network address was found. Connect this computer to the same Wi-Fi as the phone.');
        }
        const root = path.resolve(options.root || '.');
        const realRoot = (fs.realpathSync.native || fs.realpathSync)(root);
        const token = options.token || crypto.randomBytes(16).toString('hex');
        const ctx = { root, realRoot, token, fs, path, changedCache: null };
        const sockets = new Set();
        const server = http.createServer((req, res) => this.handle(req, res, ctx));
        server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(Number(options.port) || 0, address, () => { server.removeListener('error', reject); resolve(); });
        });
        const port = server.address().port;
        this.server = server; this.sockets = sockets;
        this.info = { address, port, token, url: `http://${address}:${port}/${token}/` };
        return this.info;
    },

    stop() {
        const server = this.server;
        if (!server) return false;
        this.server = null; this.info = null;
        try { server.close(); } catch (error) { /* already closed */ }
        for (const socket of this.sockets || []) { try { socket.destroy(); } catch (error) { /* gone */ } }
        this.sockets = null;
        return true;
    },

    running() { return Boolean(this.server); }
};

(function() {
    const D = DocsDoodads, W = D.Workspace, L = D.LanPreview;
    const escapeHtml = value => D.Security.escapeHtml(String(value));

    Object.assign(W, {
        async startPhonePreview(options = {}) {
            if (L.running()) { this.showPhonePreviewCard(); return L.info; }
            if (!D.Compat.isTest() || typeof require !== 'function') {
                this.showToast('Phone Preview works only in a playtest on this computer.', 'error');
                return null;
            }
            const agreed = options.agreed || await D.Ui.confirm('Anyone on this network can see this project until you stop. ' +
                'Only the game\'s own folders are served, read-only, at an address with a random code; saves, backups and reports are not. ' +
                'Use it on a network you trust.', { title: 'Phone Preview', ok: 'Start' });
            if (!agreed) return null;
            try {
                const info = await L.start(options);
                this.showPhonePreviewCard();
                return info;
            } catch (error) {
                this.showToast(`Phone Preview could not start: ${error.message || error}`, 'error');
                return null;
            }
        },

        stopPhonePreview() {
            const stopped = L.stop();
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-phone-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            if (stopped && this.mounted) this.showToast('Phone Preview stopped.');
            return stopped;
        },

        drawQr(canvas, qr, scale = 4) {
            const quiet = 4, size = (qr.size + quiet * 2) * scale;
            canvas.width = size; canvas.height = size;
            const context = canvas.getContext && canvas.getContext('2d');
            if (!context) return false;
            context.fillStyle = '#ffffff'; context.fillRect(0, 0, size, size);
            context.fillStyle = '#000000';
            qr.modules.forEach((row, y) => row.forEach((on, x) => { if (on) context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale); }));
            return true;
        },

        showPhonePreviewCard() {
            if (!L.info || typeof document === 'undefined') return null;
            const old = document.getElementById('dd-phone-card');
            if (old && old.parentNode) old.parentNode.removeChild(old);
            const info = L.info, qr = D.Qr.encode(info.url, { ecc: 'M' });
            const card = document.createElement('div');
            card.id = 'dd-phone-card'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:300px;padding:12px;z-index:10040;font-size:11px;';
            card.innerHTML = `<div class="dd-panel-head">Phone Preview <button class="dd-btn" id="dd-phone-stop" type="button">Stop</button></div>
                <div>Anyone on this network can see this project until you stop. Scan with the phone's camera, on the same Wi-Fi.</div>
                <canvas id="dd-phone-qr" style="display:block;margin:8px auto;image-rendering:pixelated;"></canvas>
                <div style="word-break:break-all;user-select:text;"><code>${escapeHtml(info.url)}</code></div>
                <div style="color:var(--dd-muted);margin-top:6px;">The phone runs the game with the editor off. Saving a map reloads it on the phone where the player stands. It stops when the editor closes.</div>`;
            document.body.appendChild(card);
            const canvas = document.getElementById('dd-phone-qr');
            if (canvas) this.drawQr(canvas, qr, 4);
            const stop = document.getElementById('dd-phone-stop');
            if (stop) stop.onclick = () => this.stopPhonePreview();
            return card;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), view = all.find(menu => menu.id === 'view');
        if (view) view.items.push({ id: 'dd-phone-btn', icon: 'eye', label: 'Phone Preview', title: 'Play this project on a phone on the same Wi-Fi (asks first)' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = typeof document !== 'undefined' ? document.getElementById('dd-phone-btn') : null;
        if (button) button.onclick = () => { this.showMoreMenu(false); this.startPhonePreview(); };
        return result;
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('beforeunload', () => L.stop());
    }
})();
