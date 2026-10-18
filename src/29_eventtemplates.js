//==========================================================
// SECTION 18: DocsDoodads.EVENTTEMPLATES (ALL 20 BUILT-INS + CUSTOM)
//==========================================================
DocsDoodads.EventTemplates = {
    customPath: 'data/DocsDoodadsEventTemplates.json',
    templates: {
        npc: {
            name: "NPC (Talkable)",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "NPC"] },
                { code: 401, indent: 0, parameters: ["Hello! Safe travels on your adventure."] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        door: {
            name: "Door (Interactive)",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: false,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Open1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 17 }, { code: 18 }, { code: 0 }], repeat: false, skippable: false, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        transfer_door: {
            name: "Transfer Door",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Move1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 10, 10, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        chest: {
            name: "Treasure Chest",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: true,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Chest1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 125, indent: 0, parameters: [0, 0, 100] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Found 100 Gold!"] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ],
            // Opened: the sheet's open frame, and nothing more to take.
            after: { selfSwitch: 'A', image: { direction: 8, pattern: 1 } }
        },
        loot_pickup: {
            name: "Loot Pickup",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item3", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Obtained a Potion!"] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        signpost: {
            name: "Signpost",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "Notice"] },
                { code: 401, indent: 0, parameters: ["Beware of monsters ahead!"] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        floor_switch: {
            name: "Floor Switch",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        wall_lever: {
            name: "Wall Lever",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch2", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        save_point: {
            name: "Save Point",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Recovery", pan: 0, pitch: 100, volume: 90 }] },
                { code: 352, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        shopkeeper: {
            name: "Shopkeeper",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        enemy_encounter: {
            name: "Enemy Encounter",
            category: "Interaction",
            trigger: 1, priorityType: 1,
            list: [
                { code: 301, indent: 0, parameters: [0, 1, false, false] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        harvestable: {
            name: "Harvestable Herb/Ore",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ],
            // Picked: gone.
            after: { selfSwitch: 'A', image: 'none' }
        },
        breakable: {
            name: "Breakable Object",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Collapse1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        pushable: {
            name: "Pushable Boulder",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 11 }, { code: 0 }], repeat: false, skippable: true, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        light_source: {
            name: "Light Source / Campfire",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        animated_prop: {
            name: "Animated Prop",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true, walkAnime: false,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        teleporter: {
            name: "Magical Teleporter",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Teleport", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 5, 5, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        ladder_stairs: {
            name: "Ladder / Stairs",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 201, indent: 0, parameters: [0, 1, 8, 2, 8, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        vehicle: {
            name: "Vehicle Boarding",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 354, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        decoration_event: {
            name: "Decoration Event (Passable)",
            category: "Atmosphere",
            trigger: 0, priorityType: 0, through: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        }
    },

    init() {
        const custom = DocsDoodads.FS.readJson(this.customPath);
        if (custom) {
            Object.assign(this.templates, custom);
        }
    },

    get(templateKey) {
        return this.templates[templateKey] || this.templates.npc;
    },

    saveCustomTemplate(name, eventObj, category = "Custom") {
        const key = 'custom_' + name.toLowerCase().replace(/\s+/g, '_');
        const page0 = eventObj.pages && eventObj.pages[0] ? eventObj.pages[0] : {};
        const tmpl = {
            name: name,
            category: category,
            trigger: page0.trigger !== undefined ? page0.trigger : 0,
            priorityType: page0.priorityType !== undefined ? page0.priorityType : 1,
            directionFix: page0.directionFix || false,
            stepAnime: page0.stepAnime || false,
            walkAnime: page0.walkAnime !== undefined ? page0.walkAnime : true,
            through: page0.through || false,
            list: JSON.parse(JSON.stringify(page0.list || [{ code: 0, indent: 0, parameters: [] }])),
            // All of the event's pages (conditions, pictures, routes), so placing the template rebuilds it whole.
            pages: JSON.parse(JSON.stringify(eventObj.pages || []))
        };
        this.templates[key] = tmpl;

        let customData = DocsDoodads.FS.readJson(this.customPath) || {};
        customData[key] = tmpl;
        DocsDoodads.FS.atomicWriteJson(this.customPath, customData);
        return key;
    }
};

DocsDoodads.EventTemplates.init();


