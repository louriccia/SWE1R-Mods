import bpy
import os
from mathutils import Vector

# ------------------------------------------------------------
# SETTINGS
# ------------------------------------------------------------

# Folder containing .spl files (Windows safe: use forward slashes or raw string r"...")
FOLDER = "C:/Users/louri/Documents/rr/TRACKS"

# Axis mapping:
#   "XYZ" = Position=(x,y,z) -> Blender (x,y,z)
#   "XZY" = Position=(x,y,z) -> Blender (x,z,y)  (common for Y-up game data)
AXIS_MODE = "XZY"

# Scale factor (your coords are huge; 0.01 is a good start)
SCALE = 0.01

# Create helper left/right offset guide curves for each path?
CREATE_WIDTH_GUIDES = False
GUIDE_SCALE = 1.0  # multiply widths if you want exaggerated guides

# Only process top-level of folder? (False = recursive)
RECURSIVE = True

# Create/put imports into this collection
COLLECTION_NAME = "ImportedTrackSplines"

# ------------------------------------------------------------
# Parsing
# ------------------------------------------------------------

def parse_track(text: str):
    track = {}
    nodes = {}

    section = None
    current_node = None

    def parse_value(v: str):
        v = v.strip()
        try:
            if "." in v or "e" in v.lower():
                return float(v)
            return int(v)
        except Exception:
            return v

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith(";") or line.startswith("#"):
            continue

        if line.startswith("[") and line.endswith("]"):
            section = line[1:-1].strip()
            current_node = None
            if section.lower().startswith("node"):
                idx = int(section[4:])
                current_node = idx
                nodes[idx] = {"Next": []}
            continue

        if "=" not in line or section is None:
            continue

        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()

        if section.lower() == "track":
            track[key] = parse_value(val)
        elif section.lower().startswith("node") and current_node is not None:
            n = nodes[current_node]

            if key.lower() == "position":
                parts = [p.strip() for p in val.split(",")]
                if len(parts) != 3:
                    raise ValueError(f"Bad Position on Node{current_node}: {val}")
                x, y, z = map(float, parts)

                if AXIS_MODE == "XYZ":
                    p = Vector((x, y, z))
                elif AXIS_MODE == "XZY":
                    p = Vector((x, z, y))
                else:
                    raise ValueError("AXIS_MODE must be 'XYZ' or 'XZY'")

                n["Position"] = p * SCALE

            elif key.lower().startswith("next"):
                try:
                    n["Next"].append(int(val))
                except Exception:
                    pass
            else:
                n[key] = parse_value(val)

    return track, nodes

# ------------------------------------------------------------
# Graph traversal -> build paths
# ------------------------------------------------------------

def build_paths(nodes: dict, start_candidates=None):
    incoming = {i: 0 for i in nodes.keys()}
    for i, n in nodes.items():
        for j in n.get("Next", []):
            if j in incoming:
                incoming[j] += 1

    starts = [i for i, c in incoming.items() if c == 0]
    if 0 in nodes and 0 not in starts:
        starts.append(0)

    if start_candidates:
        starts = [s for s in start_candidates if s in nodes]
        if not starts and 0 in nodes:
            starts = [0]

    paths = []
    seen = set()

    def dfs(path):
        cur = path[-1]
        nxts = [j for j in nodes[cur].get("Next", []) if j in nodes]
        if not nxts:
            sig = tuple(path)
            if sig not in seen:
                seen.add(sig)
                paths.append(path)
            return

        for j in nxts:
            if j in path:
                sig = tuple(path + [j])
                if sig not in seen:
                    seen.add(sig)
                    paths.append(path + [j])
                continue
            dfs(path + [j])

    for s in starts:
        dfs([s])

    if not paths:
        paths = [sorted(nodes.keys())]

    return paths

# ------------------------------------------------------------
# Curve creation helpers
# ------------------------------------------------------------

def ensure_collection(name: str):
    col = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col

def new_curve_object(name: str, collection):
    crv = bpy.data.curves.new(name=name, type="CURVE")
    crv.dimensions = "3D"
    obj = bpy.data.objects.new(name, crv)
    collection.objects.link(obj)
    return obj, crv

def add_poly_spline(curve_data, points, cyclic=False):
    sp = curve_data.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p.x, p.y, p.z, 1.0)
    sp.use_cyclic_u = bool(cyclic)
    return sp

