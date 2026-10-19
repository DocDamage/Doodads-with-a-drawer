//==========================================================
// SECTION 1: CORE CONSTANTS & PARAMETERS
//==========================================================
const pluginName = "Docs-Doodads";

// Doc's Doodads began as QJ-Doodads. Names used by those builds are read as a fallback so
// existing projects keep their settings, data, backups, and recovery snapshots.
DocsDoodads.Legacy = {
    pluginName: 'QJ-Doodads',
    dataFileName: 'DoodadsQJ.json',
    backupDirectory: 'data/qj_asset_cache/backups',
    files: {
        'data/DocsDoodadsLibrary.json': 'data/QJAssetLibrary.json',
        'data/DocsDoodadsEventTemplates.json': 'data/QJEventTemplates.json',
        'data/DocsDoodadsLayouts.json': 'data/QJWorkspaceLayouts.json',
        'data/DocsDoodadsRecovery.json': 'data/QJAssetWorkspaceRecovery.json'
    },
    pathFor(filePath) {
        return this.files[String(filePath).replace(/\\/g, '/').replace(/^\.\//, '')] || null;
    }
};

function readPluginParameters() {
    if (typeof PluginManager === 'undefined' || !PluginManager.parameters) return {};
    const current = PluginManager.parameters(pluginName) || {};
    if (Object.keys(current).length > 0) return current;
    return PluginManager.parameters(DocsDoodads.Legacy.pluginName) || {};
}
const parameters = readPluginParameters();

function parseBooleanParameter(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
    return fallback;
}

function parseNumberParameter(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function safeDataBaseName(value) {
    const safe = String(value || 'DocsDoodads')
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/^\.+|\.+$/g, '');
    return safe || 'DocsDoodads';
}

DocsDoodads.Security = DocsDoodads.Security || {
    escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }
};

const escapeHtml = DocsDoodads.Security.escapeHtml;
const editKey = String(parameters.editKey || "F10");
const editorMode = parseBooleanParameter(parameters.editorMode, true);
const dataFileName = safeDataBaseName(parameters.dataFileName) + ".json";
// The release, as in package.json and the header's @plugindesc (verify checks that the three agree).
const pluginVersion = '2.0.0-alpha.1';
const doodadScaleMode = parseBooleanParameter(parameters.doodadScaleMode, true);
const saveMode = parseBooleanParameter(parameters.saveMode, false);
const splitByMap = parseBooleanParameter(parameters.splitByMap, false);
const gridSnapShow = parseBooleanParameter(parameters.gridSnapShow, false);
// 0 (or blank): snap to the map's tiles.
const gridSnapWidth = Math.round(parseNumberParameter(parameters.gridSnapWidth, 0, 0, 960));
const gridSnapHeight = Math.round(parseNumberParameter(parameters.gridSnapHeight, 0, 0, 960));

const defaultLayoutName = String(parameters.defaultLayout || "Mapping");
const defaultThumbnailSize = parseNumberParameter(parameters.defaultThumbnailSize, 96, 32, 256);
const cacheEnabled = parseBooleanParameter(parameters.cacheEnabled, true);
const backgroundWorkBudget = parseNumberParameter(parameters.backgroundWorkBudget, 4, 1, 16);
const autosaveRecoveryInterval = parseNumberParameter(parameters.autosaveRecoveryInterval, 60, 0, 600);
const backupRetentionCount = Math.round(parseNumberParameter(parameters.backupRetentionCount, 10, 1, 50));
const devDiagnostics = parseBooleanParameter(parameters.devDiagnostics, false);

