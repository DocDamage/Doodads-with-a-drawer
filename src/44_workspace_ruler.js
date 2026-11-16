// @editor-only
//==========================================================
// SECTION 25: WORKSPACE: THE RULER
//==========================================================
// The Ruler tool (M): press, drag and let go to measure on the map, in tiles (across, down, the walk and the
// straight line) and pixels; Shift snaps both ends to tile middles. The last measure stays until the next one
// or another tool. It changes nothing, so there is no undo. In 3D it measures on the ground (the editor's
// picking already finds the ground point under the mouse) and the line is drawn in the view.
DocsDoodads.Ui.css += `
#dd-ruler-readout { position: fixed; z-index: 10034; padding: 5px 9px; font-size: 11px; font-weight: 800; pointer-events: none; white-space: nowrap; font-variant-numeric: tabular-nums; }
`;
DocsDoodads.Ui.hints.ruler = 'Ruler: press and drag to measure (Shift: tile middles). Esc to stop.';
Object.assign(DocsDoodads.Ui.mapPalettes.standard, { ruler: 0xf472b6 });
Object.assign(DocsDoodads.Ui.mapPalettes.safe, { ruler: 0xcc79a7 });
DocsDoodads.Ui.mapColorMeanings.push(['ruler', 'Ruler']);

Object.assign(DocsDoodads.Workspace, {
    // The point under the mouse for the ruler: map pixels, snapped to a tile middle with Shift.
    rulerPoint(e) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        const p = { x: at.x, y: at.y };
        if (!e.shiftKey || typeof $gameMap === 'undefined' || !$gameMap) return p;
        return DocsDoodads.Ruler.snap(p, $gameMap.tileWidth(), $gameMap.tileHeight());
    },

    // The measure so far, or null.
    rulerMeasure() {
        const r = this._ruler;
        if (!r || typeof $gameMap === 'undefined' || !$gameMap) return null;
        return DocsDoodads.Ruler.measure(r.from, r.to, $gameMap.tileWidth(), $gameMap.tileHeight());
    },

    showRulerReadout() {
        const m = this.rulerMeasure();
        if (!m || typeof document === 'undefined' || !document.createElement) return;
        let el = document.getElementById('dd-ruler-readout');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-ruler-readout';
            el.className = 'dd-glass';
            document.body.appendChild(el);
        }
        const text = DocsDoodads.Ruler.label(m);
        if (el.textContent !== text) el.textContent = text;
        const c = this._ruler.client;
        if (c) {
            el.style.left = Math.round(c.x + 14) + 'px';
            el.style.top = Math.round(c.y + 14) + 'px';
        }
        el.style.display = '';
    },

    hideRulerReadout() {
        const el = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-ruler-readout') : null;
        if (el && el.style.display !== 'none') el.style.display = 'none';
    },

    // The ruler's line in screen pixels: [from, to], through the 3D camera when there is one.
    rulerScreenLine() {
        const r = this._ruler;
        if (!r) return null;
        const P = DocsDoodads.Perspective;
        const cam = P && P.liveCamera ? P.liveCamera() : null;
        const ends = [r.from, r.to].map(p => {
            const s = DocsDoodads.mapToScreen(p.x, p.y);
            return cam ? P.flatToScreen(s.x, s.y) : s;
        });
        return ends.every(Boolean) ? ends : null;
    },

    drawRulerLine(g, line) {
        const colour = DocsDoodads.Ui.mapColor('ruler');
        g.lineStyle(4, 0x111111, 0.45);
        g.moveTo(line[0].x, line[0].y);
        g.lineTo(line[1].x, line[1].y);
        g.lineStyle(2, colour, 1);
        g.moveTo(line[0].x, line[0].y);
        g.lineTo(line[1].x, line[1].y);
        g.lineStyle(0);
        for (const p of line) {
            g.beginFill(colour, 1);
            g.drawCircle(p.x, p.y, 4);
            g.endFill();
        }
    }
});

DocsDoodads.Workspace.toolHooks.ruler = {
    down(e) {
        const p = this.rulerPoint(e);
        this._ruler = { from: p, to: { x: p.x, y: p.y }, client: { x: e.clientX, y: e.clientY } };
        return true;
    },
    move(e, stroking) {
        if (!stroking || !this._ruler) return;
        this._ruler.to = this.rulerPoint(e);
        this._ruler.client = { x: e.clientX, y: e.clientY };
    },
    up() {
        // The measure stays; the click that follows the release doesn't pick anything.
        this._suppressNextClick = true;
    },
    // Flat maps: the line on the editor's overlay. (In 3D, updateDocsGizmos draws it.)
    overlay(g) {
        if (this.placementTool !== 'ruler' || !this._ruler) {
            this.hideRulerReadout();
            if (this.placementTool !== 'ruler') this._ruler = null;
            return;
        }
        this.showRulerReadout();
        const P = DocsDoodads.Perspective;
        if (P && P.liveCamera && P.liveCamera()) return;
        const line = this.rulerScreenLine();
        if (line) this.drawRulerLine(g, line);
    }
};
