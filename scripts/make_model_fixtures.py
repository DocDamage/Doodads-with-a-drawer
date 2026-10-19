# Blender script: makes scratch/fixtures/morph_cube.glb, a test model for the glTF reader.
#   blender --background --factory-startup --python scripts/make_model_fixtures.py
# A unit cube standing on the ground with a shape key "Squash" (the top comes down to half height) that an
# animation plays 0 -> 1 -> 0 over 2 seconds, a smooth (roughness 0.2) material with a small bumpy normal
# map packed in, and tangents exported.
import bpy, os, math

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scratch', 'fixtures', 'morph_cube.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 60

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.5))
cube = bpy.context.active_object
cube.name = 'MorphCube'
bpy.ops.object.transform_apply(location=True)
cube.shape_key_add(name='Basis')
squash = cube.shape_key_add(name='Squash')
for v in squash.data:
    if v.co.z > 0.75:
        v.co.z = 0.5
for frame, value in ((0, 0.0), (30, 1.0), (60, 0.0)):
    squash.value = value
    squash.keyframe_insert('value', frame=frame)

# A normal map: bumps from a sine pattern, packed into the file.
size = 16
img = bpy.data.images.new('Bumps', size, size)
pixels = []
for y in range(size):
    for x in range(size):
        nx = 0.5 + 0.35 * math.sin(x / size * math.pi * 4)
        ny = 0.5 + 0.35 * math.sin(y / size * math.pi * 4)
        pixels += [nx, ny, 1.0, 1.0]
img.pixels = pixels
img.colorspace_settings.name = 'Non-Color'
img.pack()

mat = bpy.data.materials.new('Bumpy')
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
bsdf = nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.8, 0.3, 0.2, 1)
bsdf.inputs['Roughness'].default_value = 0.2
bsdf.inputs['Metallic'].default_value = 0.0
tex = nodes.new('ShaderNodeTexImage')
tex.image = img
nmap = nodes.new('ShaderNodeNormalMap')
nmap.inputs['Strength'].default_value = 0.8
links.new(tex.outputs['Color'], nmap.inputs['Color'])
links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
cube.data.materials.append(mat)
# UVs for the normal map.
bpy.context.view_layer.objects.active = cube
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.smart_project()
bpy.ops.object.mode_set(mode='OBJECT')

os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_morph=True, export_morph_normal=True,
                          export_tangents=True, export_animations=True, export_apply=False)
print('Wrote', out)

# scratch/fixtures/skinned_bar.glb: a tall bar on two bones; an animation bends the top bone 60 degrees
# and back over 2 seconds (for posing skins, on the CPU and in the GPU shader).
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1))
bar = bpy.context.active_object
bar.scale = (0.3, 0.3, 2)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.subdivide(number_cuts=6)
bpy.ops.object.mode_set(mode='OBJECT')
mat2 = bpy.data.materials.new('Bar')
mat2.use_nodes = True
mat2.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.2, 0.6, 0.9, 1)
bar.data.materials.append(mat2)
bpy.ops.object.armature_add(location=(0, 0, 0))
arm = bpy.context.active_object
bpy.ops.object.mode_set(mode='EDIT')
b1 = arm.data.edit_bones[0]
b1.head, b1.tail = (0, 0, 0), (0, 0, 1)
b2 = arm.data.edit_bones.new('Top')
b2.head, b2.tail, b2.parent = (0, 0, 1), (0, 0, 2), b1
bpy.ops.object.mode_set(mode='OBJECT')
bar.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
bpy.ops.object.mode_set(mode='POSE')
top = arm.pose.bones['Top']
top.rotation_mode = 'XYZ'
for frame, angle in ((0, 0.0), (30, math.radians(60)), (60, 0.0)):
    top.rotation_euler = (angle, 0, 0)
    top.keyframe_insert('rotation_euler', frame=frame)
bpy.ops.object.mode_set(mode='OBJECT')
out2 = os.path.join(os.path.dirname(out), 'skinned_bar.glb')
bpy.ops.export_scene.gltf(filepath=out2, export_format='GLB', export_animations=True, export_skins=True)
print('Wrote', out2)