def compute_tangents(points):
    tans = []
    n = len(points)
    for i in range(n):
        if n == 1:
            tans.append(Vector((1, 0, 0)))
            continue
        if i == 0:
            t = (points[1] - points[0])
        elif i == n - 1:
            t = (points[-1] - points[-2])
        else:
            t = (points[i+1] - points[i-1])
        if t.length == 0:
            t = Vector((1, 0, 0))
        tans.append(t.normalized())
    return tans

def compute_side_vector(tangent, up=Vector((0, 0, 1))):
    side = tangent.cross(up)
    if side.length < 1e-8:
        up2 = Vector((0, 1, 0))
        side = tangent.cross(up2)
    if side.length == 0:
        return Vector((1, 0, 0))
    return side.normalized()

# ------------------------------------------------------------
# Import one .spl file
# ------------------------------------------------------------

def import_spl(filepath: str, collection):
    name = os.path.splitext(os.path.basename(filepath))[0]

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    track, nodes = parse_track(text)
    if not nodes:
        print(f"[SKIP] {name}: no nodes parsed")
        return None

    paths = build_paths(nodes)

    # Main curve object for this file (name = filename)
    obj, crv = new_curve_object(name, collection=collection)

    # Optional width guides for this file
    if CREATE_WIDTH_GUIDES:
        left_obj, left_crv = new_curve_object(f"{name}_LeftGuide", collection=collection)
        right_obj, right_crv = new_curve_object(f"{name}_RightGuide", collection=collection)
    else:
        left_crv = right_crv = None

    for path in paths:
        pts = []
        for idx in path:
            p = nodes[idx].get("Position")
            if p is not None:
                pts.append(p)

        if len(pts) < 2:
            continue

        cyclic = (len(path) >= 3 and path[-1] == path[0])
        add_poly_spline(crv, pts, cyclic=cyclic)

        if CREATE_WIDTH_GUIDES and left_crv and right_crv:
            tans = compute_tangents(pts)
            left_pts = []
            right_pts = []

            # careful: path indices align with pts only if all had Position
            # We'll rebuild an aligned list of node indices for pts:
            aligned_node_ids = [idx for idx in path if nodes[idx].get("Position") is not None]

            for k, idx in enumerate(aligned_node_ids):
                n = nodes[idx]
                p = n["Position"]
                lt = float(n.get("LeftTrackWidth", 0.0)) * SCALE * GUIDE_SCALE
                rt = float(n.get("RightTrackWidth", 0.0)) * SCALE * GUIDE_SCALE
                side = compute_side_vector(tans[k])
                left_pts.append(p + side * lt)
                right_pts.append(p - side * rt)

            add_poly_spline(left_crv, left_pts, cyclic=cyclic)
            add_poly_spline(right_crv, right_pts, cyclic=cyclic)

    print(f"[OK] {name}: nodes={len(nodes)} paths={len(paths)} splines={len(crv.splines)} track_keys={list(track.keys())}")
    return obj

# ------------------------------------------------------------
# Batch import folder
# ------------------------------------------------------------

def iter_spl_files(folder: str, recursive: bool):
    folder = os.path.abspath(folder)
    if recursive:
        for root, _dirs, files in os.walk(folder):
            for fn in files:
                if fn.lower().endswith(".spl"):
                    yield os.path.join(root, fn)
    else:
        for fn in os.listdir(folder):
            if fn.lower().endswith(".spl"):
                yield os.path.join(folder, fn)

def main():
    if not os.path.isdir(FOLDER):
        raise RuntimeError(f"FOLDER does not exist: {FOLDER}")

    col = ensure_collection(COLLECTION_NAME)

    imported = []
    for fp in iter_spl_files(FOLDER, RECURSIVE):
        try:
            obj = import_spl(fp, col)
            if obj:
                imported.append(obj)
        except Exception as e:
            print(f"[ERR] {fp}: {e}")

    # Select imported objects
    bpy.ops.object.select_all(action="DESELECT")
    for obj in imported:
        obj.select_set(True)
    if imported:
        bpy.context.view_layer.objects.active = imported[-1]

    print(f"Done. Imported {len(imported)} spline file(s) from: {FOLDER}")

main()
