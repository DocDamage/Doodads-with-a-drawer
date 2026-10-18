//==========================================================
// SECTION 12: DocsDoodads.SEARCH (TOKENIZED QUERY PARSER)
//==========================================================
DocsDoodads.Search = {
    parseQuery(queryString) {
        const tokens = {
            terms: [],
            types: [],
            tags: [],
            folders: [],
            favorite: null,
            animated: null,
            collections: [],
            used: null,
            negative: [],
            // Prefixed terms with a minus, e.g. -tag:"deep woods", leave matching assets out.
            categories: [],
            exclude: { types: [], tags: [], folders: [], collections: [], categories: [] }
        };
        if (!queryString) return tokens;

        // Parse tokens supporting quoted phrases, e.g. collection:"Castle Set" or -tag:"deep woods"
        const parts = [];
        const regex = /(-?\w+:)?("[^"]*"|'[^']*'|[^\s]+)/g;
        let match;
        while ((match = regex.exec(queryString)) !== null) {
            const prefix = match[1] || '';
            const val = match[2].replace(/^["']|["']$/g, '');
            parts.push(prefix + val);
        }

        const lists = { type: 'types', tag: 'tags', folder: 'folders', collection: 'collections', category: 'categories' };
        const yes = value => /^(yes|true|1)$/.test(value) ? true : /^(no|false|0)$/.test(value) ? false : null;
        for (const part of parts) {
            const negated = part.startsWith('-');
            const p = negated ? part.slice(1) : part;
            const m = /^(type|tag|folder|collection|category|favorite|animated|used):(.*)$/i.exec(p);
            const key = m ? m[1].toLowerCase() : null;
            const value = (m ? m[2] : p).replace(/["']/g, '').toLowerCase();
            // A lone "-" (still being typed) or an empty "tag:" means nothing yet.
            if (!value) continue;
            if (lists[key]) {
                (negated ? tokens.exclude[lists[key]] : tokens[lists[key]]).push(value);
            } else if (key) {
                const flag = yes(value);
                if (flag !== null) tokens[key] = negated ? !flag : flag;
            } else if (negated) {
                tokens.negative.push(value);
            } else {
                tokens.terms.push(value);
            }
        }
        return tokens;
    },

    matches(asset, parsed) {
        for (const neg of parsed.negative) {
            if ((asset.fileName && asset.fileName.toLowerCase().includes(neg)) || (asset.path && asset.path.toLowerCase().includes(neg))) {
                return false;
            }
        }
        const ex = parsed.exclude;
        if (ex) {
            const lower = list => (list || []).map(v => String(v).toLowerCase());
            if (ex.types.length && ex.types.includes((asset.type || '').toLowerCase())) return false;
            if (ex.folders.length && ex.folders.some(f => (asset.path || '').toLowerCase().includes(f))) return false;
            if (ex.tags.length) {
                const tags = lower([...(asset.tags || []), ...(asset.autoTags || [])]);
                if (ex.tags.some(t => tags.includes(t))) return false;
            }
            if (ex.collections.length && ex.collections.some(c => lower(asset.collections).includes(c))) return false;
            if (ex.categories && ex.categories.length && ex.categories.includes((asset.category || '').toLowerCase())) return false;
        }
        if (parsed.favorite !== null && parsed.favorite !== undefined && Boolean(asset.favorite) !== parsed.favorite) return false;
        if (parsed.animated !== null && parsed.animated !== undefined) {
            const frames = DocsDoodads.AnimatedThumb.framesFor(asset);
            if (Boolean(frames && frames.length > 1) !== parsed.animated) return false;
        }
        if (parsed.used !== null && parsed.used !== undefined && DocsDoodads.Usage.lastIndex) {
            const used = DocsDoodads.Usage.isUsed(asset);
            if (parsed.used && !used) return false;
            if (!parsed.used && (used || DocsDoodads.Usage.isEngineReserved(asset))) return false;
        }
        if (parsed.types.length > 0 && !parsed.types.includes((asset.type || '').toLowerCase())) return false;
        if (parsed.categories && parsed.categories.length > 0 && !parsed.categories.includes((asset.category || '').toLowerCase())) return false;
        if (parsed.folders.length > 0) {
            const pathLower = (asset.path || '').toLowerCase();
            if (!parsed.folders.some(f => pathLower.includes(f))) return false;
        }
        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
        }
        if (parsed.collections && parsed.collections.length > 0) {
            const assetCols = (asset.collections || []).map(c => c.toLowerCase());
            if (!parsed.collections.some(c => assetCols.includes(c))) return false;
        }
        if (parsed.terms.length > 0) {
            const searchHaystack = (asset.fileName + " " + (asset.tags || []).join(" ") + " " + (asset.autoTags || []).join(" ")).toLowerCase();
            for (const t of parsed.terms) {
                if (!searchHaystack.includes(t)) return false;
            }
        }
        return true;
    },

    filter(assets, queryString) {
        const parsed = this.parseQuery(queryString);
        return assets.filter(a => this.matches(a, parsed));
    }
};

