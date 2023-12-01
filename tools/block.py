def read_Data(buffer, cursor, model):
    model['Data'] = {'LStr': [], 'other': []}
    size = buffer.readUInt32BE(cursor)
    cursor += 4

    for i in range(size):
        if buffer.toString('utf8', cursor, cursor + 4) == 'LStr':
            cursor += 4
            model['Data']['LStr'].append([
                buffer.readFloatBE(cursor),
                buffer.readFloatBE(cursor + 4),
                buffer.readFloatBE(cursor + 8)
            ])
            cursor += 12
            i += 3
        else:
            model['Data']['other'].append(buffer.readUInt32BE(cursor))
            cursor += 4

    return cursor

def read_Anim(buffer, cursor, model):
    model['Anim'] = []
    anim = buffer.readUInt32BE(cursor)

    while anim:
        model['Anim'].append(read_animation(buffer=buffer, cursor=anim, model=model))
        cursor += 4
        anim = buffer.readUInt32BE(cursor)

    return cursor + 4

def read_AltN(buffer, cursor, model):
    model['AltN'] = []
    altn = buffer.readUInt32BE(cursor)

    while altn:
        model['AltN'].append(altn)
        cursor += 4
        altn = buffer.readUInt32BE(cursor)

    return cursor + 4

def read_header(buffer, model, index):
    model['ext'] = buffer.toString('utf8', 0, 4)
    model['id'] = index
    model['header'] = []
    cursor = 4
    header = buffer.readInt32BE(cursor)

    while header != -1:
        model['header'].append(header)
        cursor += 4
        header = buffer.readInt32BE(cursor)

    cursor += 4
    header_string = buffer.toString('utf8', cursor, cursor + 4)

    while header_string != 'HEnd':
        if header_string == 'Data':
            cursor = read_Data(buffer, cursor + 4, model)
            header_string = buffer.toString('utf8', cursor, cursor + 4)
        elif header_string == 'Anim':
            cursor = read_Anim(buffer, cursor + 4, model)
            header_string = buffer.toString('utf8', cursor, cursor + 4)
        elif header_string == 'AltN':
            cursor = read_AltN(buffer, cursor + 4, model)
            header_string = buffer.toString('utf8', cursor, cursor + 4)

    return cursor + 4

def read_mat(buffer, cursor, model):
    if not cursor:
        return 0

    mat = {
        'id': cursor,
        'format': buffer.readInt32BE(cursor),
        'texture': read_mat_texture(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 8), model=model),
        'unk': read_mat_unk(buffer=buffer, cursor=buffer.readInt32BE(cursor + 12))
    }

    if cursor not in model['mats']:
        model['mats'][cursor] = mat

    return cursor

def read_mat_texture(buffer, cursor, model):
    if not cursor:
        return 0

    mat = {
        'id': cursor,
        'unk0': buffer.readInt32BE(cursor),  # 0, 1, 65, 73
        'unk1': buffer.readInt16BE(cursor + 4),  # width * 4
        'unk2': buffer.readInt16BE(cursor + 6),  # height * 4
        'unk3': buffer.readInt32BE(cursor + 8),  # always 0
        'format': buffer.readInt16BE(cursor + 12),  # 3, 512, 513, 1024
        'unk4': buffer.readInt16BE(cursor + 14),  # 0, 4
        'width': buffer.readInt16BE(cursor + 16),  # pixel width
        'height': buffer.readInt16BE(cursor + 18),  # pixel height
        'unk5': buffer.readInt16BE(cursor + 20),  # width * 512 (unsigned)
        'unk6': buffer.readInt16BE(cursor + 22),  # height * 512 (unsigned)
        'unk7': buffer.readInt16BE(cursor + 24),  # 0 when unk4 is 4,
        'unk8': buffer.readInt16BE(cursor + 26),
        'unk_pointers': [],
        'unk9': buffer.readInt16BE(cursor + 56),  # 2560, 2815 is used when cursor index is blank
        'tex_index': buffer.readInt16BE(cursor + 58),
    }

    for i in range(6):
        pointer = buffer.readInt32BE(cursor + 28 + i * 4)
        if pointer:
            mat['unk_pointers'].append({
                'unk0': buffer.readInt32BE(pointer),
                'unk1': buffer.readInt32BE(pointer + 4),
                'unk2': buffer.readInt32BE(pointer + 8),
                'unk3': buffer.readInt16BE(pointer + 12),
                'unk4': buffer.readInt16BE(pointer + 14),
            })
        else:
            break

    if cursor not in model['textures']:
        model['textures'][cursor] = mat

    return cursor

