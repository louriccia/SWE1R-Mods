import sys
import os
import bpy
import struct

for material in bpy.data.materials:
    material.user_clear()
    bpy.data.materials.remove(material)

for obj in bpy.data.objects:
    bpy.data.objects.remove(obj)
    
for col in bpy.data.collections:
    bpy.data.collections.remove(col)

scale = 0.01

def make_LStr(location, index):
    lightstreak_col = bpy.data.collections.get(f"{index}_lightstreaks")
    light = bpy.data.lights.new(name = "lightstreak",type = 'POINT')
    light_object = bpy.data.objects.new(name = "lightstreak", object_data = light)
    lightstreak_col.objects.link(light_object)
    light_object.location = (location[0]*scale, location[1]*scale, location[2]*scale)

def read_Data(buffer, cursor, model):
    model['Data'] = {'LStr': [], 'other': []}
    size = readUInt32BE(buffer, cursor)
    cursor += 4
    print('size', size)
    i = 0
    while i < size:
        if readString(buffer, cursor) == 'LStr':
            cursor += 4
            make_LStr(readVec3(buffer, cursor), model["id"])
            cursor += 12
            i += 4
        else:
            model['Data']['other'].append(readUInt32BE(buffer,cursor))
            i+=1
            cursor += 4

    return cursor

def read_Anim(buffer, cursor, model):
    model['Anim'] = []
    anim = readUInt32BE(buffer, cursor)

    while anim:
        model['Anim'].append(read_animation(buffer=buffer, cursor=anim, model=model))
        cursor += 4
        anim = readUInt32BE(buffer, cursor)

    return cursor + 4

def read_AltN(buffer, cursor, model):
    model['AltN'] = []
    altn = readUInt32BE(buffer, cursor)

    while altn:
        model['AltN'].append(altn)
        cursor += 4
        altn = readUInt32BE(buffer, cursor)

    return cursor + 4



def read_mat(buffer, cursor, model):
    if not cursor:
        return 0

    mat = {
        'id': cursor,
        'format': readInt32BE(buffer, cursor),
        'texture': read_mat_texture(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 8), model=model),
        'unk': read_mat_unk(buffer=buffer, cursor=readInt32BE(buffer,cursor + 12))
    }

    if cursor not in model['mats']:
        model['mats'][cursor] = mat

    return cursor

