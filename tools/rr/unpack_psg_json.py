import bpy
from mathutils import Vector
import json
import os
from mathutils import Matrix

# --- config ---
JSON_PATH = r"C:\Users\louri\Documents\rr\UI\geometry\tubes08.json"

# Many PS2 pipelines store V with top-left origin. Toggle if your UVs look vertically flipped.
FLIP_V = True


def load_psg_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def ensure_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col

def ensure_image(filepath: str):
    """
    Load image if not already loaded. Returns bpy.types.Image or None if missing.
    """
    abspath = os.path.abspath(filepath)

    # Reuse if already loaded
    for img in bpy.data.images:
        try:
            if img.filepath and os.path.abspath(bpy.path.abspath(img.filepath)) == abspath:
                return img
        except Exception:
            pass

    if not os.path.exists(abspath):
        print(f"[WARN] Texture not found: {abspath}")
        return None

    try:
        img = bpy.data.images.load(abspath, check_existing=True)
        img.colorspace_settings.name = "sRGB"
        return img
    except Exception as e:
        print(f"[WARN] Failed to load image {abspath}: {e}")
        return None

def ensure_material_with_image(mat_name: str, image):
    """
    Creates/gets a material using nodes:
      Image Texture -> Principled Base Color
      (Optional) Image Alpha -> Principled Alpha

    Fixes:
      - Backface culling OFF
      - Uses CLIP/HASHED for alpha to avoid depth sorting issues
      - OPAQUE for non-alpha textures
    """
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(mat_name)

    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    # Backface culling fix (prevents "only inner backface shows")
    mat.use_backface_culling = False

    # Find/create Principled + Output
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.location = (0, 0)

    out = nodes.get("Material Output")
    if not out:
        out = nodes.new("ShaderNodeOutputMaterial")
        out.location = (300, 0)

    # Ensure BSDF -> Output
    if not any(l.to_node == out and l.to_socket.name == "Surface" for l in links):
        links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # Find/create Image Texture node
    tex_node = None
    for n in nodes:
        if n.type == "TEX_IMAGE":
            tex_node = n
            break
    if not tex_node:
        tex_node = nodes.new("ShaderNodeTexImage")
        tex_node.location = (-300, 0)

    tex_node.image = image
    if image:
        tex_node.interpolation = 'Linear'  # PS1/PS2 vibe; change to Linear if you prefer

    # Link color -> base color (clear existing)
    while bsdf.inputs["Base Color"].links:
        links.remove(bsdf.inputs["Base Color"].links[0])
    links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])

    # Decide if we should use transparency
    # (Depth == 32 often means RGBA; depth can vary by how Blender loaded the file,
    # but this is a decent practical heuristic.)
    has_alpha = bool(image and getattr(image, "depth", 0) == 32)

    if has_alpha and "Alpha" in tex_node.outputs and "Alpha" in bsdf.inputs:
        # Link alpha -> principled alpha (clear existing)
        while bsdf.inputs["Alpha"].links:
            links.remove(bsdf.inputs["Alpha"].links[0])
        links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])

        # IMPORTANT: Avoid BLEND to prevent wrong draw order
        # Use CLIP for hard cutouts (best depth behavior), or HASHED for softer edges.
        mat.blend_method = 'CLIP'          # or 'HASHED'
        mat.alpha_threshold = 0.5          # tweak 0.1–0.7 depending on your cutouts
        mat.shadow_method = 'CLIP'         # or 'HASHED'

    else:
        # Force opaque for better depth correctness
        mat.blend_method = 'OPAQUE'
        mat.shadow_method = 'OPAQUE'

        # If something previously linked alpha, clear it
        if "Alpha" in bsdf.inputs:
            while bsdf.inputs["Alpha"].links:
                links.remove(bsdf.inputs["Alpha"].links[0])
            bsdf.inputs["Alpha"].default_value = 1.0

    return mat


    return mat

def texture_root_from_json(json_path: str):
    """
    Resolve texture folder using rules:

    Case A:
        .../geometry/<file>.json
        -> .../textures/

    Case B:
        no geometry in path
        -> <drive>/rr/textures
    """

    full = os.path.abspath(json_path)
    parts = full.split(os.sep)

    # -------------------------
    # Case A — geometry present
    # -------------------------
    if "geometry" in [p.lower() for p in parts]:
        geom_index = next(i for i, p in enumerate(parts) if p.lower() == "geometry")
        base_dir = os.sep.join(parts[:geom_index])
        tex_dir = os.path.join(base_dir, "textures")
        return tex_dir

    # -------------------------
    # Case B — fallback to /rr
    # -------------------------
    if "rr" in [p.lower() for p in parts]:
        rr_index = next(i for i, p in enumerate(parts) if p.lower() == "rr")
        rr_root = os.sep.join(parts[:rr_index + 1])
        tex_dir = os.path.join(rr_root, "textures")
        return tex_dir

    # -------------------------
    # Final fallback: same dir
    # -------------------------
    return os.path.join(os.path.dirname(full), "textures")


