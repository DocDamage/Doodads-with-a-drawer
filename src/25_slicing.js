//==========================================================
// SECTION 14: DocsDoodads.SLICING (KNOWN, GRID, METADATA, VISUAL)
//==========================================================
DocsDoodads.Slicing = {};

// 14.1 Known RPG Maker MZ Detection
DocsDoodads.Slicing.Known = {
    detect(asset) {
        const path = (asset.path || "").toLowerCase();
        const fileName = asset.fileName || "";
        const w = asset.width || 576;
        const h = asset.height || 384;

        // Characters
        if (asset.type === 'single_character' || fileName.startsWith('$')) {
            const cw = w / 3, ch = h / 4;
            return {
                status: "known",
                method: "mz_single_character",
                confidence: 1.0,
                width: w, height: h,
                regions: [{
                    id: (asset.id || "char") + "_single",
                    name: fileName.split('.')[0],
                    x: 0, y: 0, w: w, h: h,
                    cellW: cw, cellH: ch,
                    characterName: fileName, characterIndex: 0,
                    pivotX: 0.5, pivotY: 1.0
                }]
            };
        } else if (asset.type === 'character_sheet' || path.includes('img/characters')) {
            const charW = w / 4, charH = h / 2;
            const cellW = charW / 3, cellH = charH / 4;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                const cx = (idx % 4) * charW;
                const cy = Math.floor(idx / 4) * charH;
                regions.push({
                    id: (asset.id || "char") + "_char" + idx,
                    name: fileName.split('.')[0] + " #" + (idx + 1),
                    x: cx, y: cy, w: charW, h: charH,
                    cellW: cellW, cellH: cellH,
                    characterName: fileName, characterIndex: idx,
                    pivotX: 0.5, pivotY: 1.0
                });
            }
            return {
                status: "known",
                method: "mz_standard_8character",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (asset.type === 'faceset' || path.includes('img/faces')) {
            const fw = w / 4, fh = h / 2;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                regions.push({
                    id: (asset.id || "face") + "_face" + idx,
                    name: fileName.split('.')[0] + " Face #" + (idx + 1),
                    x: (idx % 4) * fw, y: Math.floor(idx / 4) * fh,
                    w: fw, h: fh, faceIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_faceset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (fileName.toLowerCase() === 'iconset.png' || path.includes('iconset')) {
            const iconSize = 32;
            const cols = 16;
            const rows = Math.floor(h / iconSize);
            const regions = [];
            for (let idx = 0; idx < cols * rows; idx++) {
                const ix = (idx % cols) * iconSize;
                const iy = Math.floor(idx / cols) * iconSize;
                regions.push({
                    id: "icon_" + idx,
                    name: "Icon #" + idx,
                    x: ix, y: iy, w: iconSize, h: iconSize,
                    iconIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_iconset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        }
        return null;
    }
};

// 14.2 Divisor Fixed Grid Slicing
DocsDoodads.Slicing.Grid = {
    sliceToGrid(width, height, cols, rows) {
        const cellW = width / cols;
        const cellH = height / rows;
        const regions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                regions.push({
                    id: `grid_${r}_${c}`,
                    name: `Cell_${r + 1}_${c + 1}`,
                    x: Math.round(c * cellW),
                    y: Math.round(r * cellH),
                    w: Math.round(cellW),
                    h: Math.round(cellH),
                    pivotX: 0.5,
                    pivotY: 1.0
                });
            }
        }
        return regions;
    }
};

// 14.3 Sidecar Atlas Metadata Parsers
DocsDoodads.Slicing.Metadata = {
    parse(imagePath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return null;
        const candidates = [
            imagePath.replace(/\.[^/.]+$/, '.saf.json'),
            imagePath.replace(/\.[^/.]+$/, '.json')
        ];
        const jsonPath = candidates.find(candidate => fs.existsSync(candidate));
        if (!jsonPath) return null;

        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (!data.frames || (typeof data.frames !== 'object')) return null;

            const entries = Array.isArray(data.frames)
                ? data.frames.map((frame, index) => [frame.filename || `frame_${index}`, frame])
                : Object.entries(data.frames);
            const regions = [];
            for (const [name, frameData] of entries) {
                const frame = frameData.frame || frameData;
                if (![frame.x, frame.y, frame.w, frame.h].every(Number.isFinite)) continue;
                const sourceSize = frameData.sourceSize || { w: frame.w, h: frame.h };
                const spriteSourceSize = frameData.spriteSourceSize || { x: 0, y: 0, w: frame.w, h: frame.h };
                const rotated = Boolean(frameData.rotated);
                // As in PIXI: a rotated frame's w/h are the unrotated sprite size, so it covers h x w on the sheet.
                regions.push({
                    id: name,
                    name,
                    x: frame.x,
                    y: frame.y,
                    w: rotated ? frame.h : frame.w,
                    h: rotated ? frame.w : frame.h,
                    pivotX: frameData.pivot && Number.isFinite(frameData.pivot.x) ? frameData.pivot.x : 0.5,
                    pivotY: frameData.pivot && Number.isFinite(frameData.pivot.y) ? frameData.pivot.y : 1.0,
                    rotated,
                    trimmed: Boolean(frameData.trimmed),
                    sourceSize: { w: sourceSize.w, h: sourceSize.h },
                    spriteSourceSize: {
                        x: spriteSourceSize.x || 0,
                        y: spriteSourceSize.y || 0,
                        w: spriteSourceSize.w,
                        h: spriteSourceSize.h
                    },
                    duration: Number.isFinite(frameData.duration) ? frameData.duration : 0
                });
            }
            if (regions.length === 0) return null;

            const frameTags = data.meta && Array.isArray(data.meta.frameTags) ? data.meta.frameTags : [];
            const animationGroups = frameTags.map(tag => ({
                name: tag.name || 'animation',
                direction: tag.direction || 'forward',
                frames: regions.slice(Math.max(0, tag.from || 0), Math.min(regions.length, (tag.to || 0) + 1)).map(region => region.id)
            })).filter(group => group.frames.length > 0);

            if (animationGroups.length === 0) {
                const inferred = {};
                for (const region of regions) {
                    const groupName = region.name.replace(/\.[^.]+$/, '').replace(/(?:[_\- ]?\d+)$/, '');
                    if (!inferred[groupName]) inferred[groupName] = [];
                    inferred[groupName].push(region.id);
                }
                for (const [name, frames] of Object.entries(inferred)) {
                    if (frames.length > 1) animationGroups.push({ name, direction: 'forward', frames });
                }
            }

            return {
                status: 'metadata',
                method: jsonPath.endsWith('.saf.json') ? 'saf_sidecar_json' : 'sidecar_atlas_json',
                confidence: 1.0,
                sourcePath: jsonPath,
                regions,
                animationGroups
            };
        } catch (error) {
            DocsDoodads.Core.log('Atlas sidecar parse failed.', jsonPath, error);
            return null;
        }
    }
};

// 14.4 Visual Auto-Slicer
DocsDoodads.Slicing.Visual = {
    analyze(imageElement, options = {}) {
        if (typeof document === 'undefined') return { status: "none", regions: [] };
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        const w = canvas.width, h = canvas.height;
        return this.analyzePixels(ctx.getImageData(0, 0, w, h).data, w, h, options);
    },

    analyzePixels(data, w, h, options = {}) {
        const pixelCount = w * h;
        const maxPixels = options.maxPixels || 16777216;
        if (!data || w <= 0 || h <= 0 || data.length < pixelCount * 4) {
            return { status: 'none', method: 'invalid_pixels', confidence: 0, backgroundMode: 'unknown', regions: [] };
        }
        if (pixelCount > maxPixels) {
            return { status: 'review', method: 'safety_limit', confidence: 0.1, backgroundMode: 'unknown', regions: [], reason: 'image_too_large' };
        }

        const background = this.detectBackground(data, w, h, options);
        let binary = this.buildForegroundMask(data, w, h, background, options);
        binary = this.cleanupMask(binary, w, h, options);
        const minArea = Math.max(1, options.minArea === undefined ? 12 : options.minArea);
        const detected = this.connectedComponents(binary, w, h, minArea);
        const grouping = this.attachDetachedFragments(detected, options);
        const padding = Math.max(0, options.padding === undefined ? 1 : options.padding);
        let regions = grouping.components.map(component => ({
            x: Math.max(0, component.minX - padding),
            y: Math.max(0, component.minY - padding),
            w: Math.min(w, component.maxX + padding + 1) - Math.max(0, component.minX - padding),
            h: Math.min(h, component.maxY + padding + 1) - Math.max(0, component.minY - padding),
            pixelCount: component.count,
            pivotX: 0.5,
            pivotY: 1.0
        }));
        const rowTolerance = regions.length > 0
            ? Math.max(2, regions.reduce((sum, region) => sum + region.h, 0) / regions.length * 0.35)
            : 2;
        regions.sort((a, b) => Math.abs(a.y - b.y) <= rowTolerance ? a.x - b.x : a.y - b.y);
        regions = regions.map((region, index) => ({
            id: `reg_${index + 1}`,
            name: `Sprite_${String(index + 1).padStart(2, '0')}`,
            ...region
        }));

        const foregroundPixels = binary.reduce((sum, value) => sum + value, 0);
        const occupancy = foregroundPixels / pixelCount;
        const confidence = this.scoreConfidence(regions, background, occupancy, grouping.ambiguousFragments);
        return {
            status: confidence >= 0.65 ? 'auto' : 'review',
            method: 'saf_visual',
            confidence,
            backgroundMode: background.mode,
            alphaThreshold: background.alphaThreshold,
            regions,
            diagnostics: {
                occupancy,
                backgroundConfidence: background.confidence,
                componentCount: detected.length,
                attachedFragments: grouping.attachedFragments,
                ambiguousFragments: grouping.ambiguousFragments
            }
        };
    },

    detectBackground(data, w, h, options = {}) {
        const border = [];
        for (let x = 0; x < w; x++) {
            border.push(x, (h - 1) * w + x);
        }
        for (let y = 1; y < h - 1; y++) {
            border.push(y * w, y * w + w - 1);
        }
        let transparentCount = 0;
        const buckets = new Map();
        for (const index of border) {
            const offset = index * 4;
            const alpha = data[offset + 3];
            if (alpha < 245) transparentCount++;
            const key = `${data[offset] >> 4},${data[offset + 1] >> 4},${data[offset + 2] >> 4},${alpha >> 4}`;
            let bucket = buckets.get(key);
            if (!bucket) bucket = { count: 0, r: 0, g: 0, b: 0, a: 0 };
            bucket.count++;
            bucket.r += data[offset]; bucket.g += data[offset + 1]; bucket.b += data[offset + 2]; bucket.a += alpha;
            buckets.set(key, bucket);
        }
        const transparentRatio = border.length ? transparentCount / border.length : 1;
        if (transparentRatio >= (options.transparentBorderRatio || 0.15)) {
            const hist = new Uint32Array(256);
            for (let offset = 3; offset < data.length; offset += 4) hist[data[offset]]++;
            const alphaThreshold = options.alphaThreshold || Math.max(8, this.otsuThreshold(hist));
            return { mode: 'transparent', alphaThreshold, confidence: Math.min(1, 0.65 + transparentRatio * 0.35) };
        }

        let dominant = { count: 0, r: 0, g: 0, b: 0, a: 255 };
        for (const bucket of buckets.values()) if (bucket.count > dominant.count) dominant = bucket;
        const divisor = dominant.count || 1;
        return {
            mode: 'opaque',
            alphaThreshold: 8,
            color: [dominant.r / divisor, dominant.g / divisor, dominant.b / divisor, dominant.a / divisor],
            confidence: border.length ? dominant.count / border.length : 0
        };
    },

    buildForegroundMask(data, w, h, background, options = {}) {
        const binary = new Uint8Array(w * h);
        if (background.mode === 'transparent') {
            for (let index = 0, offset = 3; index < binary.length; index++, offset += 4) {
                binary[index] = data[offset] >= background.alphaThreshold ? 1 : 0;
            }
            return binary;
        }

        const tolerance = options.colorTolerance || 36;
        const toleranceSq = tolerance * tolerance;
        const candidate = new Uint8Array(w * h);
        for (let index = 0, offset = 0; index < candidate.length; index++, offset += 4) {
            const dr = data[offset] - background.color[0];
            const dg = data[offset + 1] - background.color[1];
            const db = data[offset + 2] - background.color[2];
            candidate[index] = dr * dr + dg * dg + db * db <= toleranceSq ? 1 : 0;
        }
        const visited = new Uint8Array(w * h);
        const queue = [];
        for (let x = 0; x < w; x++) queue.push(x, (h - 1) * w + x);
        for (let y = 1; y < h - 1; y++) queue.push(y * w, y * w + w - 1);
        while (queue.length > 0) {
            const index = queue.pop();
            if (index < 0 || index >= visited.length || visited[index] || !candidate[index]) continue;
            visited[index] = 1;
            const x = index % w;
            const y = Math.floor(index / w);
            if (x > 0) queue.push(index - 1);
            if (x < w - 1) queue.push(index + 1);
            if (y > 0) queue.push(index - w);
            if (y < h - 1) queue.push(index + w);
        }
        for (let index = 0; index < binary.length; index++) {
            binary[index] = !visited[index] && data[index * 4 + 3] >= 8 ? 1 : 0;
        }
        return binary;
    },

    cleanupMask(binary, w, h, options = {}) {
        if (options.cleanup === false) return binary;
        const cleaned = binary.slice();
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const index = y * w + x;
                if (!binary[index]) continue;
                const neighbors = binary[index - 1] + binary[index + 1] + binary[index - w] + binary[index + w];
                if (neighbors === 0) cleaned[index] = 0;
            }
        }
        return cleaned;
    },

    connectedComponents(binary, w, h, minArea) {
        const visited = new Uint8Array(binary.length);
        const components = [];
        for (let start = 0; start < binary.length; start++) {
            if (!binary[start] || visited[start]) continue;
            const queue = [start];
            visited[start] = 1;
            const component = { minX: start % w, maxX: start % w, minY: Math.floor(start / w), maxY: Math.floor(start / w), count: 0 };
            while (queue.length > 0) {
                const index = queue.pop();
                const x = index % w;
                const y = Math.floor(index / w);
                component.count++;
                component.minX = Math.min(component.minX, x); component.maxX = Math.max(component.maxX, x);
                component.minY = Math.min(component.minY, y); component.maxY = Math.max(component.maxY, y);
                const neighbors = [x > 0 ? index - 1 : -1, x < w - 1 ? index + 1 : -1, y > 0 ? index - w : -1, y < h - 1 ? index + w : -1];
                for (const next of neighbors) {
                    if (next >= 0 && binary[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
                }
            }
            if (component.count >= minArea) components.push(component);
        }
        return components;
    },

    componentDistance(a, b) {
        const dx = Math.max(0, a.minX - b.maxX - 1, b.minX - a.maxX - 1);
        const dy = Math.max(0, a.minY - b.maxY - 1, b.minY - a.maxY - 1);
        return Math.hypot(dx, dy);
    },

    attachDetachedFragments(components, options = {}) {
        if (components.length < 2) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: 0 };
        const largestArea = Math.max(...components.map(component => component.count));
        const ratio = options.fragmentMaxAreaRatio === undefined ? 0.12 : options.fragmentMaxAreaRatio;
        const maxDistance = options.fragmentAttachDistance === undefined ? 6 : options.fragmentAttachDistance;
        const majors = components.filter(component => component.count > largestArea * ratio).map(component => ({ ...component }));
        const fragments = components.filter(component => component.count <= largestArea * ratio);
        if (majors.length === 0) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: fragments.length };
        let attachedFragments = 0;
        let ambiguousFragments = 0;
        const unattached = [];
        for (const fragment of fragments) {
            const ranked = majors.map((major, index) => ({ index, distance: this.componentDistance(fragment, major) })).sort((a, b) => a.distance - b.distance);
            const nearest = ranked[0];
            const second = ranked[1];
            const unambiguous = !second || second.distance - nearest.distance >= Math.max(2, nearest.distance * 0.5);
            if (nearest.distance <= maxDistance && unambiguous) {
                const major = majors[nearest.index];
                major.minX = Math.min(major.minX, fragment.minX); major.maxX = Math.max(major.maxX, fragment.maxX);
                major.minY = Math.min(major.minY, fragment.minY); major.maxY = Math.max(major.maxY, fragment.maxY);
                major.count += fragment.count;
                attachedFragments++;
            } else {
                unattached.push(fragment);
                if (!unambiguous) ambiguousFragments++;
            }
        }
        return { components: majors.concat(unattached), attachedFragments, ambiguousFragments };
    },

    scoreConfidence(regions, background, occupancy, ambiguousFragments) {
        if (regions.length === 0) return 0.1;
        let score = 0.58 + Math.min(0.24, background.confidence * 0.24);
        const averageSolidity = regions.reduce((sum, region) => sum + Math.min(1, region.pixelCount / Math.max(1, region.w * region.h)), 0) / regions.length;
        score += averageSolidity * 0.16;
        if (occupancy > 0.88) score -= 0.38;
        else if (occupancy < 0.0005) score -= 0.25;
        score -= Math.min(0.25, ambiguousFragments * 0.05);
        return Math.max(0.05, Math.min(0.99, Math.round(score * 1000) / 1000));
    },

    otsuThreshold(hist) {
        let total = 0;
        for (let i = 0; i < 256; i++) total += hist[i];
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, varMax = 0, threshold = 0;

        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            const wF = total - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        return threshold;
    },

    // analyze, giving the page a frame first (so a Cancel click can land) and checking the token before and
    // after: resolves null when cancelled. The analysis itself is quick (a 4096 x 4096 sheet with 4,000
    // sprites takes about a third of a second), so it runs in one go.
    analyzeAsync(imageElement, options = {}, onProgress = null, cancellationToken = null) {
        const cancelled = () => Boolean(cancellationToken && cancellationToken.isCancelled);
        return new Promise(resolve => {
            if (cancelled()) return resolve(null);
            if (typeof document === 'undefined') return resolve({ status: "none", regions: [] });
            if (onProgress) onProgress("Loading Pixels", 10);
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);
            const w = canvas.width, h = canvas.height;
            const data = ctx.getImageData(0, 0, w, h).data;
            const run = () => {
                if (cancelled()) return resolve(null);
                if (onProgress) onProgress("Finding Sprites", 50);
                const result = this.analyzePixels(data, w, h, options);
                if (cancelled()) return resolve(null);
                if (onProgress) onProgress("Complete", 100);
                resolve(result);
            };
            if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(run);
            else setTimeout(run, 1);
        });
    }
};

