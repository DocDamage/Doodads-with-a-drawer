//==========================================================
// SECTION 4G: GAME-SAFE SCREEN CAPTURE
//==========================================================
// Rendering is shared by the editor's Capture card and player Photo Mode. Saving deliberately does
// not use the editor filesystem: deployed desktop games may write only a generated PNG name beneath
// their own screenshots directory, while browser games use the browser's download gesture.
DocsDoodads.Capture = {
    renderSceneCanvas(spriteset, renderer) {
        renderer = renderer || (DocsDoodads.Compat && DocsDoodads.Compat.getRenderer ? DocsDoodads.Compat.getRenderer() : null);
        if (!spriteset || !renderer || typeof PIXI === 'undefined' || !PIXI.RenderTexture || !renderer.extract) return null;
        if (typeof spriteset.removeDocsPlacementPreview === 'function') spriteset.removeDocsPlacementPreview();
        const outline = spriteset._docsSelectionOutline;
        const outlineVisible = outline && outline.visible;
        if (outline) outline.visible = false;
        const hidden = [spriteset._docsTraceSprite].filter(Boolean).map(display => ({ display, visible: display.visible }));
        for (const item of hidden) item.display.visible = false;
        let rt = null;
        try {
            rt = PIXI.RenderTexture.create({ width: Graphics.width, height: Graphics.height });
            renderer.render(spriteset, rt);
            return renderer.extract.canvas(rt);
        } finally {
            if (rt) rt.destroy(true);
            if (outline) outline.visible = outlineVisible;
            for (const item of hidden) item.display.visible = item.visible;
        }
    },

    name(kind, mapId, date) {
        const d = date || new Date();
        const pad = value => String(value).padStart(2, '0');
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
        return `${String(kind || 'photo').replace(/[^a-z0-9_-]/gi, '_')}_Map${String(Number(mapId) || 0).padStart(3, '0')}_${stamp}.png`;
    },

    safePngName(name) {
        const base = String(name || 'photo.png').replace(/\\/g, '/').split('/').pop()
            .replace(/\.png$/i, '').replace(/[^a-z0-9_.-]/gi, '_').replace(/^\.+/, '').slice(0, 160);
        return (base || 'photo') + '.png';
    },

    desktopRoot() {
        if (typeof require !== 'function' || typeof process === 'undefined') return null;
        const path = require('path');
        const main = process.mainModule && process.mainModule.filename;
        return main ? path.dirname(main) : process.cwd();
    },

    inside(root, target, path) {
        const relative = path.relative(root, target);
        return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
    },

    saveCanvas(canvas, name) {
        if (!canvas || typeof canvas.toDataURL !== 'function') throw new Error('The picture could not be rendered.');
        const safe = this.safePngName(name);
        const dataUrl = canvas.toDataURL('image/png');
        if (!/^data:image\/png;base64,/.test(dataUrl)) throw new Error('The renderer did not make a PNG.');
        const desktop = typeof Utils !== 'undefined' && Utils && typeof Utils.isNwjs === 'function' && Utils.isNwjs();
        if (!desktop) {
            if (typeof document === 'undefined' || !document.createElement) throw new Error('This browser cannot download the picture.');
            const link = document.createElement('a');
            link.download = safe; link.href = dataUrl; link.style.display = 'none';
            if (document.body && document.body.appendChild) document.body.appendChild(link);
            if (typeof link.click === 'function') link.click();
            if (typeof link.remove === 'function') link.remove();
            else if (link.parentNode) link.parentNode.removeChild(link);
            return { kind: 'download', name: safe };
        }
        if (typeof require !== 'function' || typeof Buffer === 'undefined') throw new Error('Desktop picture saving is unavailable.');
        const fs = require('fs'), path = require('path'), root = this.desktopRoot();
        if (!root) throw new Error('The game folder could not be found.');
        const canonicalRoot = fs.realpathSync(path.resolve(root));
        const requestedFolder = path.resolve(canonicalRoot, 'screenshots');
        fs.mkdirSync(requestedFolder, { recursive: true });
        const folder = fs.realpathSync(requestedFolder);
        if (folder === canonicalRoot || !this.inside(canonicalRoot, folder, path)) throw new Error('The screenshots folder is outside the game.');
        const stem = path.basename(safe, '.png');
        const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
        let out = null, fd = null;
        for (let suffix = 0; suffix < 10000 && fd === null; suffix++) {
            const candidate = path.resolve(folder, `${stem}${suffix ? `-${suffix}` : ''}.png`);
            if (path.dirname(candidate) !== folder) throw new Error('The picture name is outside screenshots.');
            try { fd = fs.openSync(candidate, 'wx'); out = candidate; }
            catch (error) { if (!error || error.code !== 'EEXIST') throw error; }
        }
        if (fd === null) throw new Error('No unused picture name was available.');
        try { fs.writeFileSync(fd, bytes); }
        catch (error) { try { fs.closeSync(fd); } catch (closeError) {} try { fs.unlinkSync(out); } catch (unlinkError) {} throw error; }
        fs.closeSync(fd);
        return { kind: 'file', name: path.basename(out), path: out };
    }
};
