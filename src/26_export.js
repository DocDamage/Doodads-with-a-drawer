//==========================================================
// SECTION 15: DocsDoodads.EXPORT (PNG SLICE EXPORTER)
//==========================================================
DocsDoodads.Export = {
    safeFileName(name) {
        const baseName = String(name || 'slice').split(/[\\/]/).pop();
        return baseName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+$/, 'slice');
    },

    getRegionGeometry(region) {
        const atlasW = Math.max(1, Math.round(region.w));
        const atlasH = Math.max(1, Math.round(region.h));
        const rotated = Boolean(region.rotated);
        const contentW = rotated ? atlasH : atlasW;
        const contentH = rotated ? atlasW : atlasH;
        const trimmed = Boolean(region.trimmed);
        const sourceSize = region.sourceSize || {};
        const spriteSourceSize = region.spriteSourceSize || {};
        return {
            atlasW,
            atlasH,
            contentW,
            contentH,
            outputW: trimmed && Number.isFinite(sourceSize.w) ? sourceSize.w : contentW,
            outputH: trimmed && Number.isFinite(sourceSize.h) ? sourceSize.h : contentH,
            destinationX: trimmed && Number.isFinite(spriteSourceSize.x) ? spriteSourceSize.x : 0,
            destinationY: trimmed && Number.isFinite(spriteSourceSize.y) ? spriteSourceSize.y : 0,
            rotated
        };
    },

    exportSlices(asset, targetDir) {
        const fs = DocsDoodads.FS.fs, path = DocsDoodads.FS.path;
        if (!fs || !path) return false;
        if (!asset.slice || !asset.slice.regions || asset.slice.regions.length === 0) {
            alert("No slice regions defined for this asset.");
            return false;
        }

        const outDir = targetDir || path.join('img', 'doodads', 'sliced_' + asset.fileName.replace(/\.[^/.]+$/, ""));
        DocsDoodads.FS.mkdirp(outDir);

        const img = new Image();
        img.src = DocsDoodads.LiveReload.urlFor(asset.path);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const usedNames = new Set();
            let count = 0;

            for (let i = 0; i < asset.slice.regions.length; i++) {
                const r = asset.slice.regions[i];
                const geometry = this.getRegionGeometry(r);
                canvas.width = geometry.outputW;
                canvas.height = geometry.outputH;
                ctx.clearRect(0, 0, geometry.outputW, geometry.outputH);
                if (geometry.rotated) {
                    ctx.save();
                    ctx.translate(geometry.destinationX, geometry.destinationY + geometry.contentH);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, r.x, r.y, geometry.atlasW, geometry.atlasH, 0, 0, geometry.atlasW, geometry.atlasH);
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        img, r.x, r.y, geometry.atlasW, geometry.atlasH,
                        geometry.destinationX, geometry.destinationY, geometry.contentW, geometry.contentH
                    );
                }

                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const rawName = this.safeFileName(r.name || ('slice_' + (i + 1))).replace(/\.[^.]+$/, '');
                const base = rawName || ('slice_' + (i + 1));
                let stem = base;
                for (let n = 2; usedNames.has(stem.toLowerCase()); n++) stem = `${base}_${n}`;
                usedNames.add(stem.toLowerCase());
                const sliceFileName = `${stem}.png`;
                fs.writeFileSync(path.join(outDir, sliceFileName), buffer);
                count++;
            }
            DocsDoodads.Workspace.showToast(`Exported ${count} slices to ${outDir}`);
        };
        return true;
    }
};