def read_mat_unk(buffer, cursor):
    if not cursor:
        return 0

    return {
        'unk0': buffer.readInt16BE(cursor),  # always 0
        'unk1': buffer.readInt16BE(cursor + 2),  # 0, 1, 8, 9
        'unk2': buffer.readInt16BE(cursor + 4),  # 1, 2
        'unk3': buffer.readInt16BE(cursor + 6),  # 287, 513, 799, 1055, 1537, 7967
        'unk4': buffer.readInt16BE(cursor + 8),  # 287, 799, 1055, 3329, 7939, 7940
        'unk5': buffer.readInt16BE(cursor + 10),  # 263, 513, 775, 1031, 1537, 1795, 1799
        'unk6': buffer.readInt16BE(cursor + 12),  # 1, 259, 263, 775, 1031, 1793, 1795, 1796, 1798,
        'unk7': buffer.readInt16BE(cursor + 14),  # 31, 287, 799, 1055, 7967
        'unk8': buffer.readInt16BE(cursor + 16),  # 31, 799, 1055, 7936, 7940
        'unk9': buffer.readInt16BE(cursor + 18),  # 7, 1799
        'unk10': buffer.readInt16BE(cursor + 20),  # 775, 1031, 1792, 1796, 1798
        'unk11': buffer.readInt16BE(cursor + 22),  # always 0
        'unk12': buffer.readInt16BE(cursor + 24),  # -14336, 68, 3080
        'unk13': buffer.readInt16BE(cursor + 26),  # 0, 1, 8200, 8312
        'unk14': buffer.readInt16BE(cursor + 28),  # 16, 17, 770
        'unk15': buffer.readInt16BE(cursor + 30),  # 120, 8200, 8248, 8296, 8312, 16840, 16856, 16960, 17216, 18760, 18768, 18808, 18809, 18888, 18904, 18936, 19280, 20048
        'unk16': buffer.readInt16BE(cursor + 32),  # probably 0?
        'r': buffer.readUInt8(cursor + 34),
        'g': buffer.readUInt8(cursor + 35),
        'b': buffer.readUInt8(cursor + 36),
        't': buffer.readUInt8(cursor + 37),
        'unk17': buffer.readInt16BE(cursor + 38),
        'unk18': buffer.readInt16BE(cursor + 40),
        'unk19': buffer.readInt16BE(cursor + 42),
        'unk20': buffer.readInt16BE(cursor + 44),
        'unk21': buffer.readInt16BE(cursor + 46),
        'unk22': buffer.readInt16BE(cursor + 48),
        'unk23': buffer.readInt16BE(cursor + 50)
    }

