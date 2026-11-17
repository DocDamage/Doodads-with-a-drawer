'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine'); E.install(); E.setupWorld();
global.Game_Screen = class {
    constructor(){this._weatherType='none';this._weatherPower=0;this._weatherPowerTarget=0;this._weatherDuration=0;}
    changeWeather(type,power,duration){this._weatherType=type;this._weatherPower=power;this._weatherPowerTarget=power;this._weatherDuration=duration;}
    weatherType(){return this._weatherType;} weatherPower(){return this._weatherPower;}
};
global.$gameScreen = new Game_Screen();
let requests = 0; global.fetch = () => {requests++;throw Error('plain words must stay offline');};
require('../Docs-Doodads.js');
const D = DocsDoodads, P = D.PlainWords, W = D.Workspace;
assert.ok(P,'offline phrase parser exists');
const commands = text => P.parse(text).map(step=>step.command);
assert.deepStrictEqual(commands('make it a rainy night'),['time 21:00','weather rain']);
assert.deepStrictEqual(commands('please make the map foggy and darker'),['darkness darker','fog on']);
assert.deepStrictEqual(commands('bigger'),['size bigger']);
assert.deepStrictEqual(commands('not rainy'),[]);
assert.deepStrictEqual(commands('night and morning'),[],'conflicting values do nothing');
assert.deepStrictEqual(commands('rain and snow'),[]);
assert.deepStrictEqual(commands('rainy night delete all files'),[],'unknown tail cannot run a partial plan');
assert.deepStrictEqual(commands('something entirely unknown'),[]);
assert.deepStrictEqual(commands('rain rain'),['weather rain']);
assert.deepStrictEqual(commands('no rain'),['weather none']);
assert.deepStrictEqual(commands('x'.repeat(300)),[]);
assert.ok(P.phrases.every(row=>row.label && row.command && row.group));
D.I18n.use('fr',{language:'Français',strings:{'night|nighttime|at night':'nuit|la nuit','rain|rainy|raining':'pluie|pluvieux'}});
assert.deepStrictEqual(P.parse('pluie nuit',text=>D.I18n.t(text)).map(step=>step.command),['time 21:00','weather rain']);
D.I18n.use('en',{});
W.mounted=true; W.refreshSpriteset=W.refreshInspector=W.updateUndoButtons=W.updateClockBar=()=>{};
W.previewMinutes=null;
const savedWeather=JSON.stringify($gameScreen), before=JSON.stringify(window.$dataDocsDoodads);
const result=W.paletteResults('make it a rainy night',[],50)[0];
assert.ok(result && result.label.includes('21:00') && result.label.toLowerCase().includes('rain'),'show all resolved actions before running');
assert.strictEqual(W.previewMinutes,null); assert.strictEqual(JSON.stringify($gameScreen),savedWeather,'typing changes no game state');
result.run();
assert.strictEqual(W.previewMinutes,1260); assert.strictEqual($gameScreen.weatherType(),'rain');
assert.strictEqual(JSON.stringify(window.$dataDocsDoodads),before,'weather and clock are previews');
W.endMoodPreview(); assert.strictEqual(JSON.stringify($gameScreen),savedWeather,'existing preview lifecycle restores weather');
const dark=W.paletteValueCommands('darkness darker')[0]; assert.ok(dark);
dark.run(); const value=D.Lighting.mapSettings(1).ambient.darkness; assert.ok(value>0);
D.Undo.undo(); assert.ok(!D.Lighting.mapSettings(1).ambient || !D.Lighting.mapSettings(1).ambient.darkness,'authored change uses Undo');
W.paletteValueCommands('fog on')[0].run();
assert.ok(D.Lighting.mapSettings(1).layers2d.some(layer=>layer.image==='#fog'));
W.paletteValueCommands('fog on')[0].run();
assert.strictEqual(D.Lighting.mapSettings(1).layers2d.filter(layer=>layer.plainWords).length,1,'no duplicate fog layers');
W.paletteValueCommands('fog off')[0].run();
assert.ok(!D.Lighting.mapSettings(1).layers2d || !D.Lighting.mapSettings(1).layers2d.some(layer=>layer.image==='#fog'));
assert.strictEqual(W.paletteValueCommands('rainy nonsense').length,0);
assert.strictEqual(requests,0,'no network for known or unknown text');
// Exercise the real palette input and Enter handler with a tiny DOM.
const nodes={};
function node(tag){return {tagName:tag.toUpperCase(),style:{},parentNode:null,value:'',querySelectorAll:()=>[],focus(){},
    set innerHTML(html){this.html=html;for(const match of html.matchAll(/id="([^"]+)"/g)){const child=node('div');child.id=match[1];nodes[child.id]=child;}},
    get innerHTML(){return this.html||'';}};}
document.createElement=node;document.getElementById=id=>nodes[id]||null;
document.body.appendChild=child=>{child.parentNode=document.body;nodes[child.id]=child;};
document.body.removeChild=child=>{child.parentNode=null;delete nodes[child.id];};
W.paletteCommands=()=>[];
W.showCommandPalette(); const input=nodes['dd-palette-input'];
input.value='make it a rainy night';input.oninput();
assert.ok(nodes['dd-palette-list'].innerHTML.includes('21:00'));
const weatherBeforeEnter=JSON.stringify($gameScreen);
assert.strictEqual($gameScreen.weatherType(),'none');
input.onkeydown({key:'Enter',preventDefault(){},stopPropagation(){}});
assert.strictEqual($gameScreen.weatherType(),'rain');assert.ok(!nodes['dd-palette']);
W.endMoodPreview();assert.strictEqual(JSON.stringify($gameScreen),weatherBeforeEnter);
console.log('Plain words: closed offline phrases, translations, visible plans, Enter, previews and Undo passed.');