def read_mat_texture(buffer, cursor, model):
    if not cursor:
        return 0

    mat = {
        'id': cursor,
        'unk0': readInt32BE(buffer,cursor),  # 0, 1, 65, 73
        'unk1': readInt16BE(buffer, cursor + 4),  # width * 4
        'unk2': readInt16BE(buffer, cursor + 6),  # height * 4
        'unk3': readInt32BE(buffer,cursor + 8),  # always 0
        'format': readInt16BE(buffer, cursor + 12),  # 3, 512, 513, 1024
        'unk4': readInt16BE(buffer, cursor + 14),  # 0, 4
        'width': readInt16BE(buffer, cursor + 16),  # pixel width
        'height': readInt16BE(buffer, cursor + 18),  # pixel height
        'unk5': readInt16BE(buffer, cursor + 20),  # width * 512 (unsigned)
        'unk6': readInt16BE(buffer, cursor + 22),  # height * 512 (unsigned)
        'unk7': readInt16BE(buffer, cursor + 24),  # 0 when unk4 is 4,
        'unk8': readInt16BE(buffer, cursor + 26),
        'unk_pointers': [],
        'unk9': readInt16BE(buffer, cursor + 56),  # 2560, 2815 is used when cursor index is blank
        'tex_index': readInt16BE(buffer, cursor + 58),
    }

    for i in range(6):
        pointer = readInt32BE(buffer,cursor + 28 + i * 4)
        if pointer:
            mat['unk_pointers'].append({
                'unk0': readInt32BE(buffer,pointer),
                'unk1': readInt32BE(buffer,pointer + 4),
                'unk2': readInt32BE(buffer,pointer + 8),
                'unk3': readInt16BE(buffer, pointer + 12),
                'unk4': readInt16BE(buffer, pointer + 14),
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
        'unk0': readInt16BE(buffer, cursor),  # always 0
        'unk1': readInt16BE(buffer, cursor + 2),  # 0, 1, 8, 9
        'unk2': readInt16BE(buffer, cursor + 4),  # 1, 2
        'unk3': readInt16BE(buffer, cursor + 6),  # 287, 513, 799, 1055, 1537, 7967
        'unk4': readInt16BE(buffer, cursor + 8),  # 287, 799, 1055, 3329, 7939, 7940
        'unk5': readInt16BE(buffer, cursor + 10),  # 263, 513, 775, 1031, 1537, 1795, 1799
        'unk6': readInt16BE(buffer, cursor + 12),  # 1, 259, 263, 775, 1031, 1793, 1795, 1796, 1798,
        'unk7': readInt16BE(buffer, cursor + 14),  # 31, 287, 799, 1055, 7967
        'unk8': readInt16BE(buffer, cursor + 16),  # 31, 799, 1055, 7936, 7940
        'unk9': readInt16BE(buffer, cursor + 18),  # 7, 1799
        'unk10': readInt16BE(buffer, cursor + 20),  # 775, 1031, 1792, 1796, 1798
        'unk11': readInt16BE(buffer, cursor + 22),  # always 0
        'unk12': readInt16BE(buffer, cursor + 24),  # -14336, 68, 3080
        'unk13': readInt16BE(buffer, cursor + 26),  # 0, 1, 8200, 8312
        'unk14': readInt16BE(buffer, cursor + 28),  # 16, 17, 770
        'unk15': readInt16BE(buffer, cursor + 30),  # 120, 8200, 8248, 8296, 8312, 16840, 16856, 16960, 17216, 18760, 18768, 18808, 18809, 18888, 18904, 18936, 19280, 20048
        'unk16': readInt16BE(buffer, cursor + 32),  # probably 0?
        'r': readUInt8(buffer, cursor + 34),
        'g': readUInt8(buffer, cursor + 35),
        'b': readUInt8(buffer, cursor + 36),
        't': readUInt8(buffer, cursor + 37),
        'unk17': readInt16BE(buffer, cursor + 38),
        'unk18': readInt16BE(buffer, cursor + 40),
        'unk19': readInt16BE(buffer, cursor + 42),
        'unk20': readInt16BE(buffer, cursor + 44),
        'unk21': readInt16BE(buffer, cursor + 46),
        'unk22': readInt16BE(buffer, cursor + 48),
        'unk23': readInt16BE(buffer, cursor + 50)
    }

def read_animation(buffer, cursor, model):
    anim = {
        'float1': readFloatBE(buffer, cursor + 61 * 4),
        'float2': readFloatBE(buffer, cursor + 62 * 4),
        'float3': readFloatBE(buffer, cursor + 63 * 4),  # first three floats always match
        'flag1': readInt16BE(buffer, cursor + 64 * 4),  # always 4352
        'flag2': readInt16BE(buffer, cursor + 64 * 4 + 2),
        'num_keyframes': readInt32BE(buffer,cursor + 65 * 4),
        'float4': readFloatBE(buffer, cursor + 66 * 4),
        'float5': readFloatBE(buffer, cursor + 67 * 4),
        'float6': readFloatBE(buffer, cursor + 68 * 4),  # always 1
        'float7': readFloatBE(buffer, cursor + 69 * 4),  # always 0
        'float8': readFloatBE(buffer, cursor + 70 * 4),  # always 0
        'keyframe_times': readInt32BE(buffer,cursor + 71 * 4),
        'keyframe_poses': readInt32BE(buffer,cursor + 72 * 4),
        'target': readInt32BE(buffer,cursor + 73 * 4),
        'unk32': readInt32BE(buffer,cursor + 74 * 4),
    }

    keyframe_times = anim['keyframe_times']
    keyframe_poses = anim['keyframe_poses']
    anim['keyframe_times'] = []
    anim['keyframe_poses'] = []

    if anim['flag2'] in [2, 18]:
        anim['target'] = readUInt32BE(buffer,anim['target'])

    for f in range(anim['num_keyframes']):
        if keyframe_times:
            anim['keyframe_times'].append(readFloatBE(buffer, keyframe_times + f * 4))

        if keyframe_poses:
            if anim['flag2'] in [8, 24, 40, 56, 4152]:  # rotation (4)
                anim['keyframe_poses'].append([
                    readFloatBE(buffer, keyframe_poses + f * 16),
                    readFloatBE(buffer, keyframe_poses + f * 16 + 4),
                    readFloatBE(buffer, keyframe_poses + f * 16 + 8),
                    readFloatBE(buffer, keyframe_poses + f * 16 + 12)
                ])
            elif anim['flag2'] in [25, 41, 57, 4153]:  # position (3)
                anim['keyframe_poses'].append([
                    readFloatBE(buffer, keyframe_poses + f * 12),
                    readFloatBE(buffer, keyframe_poses + f * 12 + 4),
                    readFloatBE(buffer, keyframe_poses + f * 12 + 8)
                ])
            elif anim['flag2'] in [27, 28]:  # uv_x/uv_y (1)
                anim['keyframe_poses'].append([
                    readFloatBE(buffer, keyframe_poses + f * 4)
                ])
            elif anim['flag2'] in [2, 18]:  # texture
                tex = readUInt32BE(buffer,keyframe_poses + f * 4)

                if tex < cursor:
                    anim['keyframe_poses'].append({'repeat': tex})
                else:
                    anim['keyframe_poses'].append(read_mat_texture(buffer=buffer, cursor=tex, model=model))

    return anim

def read_collision_vert_strips(buffer, cursor, count, default):
    if not cursor:
        return 0

    vert_strips = []

    for v in range(count):
        vert_strips.append(readInt32BE(buffer, cursor + v * 4))

    return vert_strips

def read_collision_vert_buffer(buffer, cursor, count):
    if not cursor:
        return 0

    vert_buffer = []

    for v in range(count):
        vert_buffer.append([
            readInt16BE(buffer, cursor + v * 6),
            readInt16BE(buffer, cursor + v * 6 + 2),
            readInt16BE(buffer, cursor + v * 6 + 4)
        ])

    return vert_buffer

def read_collision_triggers(buffer, cursor):
    # reads through a linked list
    next_trigger = cursor
    triggers = []

    while next_trigger:
        trigger = {
            'x': readFloatBE(buffer, next_trigger),
            'y': readFloatBE(buffer, next_trigger + 4),
            'z': readFloatBE(buffer, next_trigger + 8),
            'vx': readFloatBE(buffer, next_trigger + 12),
            'vy': readFloatBE(buffer, next_trigger + 16),
            'vz': readFloatBE(buffer, next_trigger + 20),
            'width': readFloatBE(buffer, next_trigger + 24),
            'height': readFloatBE(buffer, next_trigger + 28),
            'target': readUInt32BE(buffer,next_trigger + 32),
            'flag': readInt16BE(buffer, next_trigger + 36),
        }
        triggers.append(trigger)
        next_trigger = readUInt32BE(buffer,next_trigger + 40)

    return triggers

def read_collision_data(buffer, cursor):
    if not cursor:
        return 0

    data = {
        'unk': readInt16BE(buffer, cursor),  # 2, 4, 16, 18, 20, 32, 36
        'fog_flag': readUInt8(buffer, cursor + 2),  # 0, 1, 2, 3, 4, 5, 7, 11, 12
        'fog_color': [a/255 for a in [readUInt8(buffer, cursor + 3), readUInt8(buffer, cursor + 4), readUInt8(buffer, cursor + 5), 255]],
        'fog_start': readInt16BE(buffer, cursor + 6),
        'fog_stop': readInt16BE(buffer, cursor + 8),  # 1000 - 6000
        'lights_flag': readInt16BE(buffer, cursor + 10),  # 0, 1, 3, 6, 7, 11, 15, 23
        'lights_ambient_color': [a/255 for a in [readUInt8(buffer, cursor + 12),readUInt8(buffer, cursor + 13),readUInt8(buffer, cursor + 14), 255]],
        'lights_color': [a/255 for a in [readUInt8(buffer, cursor + 15), readUInt8(buffer, cursor + 16),  readUInt8(buffer, cursor + 17), 255]],
        'unk1': readUInt8(buffer, cursor + 18),
        'unk2': readUInt8(buffer, cursor + 19),
        'lights_pos': [readFloatBE(buffer, cursor + 20), readFloatBE(buffer, cursor + 24), readFloatBE(buffer, cursor + 28)],
        'lights_rot': [ readFloatBE(buffer, cursor + 32), readFloatBE(buffer, cursor + 36),  readFloatBE(buffer, cursor + 40)],
        'flags': readUInt32BE(buffer,cursor + 44),  # >>> 0).toString(2),
        'unk3': readUInt32BE(buffer,cursor + 48),
        'unload': readUInt32BE(buffer,cursor + 52),  # >>> 0).toString(2),
        'load': readUInt32BE(buffer,cursor + 56),  # >>> 0).toString(2),
        'triggers': read_collision_triggers(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 60))
    }

    return data