def read_animation(buffer, cursor, model):
    anim = {
        'float1': buffer.readFloatBE(cursor + 61 * 4),
        'float2': buffer.readFloatBE(cursor + 62 * 4),
        'float3': buffer.readFloatBE(cursor + 63 * 4),  # first three floats always match
        'flag1': buffer.readInt16BE(cursor + 64 * 4),  # always 4352
        'flag2': buffer.readInt16BE(cursor + 64 * 4 + 2),
        'num_keyframes': buffer.readInt32BE(cursor + 65 * 4),
        'float4': buffer.readFloatBE(cursor + 66 * 4),
        'float5': buffer.readFloatBE(cursor + 67 * 4),
        'float6': buffer.readFloatBE(cursor + 68 * 4),  # always 1
        'float7': buffer.readFloatBE(cursor + 69 * 4),  # always 0
        'float8': buffer.readFloatBE(cursor + 70 * 4),  # always 0
        'keyframe_times': buffer.readInt32BE(cursor + 71 * 4),
        'keyframe_poses': buffer.readInt32BE(cursor + 72 * 4),
        'target': buffer.readInt32BE(cursor + 73 * 4),
        'unk32': buffer.readInt32BE(cursor + 74 * 4),
    }

    keyframe_times = anim['keyframe_times']
    keyframe_poses = anim['keyframe_poses']
    anim['keyframe_times'] = []
    anim['keyframe_poses'] = []

    if anim['flag2'] in [2, 18]:
        anim['target'] = buffer.readUInt32BE(anim['target'])

    for f in range(anim['num_keyframes']):
        if keyframe_times:
            anim['keyframe_times'].append(buffer.readFloatBE(keyframe_times + f * 4))

        if keyframe_poses:
            if anim['flag2'] in [8, 24, 40, 56, 4152]:  # rotation (4)
                anim['keyframe_poses'].append([
                    buffer.readFloatBE(keyframe_poses + f * 16),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 4),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 8),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 12)
                ])
            elif anim['flag2'] in [25, 41, 57, 4153]:  # position (3)
                anim['keyframe_poses'].append([
                    buffer.readFloatBE(keyframe_poses + f * 12),
                    buffer.readFloatBE(keyframe_poses + f * 12 + 4),
                    buffer.readFloatBE(keyframe_poses + f * 12 + 8)
                ])
            elif anim['flag2'] in [27, 28]:  # uv_x/uv_y (1)
                anim['keyframe_poses'].append([
                    buffer.readFloatBE(keyframe_poses + f * 4)
                ])
            elif anim['flag2'] in [2, 18]:  # texture
                tex = buffer.readUInt32BE(keyframe_poses + f * 4)

                if tex < cursor:
                    anim['keyframe_poses'].append({'repeat': tex})
                else:
                    anim['keyframe_poses'].append(read_mat_texture(buffer=buffer, cursor=tex, model=model))

    return anim

def read_collision_vert_strips(buffer, cursor, count):
    if not cursor:
        return 0

    vert_strips = []

    for v in range(count):
        vert_strips.append(buffer.readInt32BE(cursor + v * 4))

    return vert_strips

def read_collision_vert_buffer(buffer, cursor, count):
    if not cursor:
        return 0

    vert_buffer = []

    for v in range(count):
        vert_buffer.append([
            buffer.readInt16BE(cursor + v * 6),
            buffer.readInt16BE(cursor + v * 6 + 2),
            buffer.readInt16BE(cursor + v * 6 + 4)
        ])

    return vert_buffer

def read_collision_triggers(buffer, cursor):
    # reads through a linked list
    next_trigger = cursor
    triggers = []

    while next_trigger:
        trigger = {
            'x': buffer.readFloatBE(next_trigger),
            'y': buffer.readFloatBE(next_trigger + 4),
            'z': buffer.readFloatBE(next_trigger + 8),
            'vx': buffer.readFloatBE(next_trigger + 12),
            'vy': buffer.readFloatBE(next_trigger + 16),
            'vz': buffer.readFloatBE(next_trigger + 20),
            'width': buffer.readFloatBE(next_trigger + 24),
            'height': buffer.readFloatBE(next_trigger + 28),
            'target': buffer.readUInt32BE(next_trigger + 32),
            'flag': buffer.readInt16BE(next_trigger + 36),
        }
        triggers.append(trigger)
        next_trigger = buffer.readUInt32BE(next_trigger + 40)

    return triggers

