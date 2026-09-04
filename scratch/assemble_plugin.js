// scratch/assemble_plugin.js
const fs = require('fs');
const path = require('path');

const targetPlugin = path.join(__dirname, '..', 'QJ-Doodads.js');

console.log("Assembling complete QJ-Doodads.js from parts...");

const p1 = fs.readFileSync(path.join(__dirname, 'plugin_part1.js'), 'utf8');
const p2 = fs.readFileSync(path.join(__dirname, 'plugin_part2.js'), 'utf8');
const p3 = fs.readFileSync(path.join(__dirname, 'plugin_part3.js'), 'utf8');

const fullContent = p1 + '\n' + p2 + '\n' + p3 + '\n';

fs.writeFileSync(targetPlugin, fullContent, 'utf8');

console.log("QJ-Doodads.js assembled successfully! Total size:", fullContent.length, "bytes.");
