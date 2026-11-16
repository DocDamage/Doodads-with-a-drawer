# Tile and screen-size literal audit

Backlog 7.4.7 checks that map geometry comes from RPG Maker rather than assuming 48-pixel tiles or an 816 × 624 viewport.

## Method

On 2026-11-15, this command found 227 matching lines in 61 source files:

```powershell
rg -n --pcre2 "(?<![A-Za-z0-9_])(48|24|816|624)(?![A-Za-z0-9_])" src -g "*.js" -g "!36_ui_icons.js" -g "!36_ui_fonts.js"
```

Generated icon paths and the generated font were excluded because their numbers identify assets or glyph data. Each remaining file group is classified below. “Live/fallback” means the code reads `tileWidth()`, `tileHeight()`, `Graphics.width` or `Graphics.height` when the engine object exists and uses MZ's defaults only when it does not. “Art pixels” means the value deliberately describes an image frame, effect, control or other pixel-sized content and must not scale with the map tile size.

## Classification of all 227 lines

| Source (matching lines) | Classification |
| --- | --- |
| `06_render_effects.js` (2) | Doodad-frame and light-offset art pixels. |
| `07_doodad_states.js` (2), `07_doodad_states_extras.js` (2) | Live tile size with guarded 48 fallback. |
| `07_event_labels.js` (1) | User-visible label-size limit in pixels. |
| `07_public_api.js` (2) | Documented live tile-size API and no-map fallback. |
| `07_world_atmosphere.js` (6) | Flying altitude/art-size fallback, 24-hour clock math, text-buffer limit and shader decimal `0.24`; no map coordinate constant. |
| `09_particles_vfx_reactive_doodads_character.js` (5) | Particle preset/art dimensions and a live tile-height fallback for contact range. |
| `12_visual_equipment_map_destination.js` (1) | Equipment bob limit in pixels. |
| `13_perspective_mode.js` (6) | Fixed preview-canvas unit, preset tile-count, a scale-invariant normal probe, MZ autotile kind numbering and 24-hour clock math. The runtime camera does not use these as map tile pixels. |
| `14_sprite_docsdoodad_runtime_engine.js` (10) | Live tile size with guarded fallbacks plus source-frame/culling art pixels. |
| `15_map_thumb_renderer.js` (3) | Decoded-image cache limit of 24 and live tile size with no-map fallback. |
| `15_spriteset_map_doodad_layer_hooks.js` (16) | Live viewport/tile fallbacks; the remainder are doodad-frame, particle and character/effect pivot pixels. |
| `15_spriteset_map_labels.js` (3) | Live viewport fallback and opacity animation steps. |
| `16_visual_equipment_map_destination_runtime.js` (1) | Save-window character spacing in UI pixels. |
| `17_perspective_runtime_1_view.js` (2), `17_perspective_runtime_2_terrain.js` (2) | Shader uniforms initialized safely before a map exists, then overwritten from the live tile size on every 3D update; one 24-tile work cap and one doodad-frame art fallback. |
| `17_traversal.js` (6) | Flying altitude and touch-control pixels plus live viewport fallback. Traversal coordinates themselves are tile-based. |
| `21_assetindex_metadata_cache.js` (2), `22_zip.js` (1), `23_lpc_compositor.js` (2), `23_memao_index.js` (3) | Binary header lengths, byte offsets and bit shifts. |
| `22_asset_management.js` (2) | Bit operation and doodad-frame art pixels. |
| `23_lpc_export.js` (2) | Native LPC image scan rows/radius. |
| `23_memao_compositor.js` (5), `23_memao_export.js` (5) | Memao's fixed 48-pixel source/export frame format. Index metadata is counted in the binary-format row above. |
| `23_mzgen_compositor.js` (3), `23_mzgen_index.js` (3) | RPG Maker generator asset formats and a creator snap distance; not map geometry. |
| `25_slicing.js` (1) | Confidence decimals (`0.24`). |
| `27_slicing_editor.js` (3) | Initial 48 × 48 image slice in source-image pixels. |
| `30_collision.js` (3) | Alpha threshold and missing-frame art fallbacks. Tile collision receives live `tw`/`th`. |
| `31_placement_tools.js` (7) | Pixel spacing/frame defaults and pure-helper tile-size defaults. Workspace callers supply the live tile size. |
| `31_room_stamps.js` (2) | Pure-helper compatibility defaults. `44_workspace_rooms.js` passes live tile width and height for capture and placement; stamps record their source tile size and scale positions when placed in a different one. |
| `31_tile_painting.js` (7) | MZ's 48 autotile shapes per kind and sheet-kind numbering; these are tile IDs, not pixels. |
| `34_layout.js` (1) | Item Bag thumbnail size. |
| `36_import.js` (1) | Section number in a comment. |
| `36_ui_theme_dialogs.js` (1), `36_ui_theme_feedback.js` (4) | CSS colour channel, tooltip pixels and browser-window fallbacks. |
| `37_workspace_core.js` (6), `38_workspace_inspector.js` (6) | UI slider/card sizes, explicit pixel spacing and source-frame fallbacks. |
| `39_workspace_map_panel.js` (7) | Live tile-size queries/fallbacks plus missing-asset frame pixels. Scatter queries pass the live tile size. |
| `41_workspace_visual_postfx.js` (1) | On-screen traversal-button minimum in UI pixels. |
| `42_workspace_assets_maps.js` (8) | Source-frame pixels plus live tile-size queries/fallbacks. |
| `43_workspace_undo_paths_prefabs.js` (11) | Live tile size passed to path/prefab helpers; one deliberately pixel-based default path spacing. |
| `44_workspace_canvas_input.js` (11), `44_workspace_canvas_input_1_mouse.js` (9) | Live tile/viewport geometry; remaining values are brush-step, source-frame and model-size pixel defaults. |
| `44_workspace_capture.js` (3) | Orbit frame counts. |
| `44_workspace_creator_kits.js` (2), `44_workspace_lpc_creator.js` (3) | Character-library frame formats and responsive UI notes. |
| `44_workspace_docking.js` (1) | Docking-card margin in UI pixels. |
| `44_workspace_find.js` (1), `44_workspace_map_check.js` (3), `44_workspace_places_bookmarks.js` (1), `44_workspace_regions.js` (2), `44_workspace_rooms.js` (1) | Live tile/viewport sizes with guarded MZ fallbacks. |
| `44_workspace_item_bag.js` (2) | Saved-query text limit and browser-window fallback. |
| `44_workspace_look.js` (2) | Browser-window fallback for editor layout. |
| `44_workspace_map_tools.js` (3) | Live viewport dimensions and floating-card fallback widths. |
| `44_workspace_navigation.js` (3) | 24-hour parsing and card spacing. |
| `44_workspace_onboarding.js` (5) | Sample-art pixels, browser-window fallback and live tile size. |
| `44_workspace_readouts.js` (7) | CSS colour, live tile/viewport dimensions and source-frame pixels. |
| `44_workspace_selection_edit.js` (1) | Doodad-frame art fallback. |

## Result

No production map-coordinate defect was found. The values that look like map defaults are either guarded no-engine fallbacks or pure-helper defaults whose editor callers pass the live size. The fixed art, effect and UI pixel values should not be scaled: a 96-pixel light radius or 48-pixel character frame stays 96 or 48 pixels on a 16-, 32- or 48-pixel map.

The stand-in engine had been fixed at 48-pixel tiles and 816 × 624, so it could not prove this behavior. Its tile conversion, character/destination positions, tilemap origin, screen-tile count, frame and renderer viewport are now configurable. Focused suites exercise both 32- and 16-pixel tiles across painting, room stamps, collision/reach, lights, terrain, minimap, traversal and flat/3D projection. Real RPG Maker validation is tracked separately because a test harness cannot prove MZ/NW.js integration.