def read_collision_data(buffer, cursor):
    if not cursor:
        return 0

    data = {
        'unk': buffer.readInt16BE(cursor),  # 2, 4, 16, 18, 20, 32, 36
        'fog': {
            'flag': buffer.readUInt8(cursor + 2),  # 0, 1, 2, 3, 4, 5, 7, 11, 12
            'r': buffer.readUInt8(cursor + 3),
            'g': buffer.readUInt8(cursor + 4),
            'b': buffer.readUInt8(cursor + 5),
            'start': buffer.readInt16BE(cursor + 6),
            'end': buffer.readInt16BE(cursor + 8)  # 1000 - 6000
        },
        'lights': {
            'flag': buffer.readInt16BE(cursor + 10),  # 0, 1, 3, 6, 7, 11, 15, 23
            'ambient_r': buffer.readUInt8(cursor + 12),
            'ambient_g': buffer.readUInt8(cursor + 13),
            'ambient_b': buffer.readUInt8(cursor + 14),
            'r': buffer.readUInt8(cursor + 15),
            'g': buffer.readUInt8(cursor + 16),
            'b': buffer.readUInt8(cursor + 17),
            'unk1': buffer.readUInt8(cursor + 18),
            'unk2': buffer.readUInt8(cursor + 19),
            'x': buffer.readFloatBE(cursor + 20),
            'y': buffer.readFloatBE(cursor + 24),
            'z': buffer.readFloatBE(cursor + 28),
            'unk3': buffer.readFloatBE(cursor + 32),  # -1, 0, 1
            'unk4': buffer.readFloatBE(cursor + 36),  # -1, 0, 1
            'unk5': buffer.readFloatBE(cursor + 40)  # always 0
        },
        'flags': buffer.readUInt32BE(cursor + 44),  # >>> 0).toString(2),
        'unk2': buffer.readUInt32BE(cursor + 48),
        'unload': buffer.readUInt32BE(cursor + 52),  # >>> 0).toString(2),
        'load': buffer.readUInt32BE(cursor + 56),  # >>> 0).toString(2),
        'triggers': read_collision_triggers(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 60))
    }

    return data

def read_visual_index_buffer(buffer, cursor, vert_buffer_start):
    if not cursor:
        return 0

    index_buffer = []
    v = 0

    while buffer.readUInt8(cursor + v) != 223:
        type = buffer.readUInt8(cursor + v)

        if type == 1:
            index_buffer.append({
                'type': type,
                'unk1': buffer.readUInt8(cursor + v + 1),
                'unk2': buffer.readUInt8(cursor + v + 2),
                'size': buffer.readUInt8(cursor + v + 3),
                'start': (buffer.readUInt32BE(cursor + v + 4) - vert_buffer_start) / 16
            })
        elif type == 3:
            index_buffer.append({
                'type': type,
                'unk': buffer.readUInt8(cursor + v + 7)
            })
        elif type == 5:
            index_buffer.append({
                'type': type,
                'x': buffer.readUInt8(cursor + v + 1),
                'y': buffer.readUInt8(cursor + v + 2),
                'z': buffer.readUInt8(cursor + v + 3)
            })
        elif type == 6:
            index_buffer.append({
                'type': type,
                'x1': buffer.readUInt8(cursor + v + 1),
                'y1': buffer.readUInt8(cursor + v + 2),
                'z1': buffer.readUInt8(cursor + v + 3),
                'x2': buffer.readUInt8(cursor + v + 5),
                'y2': buffer.readUInt8(cursor + v + 6),
                'z2': buffer.readUInt8(cursor + v + 7)
            })

        v += 8

    return index_buffer

def read_visual_vert_buffer(buffer, cursor, count):
    vert_buffer = []
    for v in range(count):
        vert_buffer.append({
            'x': buffer.readInt16BE(cursor + v * 16),
            'y': buffer.readInt16BE(cursor + v * 16 + 2),
            'z': buffer.readInt16BE(cursor + v * 16 + 4),
            'uv_x': buffer.readInt16BE(cursor + v * 16 + 8),
            'uv_y': buffer.readInt16BE(cursor + v * 16 + 10),
            'v_color': [
                buffer.readUInt8(cursor + v * 16 + 12),
                buffer.readUInt8(cursor + v * 16 + 13),
                buffer.readUInt8(cursor + v * 16 + 14),
                buffer.readUInt8(cursor + v * 16 + 15)
            ]
        })
    return vert_buffer