def read_visual_index_buffer(buffer, cursor, vert_buffer_start):
    if not cursor:
        return 0

    index_buffer = []
    v = 0

    while readUInt8(buffer, cursor + v) != 223:
        type = readUInt8(buffer, cursor + v)

        if type == 1:
            index_buffer.append({
                'type': type,
                'unk1': readUInt8(buffer, cursor + v + 1),
                'unk2': readUInt8(buffer, cursor + v + 2),
                'size': readUInt8(buffer, cursor + v + 3),
                'start': (readUInt32BE(buffer,cursor + v + 4) - vert_buffer_start) / 16
            })
        elif type == 3:
            index_buffer.append({
                'type': type,
                'unk': readUInt8(buffer, cursor + v + 7)
            })
        elif type == 5:
            index_buffer.append({
                'type': type,
                'x': readUInt8(buffer, cursor + v + 1),
                'y': readUInt8(buffer, cursor + v + 2),
                'z': readUInt8(buffer, cursor + v + 3)
            })
        elif type == 6:
            index_buffer.append({
                'type': type,
                'x1': readUInt8(buffer, cursor + v + 1),
                'y1': readUInt8(buffer, cursor + v + 2),
                'z1': readUInt8(buffer, cursor + v + 3),
                'x2': readUInt8(buffer, cursor + v + 5),
                'y2': readUInt8(buffer, cursor + v + 6),
                'z2': readUInt8(buffer, cursor + v + 7)
            })

        v += 8

    return index_buffer

