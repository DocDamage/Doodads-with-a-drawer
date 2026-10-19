//==========================================================
// SECTION 25u: THE EDITOR'S LANGUAGE (LOOK CARD)
//==========================================================
// More > Look > Editor language: English, or any translation in data/DocsDoodadsLanguages (DocsDoodads.I18n).
Object.assign(DocsDoodads.Ui, {
    // The language picked in Look (on this computer).
    applyLanguage() {
        const code = this.prefs().language || 'en';
        if (DocsDoodads.I18n.lang !== code) DocsDoodads.I18n.load(code);
        return DocsDoodads.I18n.lang;
    }
});

Object.assign(DocsDoodads.Workspace, {
    setLanguage(code) {
        const U = DocsDoodads.Ui, I = DocsDoodads.I18n;
        const list = I.available();
        const pick = list.some(l => l.code === code) ? code : 'en';
        U.setPref('language', pick);
        I.load(pick);
        if (typeof document !== 'undefined' && document.body) I.translateTree(document.body);
        // English words come back only when a part is drawn again.
        if (this.mounted) this.showToast(pick === 'en' ? 'English: close and open the editor again to see every part in English.' : `${I.name}: parts not translated yet stay English.`, 'info');
        return pick;
    }
});

(function() {
    const W = DocsDoodads.Workspace;
    const baseLook = W.showLookCard;
    W.showLookCard = function() {
        const card = baseLook.call(this);
        if (card && typeof card.innerHTML === 'string' && !card.innerHTML.includes('dd-look-language')) {
            const I = DocsDoodads.I18n;
            const langs = I.available();
            const label = document.createElement('label');
            label.innerHTML = `Editor language<select id="dd-look-language">${langs.map(l => `<option value="${escapeHtml(l.code)}"${l.code === I.lang ? ' selected' : ''}>${escapeHtml(l.name)}</option>`).join('')}</select>` +
                (langs.length === 1 ? '<span style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Only English so far. A translation goes in data/DocsDoodadsLanguages (see the guide).</span>' : '');
            if (card.appendChild) card.appendChild(label);
            const select = document.getElementById('dd-look-language') || (label.querySelector ? label.querySelector('select') : null);
            if (select) select.onchange = e => this.setLanguage(e.target.value);
        }
        return card;
    };
    const baseLayout = W.layoutPanels;
    W.layoutPanels = function() {
        DocsDoodads.Ui.applyLanguage();
        baseLayout.call(this);
    };
})();