def read_mesh_group(buffer, cursor, model):
    mesh = {
        'collision': {
            'data': read_collision_data(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 4)),
            'vert_strips': read_collision_vert_strips(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 36), count=buffer.readInt16BE(cursor + 32)),
            'vert_buffer': read_collision_vert_buffer(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 44), count=buffer.readInt16BE(cursor + 56)),
        },
        'visuals': {
            'material': read_mat(buffer=buffer, cursor=buffer.readUInt32BE(cursor), model=model),
            'index_buffer': read_visual_index_buffer(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 48), vert_buffer_start=buffer.readUInt32BE(cursor + 52)),
            'vert_buffer': read_visual_vert_buffer(buffer=buffer, cursor=buffer.readUInt32BE(cursor + 52), count=buffer.readInt16BE(cursor + 58)),
            'group_parent': buffer.readUInt32BE(cursor + 40),
            'group_count': buffer.readInt16BE(cursor + 62)
        },
        'min_x': buffer.readFloatBE(cursor + 8),
        'min_y': buffer.readFloatBE(cursor + 12),
        'min_z': buffer.readFloatBE(cursor + 16),
        'max_x': buffer.readFloatBE(cursor + 20),
        'max_y': buffer.readFloatBE(cursor + 24),
        'max_z': buffer.readFloatBE(cursor + 28),
        'vert_strip_count': buffer.readInt16BE(cursor + 32),
        'vert_strip_default': buffer.readInt16BE(cursor + 34)
    }

    return mesh

