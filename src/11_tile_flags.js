// @editor-only
//==========================================================
// SECTION 5F: TILESET FLAGS (9.4.1)
//==========================================================
// MZ keeps a tile's settings as bits of one number in Tilesets.json (rmmz_objects.js): 0x0f the four blocked
// sides (down, left, right, up), 0x10 ☆ (over characters, no effect on passage), 0x20 ladder, 0x40 bush, 0x80
// counter, 0x100 damage floor, 0x200 / 0x400 boat / ship cannot pass, 0x800 the airship cannot land, and the
// terrain tag in the bits above (flag >> 12). An autotile's 48 shapes share one setting.
DocsDoodads.TileFlags = {
    bits: { down: 0x01, left: 0x02, right: 0x04, up: 0x08, star: 0x10, ladder: 0x20, bush: 0x40, counter: 0x80, damage: 0x100, boat: 0x200, ship: 0x400, airship: 0x800 },
    // What the Flags card can show, as MZ's database tabs.
    modes: [
        { id: 'pass', label: 'Passage', hint: 'Click: ○ walk, × blocked, ☆ over characters (B-E only)' },
        { id: 'dirs', label: 'Passage (4 dir)', hint: 'Click near a side to block or open it' },
        { id: 'ladder', label: 'Ladder' }, { id: 'bush', label: 'Bush' }, { id: 'counter', label: 'Counter' },
        { id: 'damage', label: 'Damage floor' }, { id: 'boat', label: 'Boat' }, { id: 'ship', label: 'Ship' },
        { id: 'airship', label: 'Airship landing' },
        { id: 'terrain', label: 'Terrain tag', hint: 'Click: one up; right-click: one down (0-7)' }
    ],

    read(flag) {
        const f = Number(flag) || 0, b = this.bits;
        const dirs = { down: Boolean(f & b.down), left: Boolean(f & b.left), right: Boolean(f & b.right), up: Boolean(f & b.up) };
        const blocked = (f & 0x0f);
        return {
            pass: f & b.star ? 'star' : blocked === 0x0f ? 'x' : blocked === 0 ? 'o' : 'some',
            dirs,
            star: Boolean(f & b.star),
            ladder: Boolean(f & b.ladder), bush: Boolean(f & b.bush), counter: Boolean(f & b.counter), damage: Boolean(f & b.damage),
            // MZ's database shows ○ where a boat or ship can pass and the airship can land: the bit clear.
            boat: !(f & b.boat), ship: !(f & b.ship), airship: !(f & b.airship),
            terrain: (f >> 12) & 0x0f
        };
    },

    // The number after a change; only the named settings move.
    write(flag, change) {
        let f = Number(flag) || 0;
        const b = this.bits, set = (bit, on) => { f = on ? (f | bit) : (f & ~bit); };
        change = change || {};
        if (change.pass === 'o') { set(0x0f, false); set(b.star, false); }
        else if (change.pass === 'x') { set(0x0f, true); set(b.star, false); }
        else if (change.pass === 'star') { set(0x0f, false); set(b.star, true); }
        if (change.dirs) for (const k of ['down', 'left', 'right', 'up']) if (change.dirs[k] !== undefined) set(b[k], Boolean(change.dirs[k]));
        for (const k of ['ladder', 'bush', 'counter', 'damage']) if (change[k] !== undefined) set(b[k], Boolean(change[k]));
        for (const k of ['boat', 'ship', 'airship']) if (change[k] !== undefined) set(b[k], !change[k]);
        if (change.terrain !== undefined) {
            const t = Math.max(0, Math.min(7, Math.floor(Number(change.terrain) || 0)));
            f = (f & 0x0fff) | (t << 12);
        }
        return f;
    },

    isAutotile(id) { return Number(id) >= 2048; },

    // Every id that changes together: an autotile kind's 48 shapes; any other tile alone.
    idsFor(tileId) {
        const id = Number(tileId) || 0;
        if (id < 2048) return [id];
        const start = 2048 + Math.floor((id - 2048) / 48) * 48, out = [];
        for (let i = 0; i < 48; i++) out.push(start + i);
        return out;
    },

    // One click as MZ's database does it. side: 'down' | 'left' | 'right' | 'up' (4 dir); back: a right-click.
    step(flag, mode, opts = {}) {
        const r = this.read(flag);
        switch (mode) {
            case 'pass': {
                const order = opts.allowStar ? ['o', 'x', 'star'] : ['o', 'x'];
                const now = r.pass === 'some' ? 'x' : (r.pass === 'star' && !opts.allowStar ? 'x' : r.pass);
                return this.write(flag, { pass: order[(order.indexOf(now) + 1) % order.length] });
            }
            case 'dirs': {
                if (!opts.side || !(opts.side in r.dirs)) return Number(flag) || 0;
                return this.write(flag, { dirs: { [opts.side]: !r.dirs[opts.side] } });
            }
            case 'terrain': return this.write(flag, { terrain: (r.terrain + (opts.back ? 7 : 1)) % 8 });
            case 'ladder': case 'bush': case 'counter': case 'damage': case 'boat': case 'ship': case 'airship':
                return this.write(flag, { [mode]: !r[mode] });
        }
        return Number(flag) || 0;
    },

    // The mark drawn on a tile in a mode: text and whether it reads as "on".
    mark(flag, mode) {
        const r = this.read(flag);
        if (mode === 'pass') return { text: r.pass === 'star' ? '☆' : r.pass === 'o' ? '○' : r.pass === 'x' ? '×' : '·', on: r.pass !== 'x' };
        if (mode === 'terrain') return { text: String(r.terrain), on: r.terrain > 0 };
        if (mode === 'dirs') return { text: '', on: true, dirs: r.dirs };
        const on = Boolean(r[mode]);
        return { text: on ? '○' : '·', on };
    },

    // Which side of a tile a click was nearest: x and y within the tile from 0 to 1.
    sideAt(fx, fy) {
        const d = { left: fx, right: 1 - fx, up: fy, down: 1 - fy };
        return Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a), 'down');
    },

    // How many maps use a tileset (from MapInfos and each map's tilesetId), for the warning before a change.
    mapsUsing(tilesetId, mapTilesets) {
        return Object.values(mapTilesets || {}).filter(id => Number(id) === Number(tilesetId)).length;
    },

    // Tilesets.json as MZ writes it: one entry a line.
    fileText(list) {
        return '[\n' + (list || []).map(t => JSON.stringify(t === undefined ? null : t)).join(',\n') + '\n]';
    }
};
