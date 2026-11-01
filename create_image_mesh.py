import bpy
import bmesh
import sys
import os
import math


# ============================================================
# IMAGETOMESH3ID
# PIXEL ALPHA MESH GENERATOR
# ============================================================

print()
print("=" * 60)
print(" IMAGETOMESH3ID BLENDER GENERATOR")
print("=" * 60)


# ============================================================
# ARGUMENTOS
# ============================================================

argv = sys.argv

if "--" not in argv:
    raise RuntimeError("No se encontraron argumentos después de --")

args = argv[argv.index("--") + 1:]


if len(args) < 7:
    raise RuntimeError(
        "Argumentos insuficientes.\n"
        "Esperados:\n"
        "texture_path\n"
        "original_image_path\n"
        "fbx_path\n"
        "blend_path\n"
        "original_size\n"
        "rotation_x\n"
        "rotation_y\n"
        "rotation_z"
    )


texture_path = args[0]
original_image_path = args[1]
fbx_path = args[2]
blend_path = args[3]

original_size = int(args[4])

rotation_x = float(args[5])
rotation_y = float(args[6])
rotation_z = float(args[7])


print(f"[PYTHON] Texture 1024: {texture_path}")
print(f"[PYTHON] Original image: {original_image_path}")
print(f"[PYTHON] FBX: {fbx_path}")
print(f"[PYTHON] Blend: {blend_path}")
print(f"[PYTHON] Original resolution: {original_size}x{original_size}")


# ============================================================
# CONFIGURACIÓN
# ============================================================

ALPHA_THRESHOLD = 20

# Solidify se mantiene exactamente igual
SOLIDIFY_THICKNESS = 0.10

# Tamaño total del mesh
PLANE_SIZE = 2.0


# ============================================================
# VALIDACIONES
# ============================================================

if not os.path.exists(texture_path):
    raise RuntimeError(
        f"No existe la textura 1024:\n{texture_path}"
    )


if not os.path.exists(original_image_path):
    raise RuntimeError(
        f"No existe la imagen original:\n{original_image_path}"
    )


# ============================================================
# LIMPIAR ESCENA
# ============================================================

print("[PYTHON] Cleaning scene...")


bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


for datablocks in (
    bpy.data.meshes,
    bpy.data.curves,
    bpy.data.materials,
    bpy.data.cameras,
    bpy.data.lights,
):
    for block in list(datablocks):
        try:
            datablocks.remove(block)
        except:
            pass


# ============================================================
# CARGAR IMAGEN ORIGINAL
# ============================================================

print("[PYTHON] Loading original image...")


original_image = bpy.data.images.load(
    original_image_path,
    check_existing=False
)


if original_image.size[0] != original_size:
    print(
        f"[PYTHON] WARNING: imagen detectada "
        f"{original_image.size[0]}x{original_image.size[1]}"
    )


# ============================================================
# LEER PIXELES
# ============================================================

print("[PYTHON] Reading alpha channel...")


width = original_image.size[0]
height = original_image.size[1]


if width != height:
    raise RuntimeError(
        "La imagen original no es cuadrada."
    )


# ============================================================
# PIXELES VISIBLES
# ============================================================

visible_pixels = []

pixels = list(original_image.pixels)


print(
    f"[PYTHON] Checking {width * height:,} pixels..."
)


for y in range(height):

    for x in range(width):

        pixel_index = (
            (y * width + x) * 4
        )

        alpha = pixels[pixel_index + 3]

        alpha_255 = alpha * 255.0

        if alpha_255 > ALPHA_THRESHOLD:

            visible_pixels.append(
                (x, y)
            )


visible_count = len(visible_pixels)

transparent_count = (
    width * height
) - visible_count


print(
    f"[PYTHON] Visible pixels: {visible_count:,}"
)


print(
    f"[PYTHON] Transparent pixels removed: {transparent_count:,}"
)


if visible_count == 0:

    raise RuntimeError(
        "La imagen no tiene ningún píxel visible."
    )


# ============================================================
# CREAR MALLA
# ============================================================

print("[PYTHON] Creating pixel mesh...")


mesh = bpy.data.meshes.new(
    "MinecraftPixelMesh"
)


mesh.update()


# ============================================================
# VERTICES
# ============================================================

vertices = []