def read_node(buffer, cursor, model):
    node = {
        'id': cursor,
        'head': [
            buffer.readUInt32BE(cursor),
            buffer.readUInt32BE(cursor + 4),
            buffer.readUInt32BE(cursor + 8),
            buffer.readUInt32BE(cursor + 12),
            buffer.readUInt32BE(cursor + 16)
        ],
        'children': []
    }

    if model.get('AltN') and cursor in model['AltN']:
        node['AltN'] = [i for i, h in enumerate(model['AltN']) if h == cursor]
    
    if cursor in model['header']:
        node['header'] = [i for i, h in enumerate(model['header']) if h == cursor]

    if not model['node_map'].get(cursor):
        model['node_map'][cursor] = True

    mesh_group = False
    switch_value = buffer.readInt32BE(cursor)
    
    if switch_value == 12388:
        mesh_group = True
        node.update({
            'min_x': buffer.readFloatBE(cursor + 28),
            'min_y': buffer.readFloatBE(cursor + 32),
            'min_z': buffer.readFloatBE(cursor + 36),
            'max_x': buffer.readFloatBE(cursor + 40),
            'max_y': buffer.readFloatBE(cursor + 44),
            'max_z': buffer.readFloatBE(cursor + 48)
        })
    elif switch_value == 53349:
        node['xyz'] = {
            'ax': buffer.readFloatBE(cursor + 28),
            'ay': buffer.readFloatBE(cursor + 32),
            'az': buffer.readFloatBE(cursor + 36),
            'bx': buffer.readFloatBE(cursor + 40),
            'by': buffer.readFloatBE(cursor + 44),
            'bz': buffer.readFloatBE(cursor + 48),
            'cx': buffer.readFloatBE(cursor + 52),
            'cy': buffer.readFloatBE(cursor + 56),
            'cz': buffer.readFloatBE(cursor + 60),
            'x': buffer.readFloatBE(cursor + 64),
            'y': buffer.readFloatBE(cursor + 68),
            'z': buffer.readFloatBE(cursor + 72),
            'x1': buffer.readFloatBE(cursor + 76),
            'y1': buffer.readFloatBE(cursor + 80),
            'z1': buffer.readFloatBE(cursor + 84)
        }
    elif switch_value == 53348:
        node['xyz'] = {
            'ax': buffer.readFloatBE(cursor + 28),
            'ay': buffer.readFloatBE(cursor + 32),
            'az': buffer.readFloatBE(cursor + 36),
            'bx': buffer.readFloatBE(cursor + 40),
            'by': buffer.readFloatBE(cursor + 44),
            'bz': buffer.readFloatBE(cursor + 48),
            'cx': buffer.readFloatBE(cursor + 52),
            'cy': buffer.readFloatBE(cursor + 56),
            'cz': buffer.readFloatBE(cursor + 60),
            'x': buffer.readFloatBE(cursor + 64),
            'y': buffer.readFloatBE(cursor + 68),
            'z': buffer.readFloatBE(cursor + 72),
        }
    elif switch_value == 53350:
        node['53350'] = {
            'unk1': buffer.readInt32BE(cursor + 28),
            'unk2': buffer.readInt32BE(cursor + 32),
            'unk3': buffer.readInt32BE(cursor + 36),
            'unk4': buffer.readFloatBE(cursor + 40)
        }
    elif switch_value == 20582:
        node['xyz'] = {
            'f1': buffer.readFloatBE(cursor + 28),
            'f2': buffer.readFloatBE(cursor + 32),
            'f3': buffer.readFloatBE(cursor + 36),
            'f4': buffer.readFloatBE(cursor + 40),
            'f5': buffer.readFloatBE(cursor + 44),
            'f6': buffer.readFloatBE(cursor + 48),
            'f7': buffer.readFloatBE(cursor + 52),
            'f8': buffer.readFloatBE(cursor + 56),
            'f9': buffer.readFloatBE(cursor + 60),
            'f10': buffer.readFloatBE(cursor + 64),
            'f11': buffer.readFloatBE(cursor + 68)
        }

    child_count = buffer.readInt32BE(cursor + 20)
    child_start = buffer.readUInt32BE(cursor + 24)
    
    for i in range(child_count):
        child_address = buffer.readUInt32BE(child_start + i * 4)
        if not child_address:
            if model.get('AltN') and (child_start + i * 4) in model['AltN']:
                node['children'].append({'id': child_start + i * 4, 'AltN': True})
            else:
                node['children'].append({'id': None})  # remove later
            continue

        if model['node_map'].get(child_address):
            node['children'].append({'id': child_address})
            continue

        if mesh_group:
            node['children'].append(read_mesh_group(buffer=buffer, cursor=child_address, model=model))
        else:
            node['children'].append(read_node(buffer=buffer, cursor=child_address, model=model))

    return node

def read_model(buffer, index):
    print('reading model', index)
    model = {
        'mats': {},        # unique mats
        'textures': {},    # unique textures
        'node_map': {},    # unique node locations
        'nodes': [],
    }
    size = 0
    cursor = read_header(buffer=buffer, model=model, index=index, size=size)

    if model.get('AltN') and len(model['AltN']) and model.get('ext') != 'Podd':
        AltN = list(set(model['AltN']))
        for i in range(len(AltN)):
            model['nodes'].append(read_node(buffer=buffer, cursor=AltN[i], model=model))
    else:
        model['nodes'] = [read_node(buffer=buffer, cursor=cursor, model=model)]

    return model

def read_block(file, arr):
    print('file', file)
    asset_count = int.from_bytes(file[0:4], byteorder='big')
    print("asset_count", asset_count)
    cursor = 4

    for i in range(asset_count):
        for j in range(len(arr)):
            asset_start = int.from_bytes(file[cursor:cursor + 4], byteorder='big')
            cursor += 4

            asset_end = int.from_bytes(file[cursor:cursor + 4], byteorder='big')
            if not asset_end:
                asset_end = int.from_bytes(file[cursor + 4:cursor + 8], byteorder='big')

            asset = file[asset_start:asset_end] if asset_start else None

            if arr[j]:
                arr[j].append(asset)

    return arr