def read_visual_vert_buffer(buffer, cursor, count):
    vert_buffer = []
    for v in range(count):
        vert_buffer.append({
            'x': readInt16BE(buffer, cursor + v * 16),
            'y': readInt16BE(buffer, cursor + v * 16 + 2),
            'z': readInt16BE(buffer, cursor + v * 16 + 4),
            'uv_x': readInt16BE(buffer, cursor + v * 16 + 8),
            'uv_y': readInt16BE(buffer, cursor + v * 16 + 10),
            'v_color': [
                readUInt8(buffer, cursor + v * 16 + 12),
                readUInt8(buffer, cursor + v * 16 + 13),
                readUInt8(buffer, cursor + v * 16 + 14),
                readUInt8(buffer, cursor + v * 16 + 15)
            ]
        })
    return vert_buffer

def make_mesh_group(mesh_node, model, parent):
    if not 'collision' in mesh_node:
        return
    
    if (mesh_node['collision']['vert_buffer'] == 0 or len(mesh_node['collision']['vert_buffer']) < 3):
        return
            
    verts = mesh_node['collision']['vert_buffer']
    edges = []
    faces = []
    start = 0
    vert_strips = [mesh_node['vert_strip_default'] for s in range(mesh_node['vert_strip_count'])]
    
    if(mesh_node['collision']['vert_strips'] != 0): #if there is a provided strip buffer
        vert_strips = mesh_node['collision']['vert_strips']
        for strip in vert_strips:
            for s in range(strip -2):
                if (s % 2) == 0:
                    faces.append( [start+s, start+s+1, start+s+2])
                else:
                    faces.append( [start+s+1, start+s, start+s+2])
            start += strip
    else: #if there is no strip buffer
        for strip in vert_strips:
            for s in range(strip -2):
                if (strip == 3):
                    faces.append( [start+s, start+s+1, start+s+2])
                else:
                    if (s % 2) == 0:
                        faces.append( [start+s, start+s+1, start+s+3])
                    else:
                        faces.append( [start+s, start+s+1, start+s+2])
            start += strip
            
    mesh_name = mesh_node['id'] + "_" + "collision"
    mesh = bpy.data.meshes.new(mesh_name)
    obj = bpy.data.objects.new(mesh_name, mesh)
    
    obj['vert_strips'] = mesh_node['collision']['vert_strips']
    obj['type'] = 'COL'    
    obj.scale = [scale, scale, scale]

    model['collection'].objects.link(obj)
    mesh.from_pydata(verts, edges, faces)
    obj.parent = parent

    if(mesh_node['collision']['data'] == 0):
        return 
    
    for key in mesh_node['collision']['data']:
        obj[key] = mesh_node['collision']['data'][key]
    
    obj.id_properties_ui('fog_color').update(subtype='COLOR')
    obj.id_properties_ui('lights_ambient_color').update(subtype='COLOR')
    obj.id_properties_ui('lights_color').update(subtype='COLOR')
    
   

