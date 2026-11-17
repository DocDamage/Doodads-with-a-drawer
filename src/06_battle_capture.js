// Temporary visibility belongs to the capture, including objects outside the character's own tree.
DocsDoodads.BattleCapture = {
    named() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return false;
        return ['battleback1Name', 'battleback2Name'].some(key => typeof $gameMap[key] === 'function' && Boolean($gameMap[key]()));
    },
    withHidden(spriteset, capture, afterRestore) {
        const hidden = new Map();
        const hide = object => {
            if (!object || hidden.has(object)) return;
            hidden.set(object, object.visible); object.visible = false;
        };
        if (typeof spriteset.removeDocsPlacementPreview === 'function') spriteset.removeDocsPlacementPreview();
        const conceal = () => {
            for (const sp of spriteset._characterSprites || []) {
                hide(sp); hide(sp._docsShadow);
                for (const layer of sp._docsVisualSprites || []) hide(layer);
            }
            for (const key of ['_pictureContainer', '_timerSprite', '_shadowSprite', '_docsMinimap', '_destinationSprite', '_docsTraceSprite', '_docsSelectionOutline']) hide(spriteset[key]);
            for (const object of (spriteset._balloonSprites || []).concat(spriteset._animationSprites || [])) hide(object);
            for (const object of hidden.keys()) object.visible = false;
        };
        const restore = () => { for (const [object, visible] of hidden) object.visible = visible; };
        try {
            conceal();
            if (typeof spriteset.updateDocsReflections === 'function') spriteset.updateDocsReflections();
            return capture(conceal);
        } finally {
            restore();
            try { if (afterRestore) afterRestore(); }
            finally {
                restore();
                if (typeof spriteset.updateDocsReflections === 'function') spriteset.updateDocsReflections();
            }
        }
    }
};