for y in range(height + 1):

    for x in range(width + 1):

        px = (
            x / width
            - 0.5
        ) * PLANE_SIZE

        py = (
            y / height
            - 0.5
        ) * PLANE_SIZE

        vertices.append(
            (
                px,
                py,
                0.0
            )
        )


# ============================================================
# ÍNDICE DE VÉRTICE
# ============================================================

def vertex_index(x, y):

    return (
        y * (width + 1)
        + x
    )


# ============================================================
# CREAR CARAS
# ============================================================

faces = []

visible_set = set(
    visible_pixels
)


for x, y in visible_pixels:

    v0 = vertex_index(
        x,
        y
    )

    v1 = vertex_index(
        x + 1,
        y
    )

    v2 = vertex_index(
        x + 1,
        y + 1
    )

    v3 = vertex_index(
        x,
        y + 1
    )


    faces.append(
        (
            v0,
            v1,
            v2,
            v3
        )
    )


print(
    f"[PYTHON] Creating {len(vertices):,} vertices..."
)


print(
    f"[PYTHON] Creating {len(faces):,} visible faces..."
)


mesh.from_pydata(
    vertices,
    [],
    faces
)


mesh.update()


# ============================================================
# OBJETO
# ============================================================

obj = bpy.data.objects.new(
    "MinecraftPixelMesh",
    mesh
)


bpy.context.collection.objects.link(
    obj
)


bpy.context.view_layer.objects.active = obj

obj.select_set(True)


# ============================================================
# UV MAP
# ============================================================

print("[PYTHON] Creating UV map...")


uv_layer = mesh.uv_layers.new(
    name="UVMap"
)


for polygon in mesh.polygons:

    face_index = polygon.index

    x, y = visible_pixels[
        face_index
    ]


    u0 = x / width
    u1 = (x + 1) / width

    v0 = y / height
    v1 = (y + 1) / height


    uv_coordinates = [
        (u0, v0),
        (u1, v0),
        (u1, v1),
        (u0, v1)
    ]


    for loop_index, uv in zip(
        polygon.loop_indices,
        uv_coordinates
    ):

        uv_layer.data[
            loop_index
        ].uv = uv


# ============================================================
# MATERIAL
# ============================================================

print("[PYTHON] Creating material...")


material = bpy.data.materials.new(
    "MinecraftTexture"
)


material.use_nodes = True


nodes = material.node_tree.nodes
links = material.node_tree.links


nodes.clear()


# ------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------

output_node = nodes.new(
    "ShaderNodeOutputMaterial"
)


output_node.location = (
    500,
    0
)


# ------------------------------------------------------------
# PRINCIPLED
# ------------------------------------------------------------

principled = nodes.new(
    "ShaderNodeBsdfPrincipled"
)


principled.location = (
    200,
    0
)


principled.inputs[
    "Roughness"
].default_value = 1.0


principled.inputs[
    "Specular IOR Level"
].default_value = 0.0


# ------------------------------------------------------------
# IMAGE TEXTURE
# ------------------------------------------------------------

texture_node = nodes.new(
    "ShaderNodeTexImage"
)


texture_node.location = (
    -100,
    0
)


texture_image = bpy.data.images.load(
    texture_path,
    check_existing=False
)


texture_node.image = texture_image


texture_node.interpolation = 'Closest'


# ------------------------------------------------------------
# CONECTAR
# ------------------------------------------------------------

links.new(
    texture_node.outputs["Color"],
    principled.inputs["Base Color"]
)


links.new(
    texture_node.outputs["Alpha"],
    principled.inputs["Alpha"]
)


links.new(
    principled.outputs["BSDF"],
    output_node.inputs["Surface"]
)


# ============================================================
# TRANSPARENCIA DEL MATERIAL
# ============================================================

material.surface_render_method = 'DITHERED'


# ============================================================
# ASIGNAR MATERIAL
# ============================================================

print("[PYTHON] Assigning material...")


obj.data.materials.append(
    material
)


# ============================================================
# NORMALS
# ============================================================

print("[PYTHON] Recalculating normals...")


bpy.context.view_layer.objects.active = obj

obj.select_set(True)


bpy.ops.object.mode_set(
    mode='EDIT'
)


bpy.ops.mesh.select_all(
    action='SELECT'
)


bpy.ops.mesh.normals_make_consistent(
    inside=False
)