def read_mesh_group(buffer, cursor, model, parent):
    mesh = {
        'id': str(cursor),
        'collision': {
            'data': read_collision_data(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 4)),
            'vert_strips': read_collision_vert_strips(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 36), count=readInt16BE(buffer, cursor + 32), default=readInt16BE(buffer, cursor + 34)),
            'vert_buffer': read_collision_vert_buffer(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 44), count=readInt16BE(buffer, cursor + 56)),
        },
        'visuals': {
            'material': read_mat(buffer=buffer, cursor=readUInt32BE(buffer,cursor), model=model),
            'index_buffer': read_visual_index_buffer(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 48), vert_buffer_start=readUInt32BE(buffer,cursor + 52)),
            'vert_buffer': read_visual_vert_buffer(buffer=buffer, cursor=readUInt32BE(buffer,cursor + 52), count=readInt16BE(buffer, cursor + 58)),
            'group_parent': readUInt32BE(buffer,cursor + 40),
            'group_count': readInt16BE(buffer, cursor + 62)
        },
        'vert_strip_count': readInt16BE(buffer, cursor + 32),
        'vert_strip_default': readInt16BE(buffer, cursor + 34)
    }
    
    make_mesh_group(mesh, model, parent)

    return mesh

def make_node(node, model, parent):
    node_name = str(node['id'])
    if (node['head'][0] in [53349, 53350]):
        new_empty = bpy.data.objects.new(node_name, None)
        model['collection'].objects.link(new_empty)
        
        #new_empty.empty_display_size = 2
        

        if node['head'][3] &  1048576 != 0:
            new_empty.empty_display_type = 'ARROWS'
            new_empty.empty_display_size = 0.5
            
        elif node['head'][3] & 524288 != 0:
            new_empty.empty_display_type = 'CIRCLE'
            new_empty.empty_display_size = 0.5
        else:
            new_empty.empty_display_type = 'PLAIN_AXES'
        if node['head'][0] ==53349:
            #new_empty.location = [node['xyz']['x']*scale, node['xyz']['y']*scale, node['xyz']['z']*scale]
            if node['head'][3] &  1048576 != 0 and False:
                
                global offsetx
                global offsety
                global offsetz
                offsetx = node['xyz']['x1']
                offsety = node['xyz']['y1']
                offsetz = node['xyz']['z1']
                imparent = None
                if parent != None and False:
                    imparent = parent
                    while imparent != None:
                        #print(imparent, imparent['grouptag0'], imparent['grouptag3'])
                        if int(imparent['grouptag0']) == 53349 and int(imparent['grouptag3']) & 1048576 != 0:
                            #print('found one')
                            offsetx += imparent['x']
                            offsety += imparent['y']
                            offsetz += imparent['z']
                        imparent = imparent.parent
                #print(offsetx, offsety, offsetz)
                new_empty.matrix_world = [
                [node['xyz']['ax'], node['xyz']['ay'], node['xyz']['az'], 0],
                [node['xyz']['bx'], node['xyz']['by'], node['xyz']['bz'], 0],
                [node['xyz']['cx'], node['xyz']['cy'], node['xyz']['cz'], 0],
                [node['xyz']['x']*scale + offsetx*scale,  node['xyz']['y']*scale + offsety*scale, node['xyz']['z']*scale + offsetz*scale, 1],
                ]
            else:
                new_empty.matrix_world = [
                [node['xyz']['ax'], node['xyz']['ay'], node['xyz']['az'], 0],
                [node['xyz']['bx'], node['xyz']['by'], node['xyz']['bz'], 0],
                [node['xyz']['cx'], node['xyz']['cy'], node['xyz']['cz'], 0],
                [node['xyz']['x']*scale, node['xyz']['y']*scale, node['xyz']['z']*scale, 1],
                ]
            
    else:
        new_empty = bpy.data.objects.new(node_name, None)
        #new_empty.empty_display_type = 'PLAIN_AXES'
        new_empty.empty_display_size = 0
        model['collection'].objects.link(new_empty)
        
    #set group tags
    new_empty['head0'] = str(node['head'][0])
    new_empty['head1'] = str(node['head'][1])
    new_empty['head2'] = str(node['head'][2])
    new_empty['head3'] = str(node['head'][3])
    
    if (node['head'][0] in [53349, 53350]):
        new_empty['grouptag3'] = bin(int(node['head'][3]))
        if 'xyz' in node:
            new_empty['x'] = node['xyz']['x']
            new_empty['y'] = node['xyz']['y']
            new_empty['z'] = node['xyz']['z']
            if 'x1' in node['xyz']:
                new_empty['x1'] = node['xyz']['x1']
                new_empty['y1'] = node['xyz']['y1']
                new_empty['z1'] = node['xyz']['z1']
        
    #assign parent
    if parent != None:
        #savedState = new_empty.matrix_world
        if node['head'][0] not in [53349, 53350] or node['head'][3] & 1048576 == 0 and False:
            new_empty.parent = parent
            #if(node['head'][3] & 1048576) == 0:
            #loc = new_empty.constraints.new(type='COPY_LOCATION')
            #loc.target = parent
            #elif(node['head'][3] & 524288) == 0:
                #rot = new_empty.constraints.new(type='COPY_ROTATION')
                #rot.target = parent
            #else:
                #new_empty.parent = parent
                
        else:
            new_empty.parent = parent
        #new_empty.matrix_world = savedState
        
    return new_empty

