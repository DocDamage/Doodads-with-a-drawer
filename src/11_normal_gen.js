// @editor-only
//==========================================================
// SECTION 11N: NORMAL MAPS MADE FROM A PICTURE (8.3.1)
//==========================================================
// Pure rules on RGBA pixel arrays. Every frame cell is worked on alone: distances, brightness and the
// Sobel filter never read across a cell's edge, so neighbouring frames in a sheet or strip cannot bleed.
// Heights are in pixels: a slope of 1 is 45 degrees at Strength 1.
DocsDoodads.NormalGen = {
    maxPixels: 16777216,
    alphaCut: 128,
    // Pixels per slice before the editor's runner may yield to the next frame.
    sliceBudget: 65536,

    options(width, height, options = {}) {
        width = Number(width); height = Number(height);
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > this.maxPixels) {
            throw new Error('Normal-map image size is invalid or too large.');
        }
        const grid = this.grid(width, height, options.grid);
        const shape = options.shape === 'flat' ? 'flat' : 'round';
        const strength = Math.max(0.1, Math.min(8, Number(options.strength) || 1));
        const auto = Math.round(Math.min(grid.w, grid.h) / 5);
        const radius = Math.max(1, Math.min(64, Math.round(Number(options.radius) || Math.max(2, Math.min(48, auto)))));
        return { width, height, grid, shape, strength, radius };
    },

    // A frame grid: cell size and where one cell starts. Missing or bad values mean one cell for the picture.
    grid(width, height, grid) {
        const size = (value, whole) => { const n = Math.floor(Number(value)); return n > 0 ? Math.min(whole, n) : whole; };
        const w = size(grid && grid.w, width), h = size(grid && grid.h, height);
        const x = ((Math.floor(Number(grid && grid.x) || 0) % w) + w) % w;
        const y = ((Math.floor(Number(grid && grid.y) || 0) % h) + h) % h;
        return { w, h, x, y };
    },

    // The cells that tile the picture, clipped at its edges. A grid that starts at x=4 leaves a 4-pixel cell first.
    cells(width, height, grid) {
        const g = this.grid(width, height, grid), out = [];
        const starts = (size, step, offset) => {
            const list = [];
            for (let at = offset > 0 ? offset - step : 0; at < size; at += step) list.push(at);
            return list;
        };
        for (const top of starts(height, g.h, g.y)) for (const left of starts(width, g.w, g.x)) {
            const x0 = Math.max(0, left), y0 = Math.max(0, top);
            const x1 = Math.min(width, left + g.w), y1 = Math.min(height, top + g.h);
            if (x1 > x0 && y1 > y0) out.push({ x0, y0, x1, y1 });
        }
        return out;
    },

    checkPixels(pixels, width, height) {
        if (!pixels || pixels.length < width * height * 4) throw new Error('Normal-map source pixels are incomplete.');
    },

    // Rounded shapes: a quarter-parabola rising over `radius` pixels from the edge of the opaque shape.
    profile(distance, radius) {
        const t = Math.min(distance, radius) / radius;
        return radius * 0.5 * (1 - (1 - t) * (1 - t));
    },

    // Two-pass chamfer distance (1 and √2) to the nearest see-through pixel in the same cell. A cell edge is
    // not a shape edge: an opaque cell with no see-through pixel is a flat plateau.
    *cellDistance(pixels, width, distance, cell) {
        const cut = this.alphaCut, D = Math.SQRT2, far = 1e9;
        let seeded = false;
        const rowsPerSlice = Math.max(1, Math.floor(this.sliceBudget / Math.max(1, cell.x1 - cell.x0)));
        for (let y = cell.y0; y < cell.y1; y++) {
            for (let x = cell.x0; x < cell.x1; x++) {
                const i = y * width + x;
                if (pixels[i * 4 + 3] < cut) { distance[i] = 0; seeded = true; continue; }
                let best = far;
                if (x > cell.x0) best = Math.min(best, distance[i - 1] + 1);
                if (y > cell.y0) {
                    best = Math.min(best, distance[i - width] + 1);
                    if (x > cell.x0) best = Math.min(best, distance[i - width - 1] + D);
                    if (x + 1 < cell.x1) best = Math.min(best, distance[i - width + 1] + D);
                }
                distance[i] = best;
            }
            if ((y - cell.y0 + 1) % rowsPerSlice === 0) yield cell.x1 - cell.x0;
        }
        for (let y = cell.y1 - 1; y >= cell.y0; y--) {
            for (let x = cell.x1 - 1; x >= cell.x0; x--) {
                const i = y * width + x;
                let best = distance[i];
                if (!best) continue;
                if (x + 1 < cell.x1) best = Math.min(best, distance[i + 1] + 1);
                if (y + 1 < cell.y1) {
                    best = Math.min(best, distance[i + width] + 1);
                    if (x + 1 < cell.x1) best = Math.min(best, distance[i + width + 1] + D);
                    if (x > cell.x0) best = Math.min(best, distance[i + width - 1] + D);
                }
                distance[i] = best;
            }
            if ((cell.y1 - y) % rowsPerSlice === 0) yield cell.x1 - cell.x0;
        }
        if (!seeded) for (let y = cell.y0; y < cell.y1; y++) for (let x = cell.x0; x < cell.x1; x++) distance[y * width + x] = far;
    },

    luminance(pixels, i) {
        const at = i * 4;
        return pixels[at + 3] / 255 * (pixels[at] * 0.2126 + pixels[at + 1] * 0.7152 + pixels[at + 2] * 0.0722) / 255;
    },

    // Rounded: the shape's profile with a little of the picture's brightness for surface detail.
    // Flat: brightness alone, as a hand-painted bump would be read.
    *heightJob(pixels, width, height, o) {
        const heights = new Float32Array(width * height);
        const cells = this.cells(width, height, o.grid);
        if (o.shape === 'round') {
            for (const cell of cells) yield* this.cellDistance(pixels, width, heights, cell);
            for (let i = 0; i < heights.length; i++) heights[i] = this.profile(heights[i], o.radius) + this.luminance(pixels, i);
        } else {
            for (let i = 0; i < heights.length; i++) heights[i] = this.luminance(pixels, i) * 2;
        }
        return { heights, cells };
    },

    heightFromAlpha(pixels, width, height, options = {}) {
        const o = this.options(width, height, Object.assign({}, options, { shape: 'round' }));
        this.checkPixels(pixels, width, height);
        const heights = new Float32Array(width * height);
        for (const cell of this.cells(width, height, o.grid)) {
            const steps = this.cellDistance(pixels, width, heights, cell);
            while (!steps.next().done) { /* run to the end */ }
        }
        for (let i = 0; i < heights.length; i++) heights[i] = this.profile(heights[i], o.radius);
        return heights;
    },

    // One encoded normal: tangent space, green up, alpha opaque so PIXI's premultiplied upload keeps RGB.
    encode(nx, ny, nz, out = new Uint8ClampedArray(4), at = 0) {
        out[at] = Math.round((nx * 0.5 + 0.5) * 255);
        out[at + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        out[at + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        out[at + 3] = 255;
        return out;
    },

    *cellNormals(heights, width, out, cell, strength) {
        const rowsPerSlice = Math.max(1, Math.floor(this.sliceBudget / Math.max(1, cell.x1 - cell.x0)));
        const sample = (x, y) => heights[Math.max(cell.y0, Math.min(cell.y1 - 1, y)) * width + Math.max(cell.x0, Math.min(cell.x1 - 1, x))];
        for (let y = cell.y0; y < cell.y1; y++) {
            for (let x = cell.x0; x < cell.x1; x++) {
                const gx = (-sample(x - 1, y - 1) + sample(x + 1, y - 1) - 2 * sample(x - 1, y) + 2 * sample(x + 1, y) - sample(x - 1, y + 1) + sample(x + 1, y + 1)) / 8;
                const gy = (-sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1) + sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1)) / 8;
                // Same convention as NormalLight.make: the shader flips green into screen-down coordinates.
                const nx = -gx * strength, ny = gy * strength, length = Math.hypot(nx, ny, 1);
                this.encode(nx / length, ny / length, 1 / length, out, (y * width + x) * 4);
            }
            if ((y - cell.y0 + 1) % rowsPerSlice === 0) yield cell.x1 - cell.x0;
        }
    },

    normalsFromHeight(heights, width, height, options = {}) {
        const o = this.options(width, height, options);
        const out = new Uint8ClampedArray(width * height * 4);
        for (const cell of this.cells(width, height, o.grid)) {
            const steps = this.cellNormals(heights, width, out, cell, o.strength);
            while (!steps.next().done) { /* run to the end */ }
        }
        return out;
    },

    // The whole job as slices: each yield is a little work done, so the editor can spread it over frames.
    *job(pixels, width, height, options = {}) {
        const o = this.options(width, height, options);
        this.checkPixels(pixels, width, height);
        const { heights, cells } = yield* this.heightJob(pixels, width, height, o);
        const out = new Uint8ClampedArray(width * height * 4);
        for (const cell of cells) yield* this.cellNormals(heights, width, out, cell, o.strength);
        return out;
    },

    make(pixels, width, height, options = {}) {
        const steps = this.job(pixels, width, height, options);
        let step = steps.next();
        while (!step.done) step = steps.next();
        return step.value;
    }
};