def resolve_texture_path(tex_folder: str, tex_entry):
    """
    Accepts:
      "foo"
      "foo.png"
      {"name":"foo"}
      {"file":"foo"}
      {"path":"foo.png"}
    Returns full path or None.
    """
    if not tex_entry:
        return None

    if isinstance(tex_entry, dict):
        filename = (
            tex_entry.get("name") or
            tex_entry.get("file") or
            tex_entry.get("path") or
            tex_entry.get("texture") or
            ""
        )
    else:
        filename = str(tex_entry)

    if not filename:
        return None

    if not filename.lower().endswith(".png"):
        filename += ".png"

    return os.path.join(tex_folder, filename)



bonetable = []

def create_bone_empties(bones, collection_name="PSG_Bones", swap_yz=True, transpose=False):
    col = ensure_collection(collection_name)
    empties = []
    for b in bones:
        name = b.get("name", "bone")
        m_list = b["matrix"]

        M = Matrix(m_list)
        if transpose:
            M = M.transposed()

        t = M.to_translation()
        if swap_yz:
            t = Vector((t.x, t.z, t.y))
            M.translation = t

        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = 'ARROWS'
        empty.empty_display_size = 1
        empty.matrix_world = M
        empty.location = (b["x"]*16, b["z"]*16, b["y"]*16)

        if b["parent"] > -1:
            empty.parent = empties[b["parent"]]

        col.objects.link(empty)
        empties.append(empty)

    return empties


def fix_winding_with_normals(a, b, c, pos, nrm):
    va, vb, vc = pos[a], pos[b], pos[c]
    na, nb, nc = nrm[a], nrm[b], nrm[c]

    nf = (vb - va).cross(vc - va)
    if nf.length_squared == 0:
        return (a, b, c)

    ne = na + nb + nc
    if ne.length_squared == 0:
        return (a, b, c)

    nf.normalize()
    ne.normalize()

    if nf.dot(ne) < 0:
        return (a, c, b)
    return (a, b, c)


def build_faces_from_strip(points):
    faces = []
    if len(points) < 3:
        return faces

    pos = [Vector((p["x"], p["z"], p["y"])) for p in points]

    nrm = []
    for p in points:
        nn = p.get("normal", {})
        nrm.append(Vector((nn.get("x", 0.0), nn.get("z", 0.0), nn.get("y", 0.0))))

    for i in range(2, len(points)):
        if points[i].get("flag", 0) > 0:
            tri = (i - 2, i - 1, i)
            tri = fix_winding_with_normals(*tri, pos=pos, nrm=nrm)
            faces.append(tri)

    return faces


def apply_uvs(mesh, points):
    uv_layer = mesh.uv_layers.new(name="UVMap")

    for li, loop in enumerate(mesh.loops):
        vidx = loop.vertex_index
        uv = points[vidx].get("uv", None)

        if not uv:
            uv_layer.data[li].uv = (0.0, 0.0)
            continue

        u = float(uv.get("x", 0.0))
        v = float(uv.get("y", 0.0))

        if FLIP_V:
            v = 1.0 - v

        uv_layer.data[li].uv = (u, v)


# --- main import ---
data = load_psg_json(JSON_PATH)

create_bone_empties(data.get("bones", []))

# texture setup
textures_list = data.get("textures", [])
tex_folder = texture_root_from_json(JSON_PATH)
print(f"[INFO] Texture folder: {tex_folder}")

objects = data.get("objects", [])

for obj_index, obj_data in enumerate(objects):
    meshes = obj_data.get("meshes", [])

    for mesh_index, mesh_data in enumerate(meshes):
        points = mesh_data.get("verts", [])
        if not points:
            continue

        name = f"obj{obj_index}_mesh{mesh_index}"
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)

        verts = [Vector((p["x"], p["z"], p["y"])) for p in points]
        faces = build_faces_from_strip(points)

        mesh.from_pydata(verts, [], faces)

        vertex_normals = [
            Vector((p.get('normal', {}).get('x', 0.0),
                    p.get('normal', {}).get('z', 0.0),
                    p.get('normal', {}).get('y', 0.0)))
            for p in points
        ]
        loop_normals = [vertex_normals[l.vertex_index] for l in mesh.loops]

        apply_uvs(mesh, points)

        mesh.validate()
        mesh.update(calc_edges=True)
        mesh.normals_split_custom_set(loop_normals)

        # -----------------------------
        # Assign texture/material
        # -----------------------------
        # Default mapping: textures[mesh_index]
        tex_name = textures_list[mesh_index] if mesh_index < len(textures_list) else None

        # If your JSON stores per-mesh texture index instead, use something like:
        # tidx = mesh_data.get("textureIndex", -1)
        # tex_name = textures_list[tidx] if 0 <= tidx < len(textures_list) else None

        if tex_name:
            tex_path = resolve_texture_path(tex_folder, tex_name)
            img = ensure_image(tex_path) if tex_path else None
            if img:
                mat_name = f"MAT_{os.path.splitext(os.path.basename(tex_path))[0]}"
                mat = ensure_material_with_image(mat_name, img)

                # Put material in slot 0
                if obj.data.materials:
                    obj.data.materials[0] = mat
                else:
                    obj.data.materials.append(mat)
            else:
                print(f"[WARN] Could not load texture for {name}: {tex_name}")
        else:
            print(f"[INFO] No texture entry for {name} (mesh_index={mesh_index}).")

        obj.location = (0.0, 0.0, 0.0)

print("Import complete.")