bpy.ops.object.mode_set(
    mode='OBJECT'
)


# ============================================================
# SOLIDIFY
# ============================================================

print(
    f"[PYTHON] Adding Solidify: {SOLIDIFY_THICKNESS}"
)


solidify = obj.modifiers.new(
    name="Solidify",
    type='SOLIDIFY'
)


solidify.thickness = SOLIDIFY_THICKNESS

solidify.offset = 0.0

solidify.use_rim = True

solidify.use_rim_only = False


# ============================================================
# APLICAR SOLIDIFY
# ============================================================

print("[PYTHON] Applying Solidify...")


bpy.context.view_layer.objects.active = obj

obj.select_set(True)


bpy.ops.object.modifier_apply(
    modifier=solidify.name
)


# ============================================================
# FLAT SHADING
# ============================================================

print(
    "[PYTHON] Configuring flat shading..."
)


for polygon in obj.data.polygons:

    polygon.use_smooth = False


# ============================================================
# ROTACIÓN
# ============================================================

print(
    f"[PYTHON] Rotation: "
    f"X={rotation_x} "
    f"Y={rotation_y} "
    f"Z={rotation_z}"
)


obj.rotation_euler = (
    math.radians(rotation_x),
    math.radians(rotation_y),
    math.radians(rotation_z)
)


# ============================================================
# APLICAR ROTACIÓN
# ============================================================

bpy.ops.object.transform_apply(
    location=False,
    rotation=True,
    scale=False
)


# ============================================================
# CENTRAR ORIGEN
# ============================================================

bpy.context.view_layer.objects.active = obj

obj.select_set(True)


bpy.ops.object.origin_set(
    type='ORIGIN_GEOMETRY',
    center='BOUNDS'
)


# ============================================================
# APLICAR TRANSFORMS
# ============================================================

print("[PYTHON] Applying transforms...")


bpy.ops.object.transform_apply(
    location=False,
    rotation=False,
    scale=True
)


# ============================================================
# LIMPIAR IMAGEN ORIGINAL
# ============================================================

try:

    bpy.data.images.remove(
        original_image
    )

except:

    pass


# ============================================================
# EXPORT FBX
# ============================================================

print("[PYTHON] Exporting FBX...")


os.makedirs(
    os.path.dirname(fbx_path),
    exist_ok=True
)


bpy.ops.object.select_all(
    action='DESELECT'
)


obj.select_set(True)

bpy.context.view_layer.objects.active = obj


bpy.ops.export_scene.fbx(

    filepath=fbx_path,

    use_selection=True,

    object_types={
        'MESH'
    },

    apply_unit_scale=True,

    apply_scale_options='FBX_SCALE_ALL',

    use_mesh_modifiers=True,

    mesh_smooth_type='OFF',

    use_custom_props=False,

    path_mode='AUTO',

    embed_textures=False,

    add_leaf_bones=False,

    bake_anim=False

)


# ============================================================
# VERIFICAR FBX
# ============================================================

if not os.path.exists(
    fbx_path
):

    raise RuntimeError(
        "Blender terminó pero no creó el FBX."
    )


fbx_size = os.path.getsize(
    fbx_path
)


if fbx_size <= 0:

    raise RuntimeError(
        "El FBX creado está vacío."
    )


print(
    f"[PYTHON] FBX created: {fbx_size} bytes"
)


# ============================================================
# GUARDAR BLEND
# ============================================================

print("[PYTHON] Saving blend...")


bpy.ops.wm.save_as_mainfile(
    filepath=blend_path
)


print()
print("=" * 60)
print(" BLENDER GENERATION SUCCESS")
print("=" * 60)

print(
    f"[PYTHON] Visible pixels: {visible_count:,}"
)

print(
    f"[PYTHON] Transparent pixels removed: "
    f"{transparent_count:,}"
)

print(
    f"[PYTHON] Plane size: {PLANE_SIZE}"
)

print(
    f"[PYTHON] Solidify thickness: "
    f"{SOLIDIFY_THICKNESS}"
)

print(
    f"[PYTHON] FBX: {fbx_path}"
)

print(
    f"[PYTHON] BLEND: {blend_path}"
)

print("=" * 60)


# ============================================================
# FIN
# ============================================================

bpy.ops.wm.quit_blender()