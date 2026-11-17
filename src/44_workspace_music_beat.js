// @editor-only
(function() {
    const W = DocsDoodads.Workspace, sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this);
        const bands = [{ value: 'none', label: 'Off' }, { value: 'low', label: 'Bass' }, { value: 'mid', label: 'Middle' }, { value: 'high', label: 'Treble' }];
        for (const [title, prefix] of [['Motion', 'motion'], ['Light', 'light']]) {
            const section = all.find(s => s.title === title);
            if (section) section.fields.push({ key: prefix + '.musicBand', label: 'With the music', type: 'select', options: bands },
                { key: prefix + '.musicStrength', label: 'Music strength', type: 'range', min: 0, max: 1, step: 0.05 });
        }
        const particles = all.find(s => s.title === 'Particles');
        if (particles) particles.fields.push({ key: 'particles.musicTrigger', label: 'Emits', type: 'select', options: [{ value: 'always', label: 'Continuously' }, { value: 'kick', label: 'On a music kick' }] });
        return all;
    };
    Object.assign(W.propertyFallbacks, { 'motion.musicBand': 'none', 'motion.musicStrength': 1, 'light.musicBand': 'none', 'light.musicStrength': 1, 'particles.musicTrigger': 'always' });
})();
