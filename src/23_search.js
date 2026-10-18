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
            negative: []
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

        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('-')) {
                tokens.negative.push(p.slice(1).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('type:')) {
                tokens.types.push(p.slice(5).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('tag:')) {
                tokens.tags.push(p.slice(4).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('folder:')) {
                tokens.folders.push(p.slice(7).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('favorite:')) {
                tokens.favorite = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('used:')) {
                const value = p.slice(5).toLowerCase();
                tokens.used = /^(yes|true|1)$/.test(value) ? true : /^(no|false|0)$/.test(value) ? false : null;
            } else if (p.startsWith('collection:')) {
                tokens.collections.push(p.slice(11).replace(/["']/g, '').toLowerCase());
            } else {
                tokens.terms.push(p.toLowerCase());
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
        if (parsed.favorite !== null && asset.favorite !== parsed.favorite) return false;
        if (parsed.used !== null && parsed.used !== undefined && DocsDoodads.Usage.lastIndex) {
            const used = DocsDoodads.Usage.isUsed(asset);
            if (parsed.used && !used) return false;
            if (!parsed.used && (used || DocsDoodads.Usage.isEngineReserved(asset))) return false;
        }
        if (parsed.types.length > 0 && !parsed.types.includes((asset.type || '').toLowerCase())) return false;
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

