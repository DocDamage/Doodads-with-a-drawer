'use strict';
// npm run lint (and npm run verify): the built plugin, the scripts and the test suites. The plugin's 112
// parts share one scope once built, so the built file is linted: an accidental global (a typo, a missing
// const) or an unused variable shows up here, not in a playtest.
const globals = require('globals');

// What RPG Maker MZ (rmmz_core, rmmz_managers, rmmz_objects, rmmz_scenes, rmmz_sprites, rmmz_windows),
// PIXI, NW.js and Effekseer give a plugin.
const mz = {};
for (const name of [
    'PIXI', 'nw', 'effekseer', 'Utils', 'Graphics', 'Input', 'TouchInput', 'Bitmap', 'Sprite', 'TilingSprite', 'Tilemap',
    'ScreenSprite', 'Window', 'WindowLayer', 'Weather', 'ColorFilter', 'ToneFilter', 'Stage', 'WebAudio', 'Video', 'VideoPlayer',
    'JsonEx', 'Point', 'Rectangle', 'Game_Temp', 'Game_System', 'Game_Timer', 'Game_Message', 'Game_Switches', 'Game_Variables',
    'Game_SelfSwitches', 'Game_Screen', 'Game_Picture', 'Game_Item', 'Game_Action', 'Game_ActionResult', 'Game_BattlerBase',
    'Game_Battler', 'Game_Actor', 'Game_Enemy', 'Game_Actors', 'Game_Unit', 'Game_Party', 'Game_Troop', 'Game_Map',
    'Game_CommonEvent', 'Game_CharacterBase', 'Game_Character', 'Game_Player', 'Game_Follower', 'Game_Followers',
    'Game_Vehicle', 'Game_Event', 'Game_Interpreter', 'DataManager', 'ConfigManager', 'StorageManager', 'FontManager',
    'ImageManager', 'EffectManager', 'AudioManager', 'SoundManager', 'TextManager', 'ColorManager', 'SceneManager',
    'BattleManager', 'PluginManager', 'Scene_Base', 'Scene_Boot', 'Scene_Title', 'Scene_Message', 'Scene_Map',
    'Scene_MenuBase', 'Scene_Menu', 'Scene_ItemBase', 'Scene_Item', 'Scene_Skill', 'Scene_Equip', 'Scene_Status',
    'Scene_Options', 'Scene_File', 'Scene_Save', 'Scene_Load', 'Scene_GameEnd', 'Scene_Shop', 'Scene_Name', 'Scene_Debug',
    'Scene_Battle', 'Scene_Gameover', 'Sprite_Clickable', 'Sprite_Button', 'Sprite_Character', 'Sprite_Battler',
    'Sprite_Actor', 'Sprite_Enemy', 'Sprite_Animation', 'Sprite_AnimationMV', 'Sprite_Battleback', 'Sprite_Damage',
    'Sprite_Gauge', 'Sprite_Name', 'Sprite_StateIcon', 'Sprite_StateOverlay', 'Sprite_Weapon', 'Sprite_Balloon',
    'Sprite_Picture', 'Sprite_Timer', 'Sprite_Destination', 'Spriteset_Base', 'Spriteset_Map', 'Spriteset_Battle',
    'Window_Base', 'Window_Scrollable', 'Window_Selectable', 'Window_Command', 'Window_HorzCommand', 'Window_Help',
    'Window_Gold', 'Window_StatusBase', 'Window_MenuCommand', 'Window_MenuStatus', 'Window_Options', 'Window_SavefileList',
    'Window_EquipStatus', 'Window_Message', 'Window_ChoiceList', 'Window_NameBox', 'Window_ScrollText', 'Window_MapName',
    '$dataActors', '$dataClasses', '$dataSkills', '$dataItems', '$dataWeapons', '$dataArmors', '$dataEnemies', '$dataTroops',
    '$dataStates', '$dataAnimations', '$dataTilesets', '$dataCommonEvents', '$dataSystem', '$dataMapInfos', '$dataMap',
    '$gameTemp', '$gameSystem', '$gameScreen', '$gameTimer', '$gameMessage', '$gameSwitches', '$gameVariables',
    '$gameSelfSwitches', '$gameActors', '$gameParty', '$gameTroop', '$gameMap', '$gamePlayer', '$testEvent',
    // Doc's Doodads' own, made on window so other plugins and events can reach them.
    '$dataDocsDoodads', 'Sprite_DocsParticles', 'Sprite_DocsVfx', 'Sprite_DocsBillboards'
]) mz[name] = 'writable';

module.exports = [
    {
        files: ['Docs-Doodads.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: Object.assign({}, globals.browser, globals.node, mz)
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
            'no-redeclare': 'error',
            'no-dupe-keys': 'error',
            'no-unreachable': 'error',
            'no-self-assign': 'error',
            'no-const-assign': 'error'
        }
    },
    {
        files: ['scripts/**/*.js', 'scratch/**/*.js', 'eslint.config.js'],
        ignores: ['scratch/*_fixture/**'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            // The suites load the built plugin, which puts these on the global object.
            globals: Object.assign({}, globals.node, mz, { DocsDoodads: 'writable', Sprite_DocsDoodad: 'writable', window: 'writable', document: 'writable', localStorage: 'writable', Image: 'writable', requestAnimationFrame: 'writable', XMLHttpRequest: 'writable', performance: 'readonly' })
        },
        rules: {
            'no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-unreachable': 'error',
            'no-const-assign': 'error'
        }
    }
];
