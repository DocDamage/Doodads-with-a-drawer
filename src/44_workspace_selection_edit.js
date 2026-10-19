//==========================================================
// SECTION 25g: WORKSPACE SELECTION EDITING (NUMBER SCRUBBING, HANDLES)
//==========================================================
// Numbers in Details change by dragging their label left and right, and step with the arrow keys
// (Shift: ten steps). A picked doodad has handles: corners to resize (Shift keeps its proportions) and
// a knob above it to turn it (Shift snaps to 15 degrees). Each drag is one undo step.
DocsDoodads.Ui.css += `
.dd-scrub { cursor: ew-resize; user-select: none; }
.dd-scrub:hover { color: var(--dd-primary) !important; }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Number scrubbing ----
    numberStep(input) {
        const step = parseFloat(input.step);
        return step > 0 ? step : 1;
    },

    // Round to the step's own decimals, so 0.05 steps never show 0.30000000000000004.
    stepValue(value, step) {
        const decimals = (String(step).split('.')[1] || '').length;
        const n = Math.round(value / step) * step;
        return Number(n.toFixed(Math.min(6, decimals)));
    },

    applyNumberInput(input, value) {
        const min = input.min !== undefined && input.min !== '' ? parseFloat(input.min) : -Infinity;
        const max = input.max !== undefined && input.max !== '' ? parseFloat(input.max) : Infinity;
        const v = Math.max(min, Math.min(max, value));
        input.value = String(this.stepValue(v, this.numberStep(input)));
        if (typeof input.oninput === 'function') input.oninput({ target: input });
        return input.value;
    },

    commitNumberInput(input) {
        if (typeof input.onchange === 'function') input.onchange({ target: input });
    },

    // Every number box in Details: its label scrubs, the arrows step.
    attachNumberScrubbing(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return 0;
        let n = 0;
        for (const input of Array.from(root.querySelectorAll('input[type=number]'))) {
            if (input._ddScrub) continue;
            input._ddScrub = true;
            n++;
            if (input.addEventListener) input.addEventListener('keydown', e => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                if (e.preventDefault) e.preventDefault();
                const start = String(input.value).trim() === '' ? 0 : parseFloat(input.value) || 0;
                const step = this.numberStep(input) * (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
                this.applyNumberInput(input, start + step);
                this.commitNumberInput(input);
            });
            const label = (input.id && root.querySelector ? root.querySelector(`label[for="${input.id}"]`) : null) ||
                (input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL' ? input.previousElementSibling : null);
            if (!label || label._ddScrub) continue;
            label._ddScrub = true;
            if (label.classList) label.classList.add('dd-scrub');
            if (!label.title) label.title = 'Drag left or right to change';
            label.onmousedown = e => this.beginScrub(input, e);
        }
        return n;
    },

    // Two pixels of drag a step (Shift: ten steps).
    beginScrub(input, e) {
        if (e && e.button !== undefined && e.button !== 0) return false;
        if (e && e.preventDefault) e.preventDefault();
        const start = String(input.value).trim() === '' ? 0 : parseFloat(input.value) || 0;
        const scrub = this._scrub = { input, startX: e ? e.clientX : 0, start, moved: false };
        const move = ev => {
            if (this._scrub !== scrub) return;
            const dx = ev.clientX - scrub.startX;
            if (!scrub.moved && Math.abs(dx) < 2) return;
            scrub.moved = true;
            this.applyNumberInput(input, scrub.start + Math.round(dx / 2) * this.numberStep(input) * (ev.shiftKey ? 10 : 1));
        };
        const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            if (this._scrub !== scrub) return;
            this._scrub = null;
            if (scrub.moved) this.commitNumberInput(input);
            else if (input.focus) input.focus();
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return true;
    },

    // ---- Handles on the picked doodad ----
    // The one picked doodad they work on (unlocked, shown, on a flat map), or null.
    handleTarget() {
        const items = this.selectionItems();
        if (items.length !== 1) return null;
        const d = items[0];
        if (!d || d.locked || d.editorHidden || d.posMode === 0) return null;
        if (DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera()) return null;
        return d;
    },

    // In screen (canvas) pixels: the four corners resize, the knob above turns.
    transformHandles() {
        const d = this.handleTarget();
        if (!d) return [];
        const box = this.selectionScreenRects()[0];
        if (!box) return [];
        // A small doodad's handles spread out to a 28-pixel box, so they don't sit on top of each other.
        const px = Math.max(0, (28 - box.w) / 2), py = Math.max(0, (28 - box.h) / 2);
        const r = { x: box.x - px, y: box.y - py, w: box.w + px * 2, h: box.h + py * 2 };
        return [
            { kind: 'scale', corner: 'nw', x: r.x, y: r.y },
            { kind: 'scale', corner: 'ne', x: r.x + r.w, y: r.y },
            { kind: 'scale', corner: 'sw', x: r.x, y: r.y + r.h },
            { kind: 'scale', corner: 'se', x: r.x + r.w, y: r.y + r.h },
            { kind: 'rotate', x: r.x + r.w / 2, y: r.y - 22, stemY: r.y }
        ];
    },

    handleAt(point) {
        if (!point) return null;
        return this.transformHandles().find(h => Math.abs(h.x - point.x) <= 8 && Math.abs(h.y - point.y) <= 8) || null;
    },

    drawTransformHandles(g) {
        const handles = this.transformHandles();
        if (!handles.length) return;
        const color = DocsDoodads.Ui.mapColor('selection');
        for (const h of handles) {
            if (h.kind === 'rotate') {
                g.lineStyle(1, color, 0.9);
                g.moveTo(h.x, h.stemY);
                g.lineTo(h.x, h.y + 5);
                g.lineStyle(2, color, 1);
                g.beginFill(0xffffff, 1);
                g.drawCircle(h.x, h.y, 5);
            } else {
                g.lineStyle(2, color, 1);
                g.beginFill(0xffffff, 1);
                g.drawRect(h.x - 4, h.y - 4, 8, 8);
            }
            g.endFill();
        }
        g.lineStyle(0);
    },

    beginHandleDrag(handle, point) {
        const d = this.handleTarget();
        if (!d || !handle) return false;
        const anchor = DocsDoodads.mapToScreen(d.x, d.y);
        this._handleDrag = {
            handle, d, anchor, start: point,
            before: this.snapshotDoodads([d]),
            scaleX: d.scaleX !== undefined ? d.scaleX : 1,
            scaleY: d.scaleY !== undefined ? d.scaleY : 1,
            rotation: Number(d.rotation) || 0,
            angle: Math.atan2(point.y - anchor.y, point.x - anchor.x),
            moved: false
        };
        return true;
    },

    // shift: keep proportions (resize) or snap to 15 degrees (turn).
    updateHandleDrag(point, shift) {
        const drag = this._handleDrag;
        if (!drag || !point) return null;
        const { d, anchor, start } = drag;
        if (Math.abs(point.x - start.x) + Math.abs(point.y - start.y) > 0) drag.moved = true;
        const round = v => Math.round(v * 100) / 100;
        if (drag.handle.kind === 'rotate') {
            let deg = drag.rotation + (Math.atan2(point.y - anchor.y, point.x - anchor.x) - drag.angle) * 180 / Math.PI;
            if (shift) deg = Math.round(deg / 15) * 15;
            deg = ((Math.round(deg) % 360) + 540) % 360 - 180;
            d.rotation = deg === -180 ? 180 : deg;
            this.refreshSpriteset(true);
            return { rotation: d.rotation };
        }
        // Sizes change around the doodad's foot (it stays where it stands). A corner level with the foot
        // (the bottom ones) can only say how wide: the height follows.
        const rx = Math.abs(start.x - anchor.x) >= 4 ? Math.abs(point.x - anchor.x) / Math.abs(start.x - anchor.x) : null;
        const ry = Math.abs(start.y - anchor.y) >= 4 ? Math.abs(point.y - anchor.y) / Math.abs(start.y - anchor.y) : null;
        let fx = rx !== null ? rx : ry, fy = ry !== null ? ry : rx;
        if (fx === null) return null;
        if (shift || ry === null || rx === null) { const both = rx !== null && ry !== null ? Math.max(rx, ry) : fx; fx = both; fy = both; }
        const clamp = v => Math.max(0.05, Math.min(20, v));
        d.scaleX = round(clamp(Math.abs(drag.scaleX) * fx)) * (drag.scaleX < 0 ? -1 : 1);
        d.scaleY = round(clamp(Math.abs(drag.scaleY) * fy)) * (drag.scaleY < 0 ? -1 : 1);
        this.refreshSpriteset(true);
        return { scaleX: d.scaleX, scaleY: d.scaleY };
    },

    endHandleDrag() {
        const drag = this._handleDrag;
        this._handleDrag = null;
        this.hideDragReadout();
        if (!drag || !drag.moved) return false;
        if (JSON.stringify(this.snapshotDoodads([drag.d])) === JSON.stringify(drag.before)) return false;
        this.recordDoodadEdit([drag.d], drag.before, 'transform_doodad');
        this.refreshInspector();
        return true;
    },

    // What a handle drag shows beside the cursor.
    handleReadoutText() {
        const drag = this._handleDrag;
        if (!drag) return '';
        const d = drag.d;
        if (drag.handle.kind === 'rotate') return `Turn ${Math.round(Number(d.rotation) || 0)}°`;
        const w = Math.round((d.frameW || 48) * Math.abs(d.scaleX)), h = Math.round((d.frameH || 48) * Math.abs(d.scaleY));
        return `Size ×${Math.abs(d.scaleX)} × ${Math.abs(d.scaleY)} · ${w}×${h} px`;
    },

    showHandleReadout(clientX, clientY) {
        if (typeof document === 'undefined' || !this._handleDrag) return;
        let el = document.getElementById('dd-drag-readout');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-drag-readout';
            document.body.appendChild(el);
        }
        el.textContent = this.handleReadoutText();
        el.style.left = Math.round(clientX + 18) + 'px';
        el.style.top = Math.round(clientY + 20) + 'px';
    }
});