def read_node(buffer, cursor, model, parent):
    node = {
        'id': cursor,
        'head': [
            readUInt32BE(buffer, cursor),
            readUInt32BE(buffer, cursor + 4),
            readUInt32BE(buffer, cursor + 8),
            readUInt32BE(buffer, cursor + 12),
            readUInt32BE(buffer, cursor + 16)
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
    switch_value = readInt32BE(buffer,cursor)
    
    if switch_value == 12388:
        mesh_group = True
        node.update({
            'min_x': readFloatBE(buffer, cursor + 28),
            'min_y': readFloatBE(buffer, cursor + 32),
            'min_z': readFloatBE(buffer, cursor + 36),
            'max_x': readFloatBE(buffer, cursor + 40),
            'max_y': readFloatBE(buffer, cursor + 44),
            'max_z': readFloatBE(buffer, cursor + 48)
        })
    elif switch_value == 53349:
        node['xyz'] = {
            'ax': readFloatBE(buffer, cursor + 28),
            'ay': readFloatBE(buffer, cursor + 32),
            'az': readFloatBE(buffer, cursor + 36),
            'bx': readFloatBE(buffer, cursor + 40),
            'by': readFloatBE(buffer, cursor + 44),
            'bz': readFloatBE(buffer, cursor + 48),
            'cx': readFloatBE(buffer, cursor + 52),
            'cy': readFloatBE(buffer, cursor + 56),
            'cz': readFloatBE(buffer, cursor + 60),
            'x': readFloatBE(buffer, cursor + 64),
            'y': readFloatBE(buffer, cursor + 68),
            'z': readFloatBE(buffer, cursor + 72),
            'x1': readFloatBE(buffer, cursor + 76),
            'y1': readFloatBE(buffer, cursor + 80),
            'z1': readFloatBE(buffer, cursor + 84)
        }
    elif switch_value == 53348:
        node['xyz'] = {
            'ax': readFloatBE(buffer, cursor + 28),
            'ay': readFloatBE(buffer, cursor + 32),
            'az': readFloatBE(buffer, cursor + 36),
            'bx': readFloatBE(buffer, cursor + 40),
            'by': readFloatBE(buffer, cursor + 44),
            'bz': readFloatBE(buffer, cursor + 48),
            'cx': readFloatBE(buffer, cursor + 52),
            'cy': readFloatBE(buffer, cursor + 56),
            'cz': readFloatBE(buffer, cursor + 60),
            'x': readFloatBE(buffer, cursor + 64),
            'y': readFloatBE(buffer, cursor + 68),
            'z': readFloatBE(buffer, cursor + 72),
        }
    elif switch_value == 53350:
        node['53350'] = {
            'unk1': readInt32BE(buffer,cursor + 28),
            'unk2': readInt32BE(buffer,cursor + 32),
            'unk3': readInt32BE(buffer,cursor + 36),
            'unk4': readFloatBE(buffer, cursor + 40)
        }
    elif switch_value == 20582:
        node['xyz'] = {
            'f1': readFloatBE(buffer, cursor + 28),
            'f2': readFloatBE(buffer, cursor + 32),
            'f3': readFloatBE(buffer, cursor + 36),
            'f4': readFloatBE(buffer, cursor + 40),
            'f5': readFloatBE(buffer, cursor + 44),
            'f6': readFloatBE(buffer, cursor + 48),
            'f7': readFloatBE(buffer, cursor + 52),
            'f8': readFloatBE(buffer, cursor + 56),
            'f9': readFloatBE(buffer, cursor + 60),
            'f10': readFloatBE(buffer, cursor + 64),
            'f11': readFloatBE(buffer, cursor + 68)
        }

    child_count = readInt32BE(buffer,cursor + 20)
    child_start = readUInt32BE(buffer,cursor + 24)
    
    
    
    node_empty = make_node(node, model, parent)
        
        
    
    for i in range(child_count):
        child_address = readUInt32BE(buffer,child_start + i * 4)
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
            node['children'].append(read_mesh_group(buffer=buffer, cursor=child_address, model=model, parent = node_empty))
        else:
            node['children'].append(read_node(buffer=buffer, cursor=child_address, model=model, parent = node_empty))

    return node

def readUInt8(buffer, cursor):
    return int.from_bytes(buffer[cursor: cursor+1], byteorder='big')

def readInt8(buffer, cursor):
    return int.from_bytes(buffer[cursor: cursor+1], byteorder='big', signed = True)

def readUInt16BE(buffer, cursor):
    return int.from_bytes(buffer[cursor:cursor + 2], byteorder='big')

def readInt16BE(buffer, cursor):
    return int.from_bytes(buffer[cursor:cursor + 2], byteorder='big', signed = True)

def readUInt32BE(buffer, cursor):
    return int.from_bytes(buffer[cursor:cursor + 4], byteorder='big')

def readInt32BE(buffer, cursor):
    return int.from_bytes(buffer[cursor:cursor + 4], byteorder='big', signed = True)

def readString(buffer, cursor):
    return struct.unpack('4s', buffer[cursor: cursor +4])[0].decode('utf-8', errors='replace')

def readFloatBE(buffer, cursor):
    return struct.unpack('>f', buffer[cursor: cursor +4])[0]

def readVec3(buffer, cursor):
    return struct.unpack('>fff', buffer[cursor: cursor +12])

def read_header(buffer, model, index, collection):
    model['ext'] = readString(buffer, 0)
    model['id'] = index
    model['header'] = []
    cursor = 4
    header = readInt32BE(buffer, cursor)

    while header != -1:
        model['header'].append(header)
        cursor += 4
        header = readInt32BE(buffer, cursor)

    collection['header'] = model['header']
    cursor += 4
    header_string = readString(buffer, cursor)

    while header_string != 'HEnd':
        if header_string == 'Data':
            cursor = read_Data(buffer, cursor + 4, model)
            header_string = readString(buffer, cursor)
        elif header_string == 'Anim':
            cursor = read_Anim(buffer, cursor + 4, model)
            header_string = readString(buffer, cursor)
        elif header_string == 'AltN':
            cursor = read_AltN(buffer, cursor + 4, model)
            header_string = readString(buffer, cursor)

    return cursor + 4

def read_model(buffer, index):
    print('reading model', index)
    model = {
        'mats': {},        # unique mats
        'textures': {},    # unique textures
        'node_map': {},    # unique node locations
        'nodes': [],
    }
    
    main_collection = bpy.data.collections.new(f"{index}_{readString(buffer, 0)}")
    main_collection['ext'] = readString(buffer, 0)
    main_collection['ind'] = index
    main_collection['type'] = 'MODEL'
    bpy.context.scene.collection.children.link(main_collection)
    model['collection'] = main_collection
    lightstreaks_col = bpy.data.collections.new(f"{index}_lightstreaks")
    lightstreaks_col['type'] = 'LSTR'
    main_collection.children.link(lightstreaks_col)
    
    cursor = read_header(buffer=buffer, model=model, index=index, collection=main_collection)    

    if model.get('AltN') and len(model['AltN']) and model.get('ext') != 'Podd':
        AltN = list(set(model['AltN']))
        for i in range(len(AltN)):
            model['nodes'].append(read_node(buffer=buffer, cursor=AltN[i], model=model, parent = None))
    else:
        model['nodes'] = [read_node(buffer=buffer, cursor=cursor, model=model, parent = None)]

    return model

def read_block(file, arr, selector):
    asset_count = int.from_bytes(file[0:4], byteorder='big')
    cursor = 4
    chunks = len(arr)
    
    for i in (selector if len(selector) else range(asset_count)):
        print(i)
        for j in range(chunks):
            asset_start = readUInt32BE(file, 4 + i*4*chunks + j * 4)
            cursor += 4

            asset_end = readUInt32BE(file, 4 + i*4*chunks + j * 4 + 4)
            if not asset_end:
                asset_end = readUInt32BE(file, 4 + i*4*chunks + j * 4 + 8)

            asset = file[asset_start:asset_end] if asset_start else None

            arr[j].append(asset)

    return arr







file_path = 'C:/Users/louri/Documents/GitHub/SWE1R-Mods/tools/in/out_modelblock.bin'

selector = [115]

with open(file_path, 'rb') as file:
    file = file.read()
    read_block_result = read_block(file, [[], []], selector)

offset_buffers, model_buffers = read_block_result

for i, buffer in enumerate(model_buffers):
    model = read_model(buffer, selector[i] if len(selector) else i)

print(f'Successfully unpacked {len(model_buffers)} models')