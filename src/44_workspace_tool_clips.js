// @editor-only
//==========================================================
// SECTION 25T: MOVING TOOLTIPS (8.2.3)
//==========================================================
// A main tool's tooltip plays a short drawn clip of the tool in use (DocsDoodads.ToolClipArt, built by
// scripts/tool_clips.js), once the tooltip has been up for a moment. Never with Less motion (Look, or the
// system's reduced-motion setting); other tooltips are unchanged.
DocsDoodads.Ui.css += `
#dd-tooltip .dd-tip-clip { display: block; margin-top: 6px; border-radius: 6px; image-rendering: pixelated; background-repeat: no-repeat;
    animation-name: dd-tip-clip; animation-iteration-count: infinite; animation-direction: normal; }
@keyframes dd-tip-clip { from { background-position: 0 0; } to { background-position: var(--dd-clip-end) 0; } }
`;

DocsDoodads.ToolClips = {
    delay: 700,
    scale: 2,
    seconds: 1.6,

    clipFor(el) {
        const art = DocsDoodads.ToolClipArt, id = el && el.id;
        return art && id && art.clips && Object.prototype.hasOwnProperty.call(art.clips, id) ? art.clips[id] : null;
    },

    // The clip element for a tooltip: a strip of frames stepped through with CSS.
    element(url, scale) {
        const art = DocsDoodads.ToolClipArt, s = scale || this.scale;
        const clip = document.createElement('div');
        clip.className = 'dd-tip-clip';
        const width = art.frameW * s, height = art.frameH * s, total = width * art.frames;
        clip.style.cssText = `width:${width}px;height:${height}px;background-image:url("${url}");background-size:${total}px ${height}px;` +
            `animation-duration:${this.seconds}s;animation-timing-function:steps(${art.frames});--dd-clip-end:-${total}px;`;
        clip.setAttribute('aria-hidden', 'true');
        return clip;
    },

    // The clip fills the tooltip's width in whole steps (sharp pixels), never smaller than the usual scale.
    scaleFor(tip) {
        const art = DocsDoodads.ToolClipArt;
        if (!tip || !art || !(art.frameW > 0) || typeof getComputedStyle === 'undefined') return this.scale;
        const css = getComputedStyle(tip), inner = tip.clientWidth - (parseFloat(css.paddingLeft) || 0) - (parseFloat(css.paddingRight) || 0);
        return Math.max(this.scale, Math.floor(inner / art.frameW) || 0);
    },

    // Called with each tooltip as it opens; adds the clip after the delay if the tooltip is still up.
    decorate(el, tip, U = DocsDoodads.Ui) {
        const url = this.clipFor(el);
        if (!url || !tip || (U.lessMotion && U.lessMotion())) return null;
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            const shown = U._tooltip;
            if (!shown || shown.tip !== tip || shown.el !== el || (U.lessMotion && U.lessMotion())) return;
            tip.appendChild(this.element(url, this.scaleFor(tip)));
            // Taller now: keep it inside the window.
            const roomH = (typeof window !== 'undefined' && window.innerHeight) || 624, top = parseFloat(tip.style.top) || 0;
            if (top + tip.offsetHeight > roomH - 6) tip.style.top = Math.round(Math.max(6, roomH - tip.offsetHeight - 6)) + 'px';
        }, this.delay);
        if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
        return this._timer;
    }
};

(function() {
    const U = DocsDoodads.Ui, show = U.showTooltip, hide = U.hideTooltip;
    U.showTooltip = function(el) {
        const tip = show.call(this, el);
        if (tip) DocsDoodads.ToolClips.decorate(el, tip, this);
        return tip;
    };
    U.hideTooltip = function() {
        clearTimeout(DocsDoodads.ToolClips._timer);
        return hide.apply(this, arguments);
    };
})();
