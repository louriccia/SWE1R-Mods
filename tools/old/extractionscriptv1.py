import bpy
import json
import csv
import glob
from os.path import exists
import math
import numpy
import mathutils
path = "C:/Users/louri/Documents/GitHub/test/models/Pupp/"
all_files = glob.glob(path + "*.json")

trackdata = {
"115": {"cam": "189352", "spline":"386612", "showbyte":16},
"142": {"cam": "318536", "spline":"292432", "showbyte":16},
"130": {"cam": "140588", "spline":"89000", "showbyte":16},
"133": {"cam": "230572", "spline":"182364", "showbyte":16},
"232": {"cam": "231428", "spline":"379124", "showbyte":16},
"145": {"cam": "239924", "spline":"347156", "showbyte":16},
"143": {"cam": "397828", "spline":"293792", "showbyte":32},
"134": {"cam": "319392", "spline":"190208", "showbyte":32},
"131": {"cam": "213792", "spline":"156528", "showbyte":32},
"233": {"cam": "322952", "spline":"320248", "showbyte":32},
"136": {"cam": "232284", "spline":"210584", "showbyte":16},
"144": {"cam": "399288", "spline":"301956", "showbyte":64},
"139": {"cam": "398012", "spline":"256768", "showbyte":16},
"135": {"cam": "255912", "spline":"201496", "showbyte":64},
"148": {"cam": "240780", "spline":"355320", "showbyte":32},
"315": {"cam": "424804", "spline":"323808", "showbyte":64},
"140": {"cam": "331568", "spline":"242492", "showbyte":16},
"132": {"cam": "214648", "spline":"166708", "showbyte":64},
"137": {"cam": "234836", "spline":"215504", "showbyte":32},
"141": {"cam": "425660", "spline":"278052", "showbyte":16},
"1": {"cam": "253344", "spline":"73864", "showbyte":16},
"128": {"cam": "254200", "spline":"51624", "showbyte":16},
"138": {"cam": "238228", "spline":"221568", "showbyte":64},
"231": {"cam": "241636", "spline":"366844", "showbyte":64},
"129": {"cam": "255056", "spline":"266276", "showbyte":16}
}

    
scale = 0.01


for material in bpy.data.materials:
    material.user_clear()
    bpy.data.materials.remove(material)

for path in all_files:
    #f = open(fp)
    f = open(path)
    # returns JSON object as
    # a dictionary
    data = json.load(f)
    name = str(data['model']) + '_' + data['name']
    main_parent = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(bpy.data.collections[name])

    new_col = bpy.data.collections.new("lightstreaks")
    col = bpy.data.collections.get(str(data['model']) + '_' + data['name'])
    col.children.link(new_col)

    #showbyte = trackdata[str(data['model'])]['showbyte']
    showbyte = None

    if 'data' in data['header']:
        for l in data['header']['data']['lightstreaks']:
            light = bpy.data.lights.new(name = "lightstreak",type = 'POINT')
            light_object = bpy.data.objects.new(name = "lightstreak", object_data = light)
            new_col.objects.link(light_object)
            light_object.location = (l[0]*scale, l[1]*scale, l[2]*scale)
    def getStuff (structure, parent, collection, header, constraint):
        for i in structure:
            #print(i)
            if 'children' in structure[i]:
                new_parent = str(i)# + ": " + str(structure[i]['head'][0])
                
                #if data['extension'] == "Trak":
                    #if (str(i) in [str(data['header']['head'][0]), str(data['header']['head'][1]), str(data['header']['head'][2]), str(data['header']['head'][3]), str(data['header']['head'][4]), str(data['header']['head'][5])]):
                        #new_parent = "**" + new_parent + "**"
                
                if 'min_x' in structure[i] and False:
                    new_empty = bpy.data.objects.new("bb_" + i, None)
                    collection.objects.link(new_empty)   
                    new_empty.empty_display_type = 'CUBE'
                    new_empty.location = [(structure[i]['min_x'] + structure[i]['max_x'])*scale/2, (structure[i]['min_y'] + structure[i]['max_y'])*scale/2, (structure[i]['min_z'] + structure[i]['max_z'])*scale/2]
                    new_empty.scale = [(structure[i]['max_x'] - structure[i]['min_x'])*scale/2,(structure[i]['max_y'] - structure[i]['min_y'])*scale/2,(structure[i]['max_z'] - structure[i]['min_z'])*scale/2]
                    new_empty.parent = parent
                
                if (structure[i]['head'][0] in [53349, 53350]):
                    new_empty = bpy.data.objects.new(new_parent, None)
                    collection.objects.link(new_empty)
                    
                    #new_empty.empty_display_size = 2
                    

                    if structure[i]['head'][3] &  1048576 != 0:
                        new_empty.empty_display_type = 'ARROWS'
                        new_empty.empty_display_size = 0.5
                        
                    elif structure[i]['head'][3] & 524288 != 0:
                        new_empty.empty_display_type = 'CIRCLE'
                        new_empty.empty_display_size = 0.5
                    else:
                        new_empty.empty_display_type = 'PLAIN_AXES'
                    if structure[i]['head'][0] ==53349:
                        #new_empty.location = [structure[i]['xyz']['x']*scale, structure[i]['xyz']['y']*scale, structure[i]['xyz']['z']*scale]
                        if structure[i]['head'][3] &  1048576 != 0 and False:
                            
                            global offsetx
                            global offsety
                            global offsetz
                            offsetx = structure[i]['xyz']['x1']
                            offsety = structure[i]['xyz']['y1']
                            offsetz = structure[i]['xyz']['z1']
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
                            [structure[i]['xyz']['ax'], structure[i]['xyz']['ay'], structure[i]['xyz']['az'], 0],
                            [structure[i]['xyz']['bx'], structure[i]['xyz']['by'], structure[i]['xyz']['bz'], 0],
                            [structure[i]['xyz']['cx'], structure[i]['xyz']['cy'], structure[i]['xyz']['cz'], 0],
                            [structure[i]['xyz']['x']*scale + offsetx*scale,  structure[i]['xyz']['y']*scale + offsety*scale, structure[i]['xyz']['z']*scale + offsetz*scale, 1],
                            ]
                        else:
                            new_empty.matrix_world = [
                            [structure[i]['xyz']['ax'], structure[i]['xyz']['ay'], structure[i]['xyz']['az'], 0],
                            [structure[i]['xyz']['bx'], structure[i]['xyz']['by'], structure[i]['xyz']['bz'], 0],
                            [structure[i]['xyz']['cx'], structure[i]['xyz']['cy'], structure[i]['xyz']['cz'], 0],
                            [structure[i]['xyz']['x']*scale, structure[i]['xyz']['y']*scale, structure[i]['xyz']['z']*scale, 1],
                            ]
                        
                else:
                    new_empty = bpy.data.objects.new(new_parent, None)
                    #new_empty.empty_display_type = 'PLAIN_AXES'
                    new_empty.empty_display_size = 0
                    collection.objects.link(new_empty)
                
                #set group tags
                new_empty['grouptag0'] = str(structure[i]['head'][0])
                new_empty['grouptag1'] = str(structure[i]['head'][1])
                new_empty['grouptag2'] = str(structure[i]['head'][2])
                new_empty['grouptag3'] = str(structure[i]['head'][3])
                
                if (structure[i]['head'][0] in [53349, 53350]):
                    new_empty['grouptag3'] = bin(int(structure[i]['head'][3]))
                    if 'xyz' in structure[i]:
                        new_empty['x'] = structure[i]['xyz']['x']
                        new_empty['y'] = structure[i]['xyz']['y']
                        new_empty['z'] = structure[i]['xyz']['z']
                        if 'x1' in structure[i]['xyz']:
                            new_empty['x1'] = structure[i]['xyz']['x1']
                            new_empty['y1'] = structure[i]['xyz']['y1']
                            new_empty['z1'] = structure[i]['xyz']['z1']
                    
                #assign parent
                if parent != None:
                    #savedState = new_empty.matrix_world
                    if structure[i]['head'][0] not in [53349, 53350] or structure[i]['head'][3] & 1048576 == 0 and False:
                        new_empty.parent = parent
                        #if(structure[i]['head'][3] & 1048576) == 0:
                        #loc = new_empty.constraints.new(type='COPY_LOCATION')
                        #loc.target = parent
                        #elif(structure[i]['head'][3] & 524288) == 0:
                            #rot = new_empty.constraints.new(type='COPY_ROTATION')
                            #rot.target = parent
                        #else:
                            #new_empty.parent = parent
                            
                    else:
                        new_empty.parent = parent
                    #new_empty.matrix_world = savedState
                if constraint != None:
                    loc = new_empty.constraints.new(type='COPY_LOCATION')
                    rot = new_empty.constraints.new(type='COPY_ROTATION')
                    loc.target = constraint
                    rot.target = constraint
                if 'anim' in header:
                    if new_parent in header['anim']:
                        anim = header['anim'][new_parent]
                        if '57' in anim or '41' in anim or '25' in anim or '4153' in anim:
                            #fcurve = new_empty.animation_data.action.fcurves.new(data_path = "location
                            if '57' in anim:
                                child = '57'
                            elif '41' in anim:
                                child = '41'
                            elif '25' in anim:
                                child = '25'
                            elif '4153' in anim:
                                child = '4153'
                            for f in range(anim[child]['num_keyframes']):
                                new_empty.location = [anim[child]['keyframe_poses'][f][0]*scale, anim[child]['keyframe_poses'][f][1]*scale, anim[child]['keyframe_poses'][f][2]*scale]
                                kf = new_empty.keyframe_insert(data_path="location", frame = round(anim[child]['keyframe_times'][f] * 60))
                        if '56' in anim or '8' in anim or '24' in anim or '40' in anim or '4152' in anim:
                            if '8' in anim:
                                child = '8'
                            if '56' in anim:
                                child = '56'
                            elif '40' in anim:
                                child = '40'
                            elif '24' in anim:
                                child = '24'
                            elif '4152' in anim:
                                child = '4152'
                            new_empty.rotation_mode = 'QUATERNION'
                            previous_q = None
                            for f in range(anim[child]['num_keyframes']):
                                axis_angle = [anim[child]['keyframe_poses'][f][3]*math.pi/180, anim[child]['keyframe_poses'][f][0], anim[child]['keyframe_poses'][f][1], anim[child]['keyframe_poses'][f][2]]
                                angle, *axis = axis_angle
                                R = mathutils.Matrix.Rotation(angle, 4, axis)
                                R = R.to_quaternion()
                                if previous_q != None:
                                    R.make_compatible(previous_q)
                                new_empty.rotation_quaternion = R
                                kf = new_empty.keyframe_insert(data_path="rotation_quaternion", frame = round(anim[child]['keyframe_times'][f] * 60))
                                previous_q = R
                            #fcurve.modifiers.new(type = 'CYCLES')
                        if new_empty.animation_data is not None and new_empty.animation_data.action is not None:
                            for fcurves_f in new_empty.animation_data.action.fcurves:
                                #new_modifier = fcurves_f.modifiers.new(type='CYCLES')
                                for k in fcurves_f.keyframe_points:
                                    k.interpolation = 'LINEAR'
                            
                getStuff (structure[i]['children'], new_empty, collection, header, None)
            else:
                if 'min_x' in structure[i] and False:
                        new_empty = bpy.data.objects.new("bb_" + i, None)
                        collection.objects.link(new_empty)   
                        new_empty.empty_display_type = 'CUBE'
                        new_empty.location = [(structure[i]['min_x'] + structure[i]['max_x'])*scale/2, (structure[i]['min_y'] + structure[i]['max_y'])*scale/2, (structure[i]['min_z'] + structure[i]['max_z'])*scale/2]
                        new_empty.scale = [(structure[i]['max_x'] - structure[i]['min_x'])*scale/2,(structure[i]['max_y'] - structure[i]['min_y'])*scale/2,(structure[i]['max_z'] - structure[i]['min_z'])*scale/2]
                        new_empty.parent = parent
                if 'collision' in structure[i]:
                    if (structure[i]['collision']['vert_buffer'] != 0 and len(structure[i]['collision']['vert_buffer']) > 2):
                        
                        verts = []
                        edges = []
                        faces = []
                        for v in range(structure[i]['collision']['vertex_count']):
                            vert = structure[i]['collision']['vert_buffer'][v]
                            verts.append( [vert[0], vert[1], vert[2]])
                        
                        vert_strips = []
                        for s in range(structure[i]['vert_strip_count']):
                            vert_strips.append(structure[i]['vert_strip_default'])
                        if(structure[i]['collision']['vert_strips'] != 0):
                            vert_strips = []
                            for v in structure[i]['collision']['vert_strips']:
                                vert_strips.append(v)
                            start = 0
                            for v in vert_strips:
                                for s in range(v -2):
                                    if (s % 2) == 0:
                                        faces.append( [start+s, start+s+1, start+s+2])
                                    else:
                                        faces.append( [start+s+1, start+s, start+s+2])
                                start += v
                        else:
                            start = 0
                            for v in vert_strips:
                                for s in range(v -2):
                                    if (v == 3):
                                        faces.append( [start+s, start+s+1, start+s+2])
                                    else:
                                        if (s % 2) == 0:
                                            faces.append( [start+s, start+s+1, start+s+3])
                                        else:
                                            faces.append( [start+s, start+s+1, start+s+2])
                                start += v
                        mesh_name = str(i) + "_" + "collision"
                        if showbyte != None and (int(parent['grouptag2']) & showbyte == 0):
                            mesh_name += "_unloaded"
                        mesh = bpy.data.meshes.new(mesh_name)
                        obj = bpy.data.objects.new(mesh_name, mesh)
                        obj.scale = [scale, scale, scale]
                        if(structure[i]['collision']['data'] != 0):
                            rna_ui = obj.get('_RNA_UI')
                            if rna_ui is None:
                                rna_ui = obj['_RNA_UI'] = {}
                            rna_ui = obj.get('_RNA_UI')
                            
                            obj['00'] = structure[i]['collision']['data']['unk']
                            obj['00_fog_flag'] = structure[i]['collision']['data']['fog']['flag']
                            obj["01_fog_color"] = [structure[i]['collision']['data']['fog']['r']/255, structure[i]['collision']['data']['fog']['g']/255, structure[i]['collision']['data']['fog']['b']/255, 1.0]
                            obj['02_fog_start'] = structure[i]['collision']['data']['fog']['start']
                            obj['03_fog_end'] = structure[i]['collision']['data']['fog']['end']
                            obj['04_light_flag'] = structure[i]['collision']['data']['lights']['flag']
                            obj['05_light_ambientcolor'] = [structure[i]['collision']['data']['lights']['ambient_r']/255, structure[i]['collision']['data']['lights']['ambient_g']/255, structure[i]['collision']['data']['lights']['ambient_b']/255, 1.0]
                            obj['06_light_color'] = [structure[i]['collision']['data']['lights']['r']/255, structure[i]['collision']['data']['lights']['g']/255, structure[i]['collision']['data']['lights']['b']/255, 1.0]
                            obj['07_unk1'] = structure[i]['collision']['data']['lights']['unk1']
                            obj['08_unk2'] = structure[i]['collision']['data']['lights']['unk2']
                            obj['09_xyz'] = [structure[i]['collision']['data']['lights']['x'], structure[i]['collision']['data']['lights']['y'], structure[i]['collision']['data']['lights']['z']]
                            obj['10_unkxyz'] = [structure[i]['collision']['data']['lights']['unk3'], structure[i]['collision']['data']['lights']['unk4'], structure[i]['collision']['data']['lights']['unk5']]
                            obj['11_flags'] = ", ".join(structure[i]['collision']['data']['flags'])
                            obj['12_unk'] = structure[i]['collision']['data']['unk2']
                            obj['13_unload'] = structure[i]['collision']['data']['unload']
                            obj['14_load'] = structure[i]['collision']['data']['load']
                            rna_ui["01_fog_color"] = {"description":"Fog Color",
                                              "default": [1.0, 1.0, 1.0, 1.0],
                                              "min":0.0,
                                              "max":1.0,
                                              "soft_min":0.0,
                                              "soft_max":1.0,
                                              "is_overridable_library":False,
                                              "subtype": 'COLOR'
                                              }
                            rna_ui["05_light_ambientcolor"] = {"description":"Fog Color",
                                              "default": [1.0, 1.0, 1.0, 1.0],
                                              "min":0.0,
                                              "max":1.0,
                                              "soft_min":0.0,
                                              "soft_max":1.0,
                                              "is_overridable_library":False,
                                              "subtype": 'COLOR'
                                              }
                            rna_ui["06_light_color"] = {"description":"Fog Color",
                                              "default": [1.0, 1.0, 1.0, 1.0],
                                              "min":0.0,
                                              "max":1.0,
                                              "soft_min":0.0,
                                              "soft_max":1.0,
                                              "is_overridable_library":False,
                                              "subtype": 'COLOR'
                                              }
                            for window in bpy.context.window_manager.windows:
                                screen = window.screen

                                for area in screen.areas:
                                    if area.type == 'PROPERTIES':
                                        area.tag_redraw()
                                        break
                        #col = bpy.data.collections.get(parent)
                        #col.objects.link(obj)
                        #parent.objects.link(obj)
                        
                        
                        
                        collection.objects.link(obj)
                        #bpy.context.view_layer.objects.active = obj
                        mesh.from_pydata(verts, edges, faces)
                        
                        #savedState = obj.matrix_world
                        obj.parent = parent
                        if showbyte!= None and (int(parent['grouptag2']) & showbyte == 0):
                            obj.hide_viewport = True
                        #obj.matrix_world = savedState
                        
                        #set material
                        material = bpy.data.materials.new('material_blank')
                        material.use_nodes = True
                        tags = []
                        if structure[i]['collision']['data'] != 0:
                            if structure[i]['collision']['data']['flags'] != 0:
                                if "Slow" in structure[i]['collision']['data']['flags']:
                                    tags.append([1, 0, 0, 1])
                                if "Fast" in structure[i]['collision']['data']['flags']:
                                    tags.append([0, 1, 0, 1])
                                if "Fall" in structure[i]['collision']['data']['flags']:
                                    tags.append([0, 1, 1, 1])
                                if "Slip" in structure[i]['collision']['data']['flags']:
                                    tags.append([1, 1, 0, 1])
                                if "Lava" in structure[i]['collision']['data']['flags']:
                                    tags.append([1, 0.5, 0, 1])
                                if "Swst" in structure[i]['collision']['data']['flags']:
                                    tags.append([0, 0, 1, 1])
                                if "ZOff" in structure[i]['collision']['data']['flags']:
                                    tags.append([0.1, 0, 1, 1])
                                if "ZOn" in structure[i]['collision']['data']['flags']:
                                    tags.append([1, 0, 0.9, 1])
                        
                        if len(tags) == 1:
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value =  tags[0]
                        if len(tags) == 2:
                            checkernode = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode.inputs[3].default_value = 10
                            checkernode.inputs[1].default_value = tags[0]
                            checkernode.inputs[2].default_value = tags[1]
                            material.node_tree.links.new(checkernode.outputs[0], material.node_tree.nodes["Principled BSDF"].inputs[0])
                        if len(tags) == 3:
                            checkernode1 = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode2 = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode1.inputs[3].default_value = 10
                            checkernode2.inputs[3].default_value = 5
                            
                            checkernode1.inputs[1].default_value = tags[0]
                            material.node_tree.links.new(checkernode2.outputs[0], checkernode1.inputs[2])
                            checkernode2.inputs[1].default_value = tags[1]
                            checkernode2.inputs[2].default_value = tags[2]
                            material.node_tree.links.new(checkernode1.outputs[0], material.node_tree.nodes["Principled BSDF"].inputs[0])
                        if len(tags) == 4:
                            checkernode1 = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode2 = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode3 = material.node_tree.nodes.new("ShaderNodeTexChecker")
                            checkernode1.inputs[3].default_value = 10
                            checkernode2.inputs[3].default_value = 5
                            checkernode3.inputs[3].default_value = 5
                            
                            material.node_tree.links.new(checkernode2.outputs[0], checkernode1.inputs[1])
                            material.node_tree.links.new(checkernode3.outputs[0], checkernode1.inputs[2])
                            checkernode2.inputs[1].default_value = tags[0]
                            checkernode2.inputs[2].default_value = tags[1]
                            checkernode3.inputs[1].default_value = tags[2]
                            checkernode3.inputs[2].default_value = tags[3]
                            material.node_tree.links.new(checkernode1.outputs[0], material.node_tree.nodes["Principled BSDF"].inputs[0])
                        
                        material.node_tree.nodes["Principled BSDF"].inputs[19].default_value = 0.25
                        node_3 = material.node_tree.nodes.new("ShaderNodeWireframe")
                        node_4 = material.node_tree.nodes.new("ShaderNodeMixShader")
                        node_5 = material.node_tree.nodes.new("ShaderNodeRGB")

                        material.blend_method = 'BLEND'
                        #material.show_transparent_back = False
                        material.use_backface_culling = True
                        material.node_tree.nodes["Principled BSDF"].inputs[7].default_value = 0 #turn off specular
                        material.node_tree.links.new(material.node_tree.nodes["Principled BSDF"].outputs[0], node_4.inputs[1])
                        material.node_tree.links.new(node_3.outputs[0], node_4.inputs[0])
                        material.node_tree.links.new(node_5.outputs[0], node_4.inputs[2])
                        node_5.outputs[0].default_value = [0, 0, 0, 1]
                        
                        node_3.inputs[0].default_value = 0.025
                        if(structure[i]['collision']['data'] != 0): 
                            if (structure[i]['collision']['data']['load'] != "0" or structure[i]['collision']['data']['unload'] != "0"):
                                node_5.outputs[0].default_value = [1, 1, 1, 1]
                                node_3.inputs[0].default_value = 0.08
                            if structure[i]['collision']['data']['unk'] != 0:
                                node_5.outputs[0].default_value = [1, 0, 0, 1]
                        
                            if(structure[i]['collision']['data']['triggers'] != 0):
                                for trigger in structure[i]['collision']['data']['triggers']:
                                    new_empty = bpy.data.objects.new("trigger_" + str(trigger['flag']), None)
                                    collection.objects.link(new_empty)   
                                    new_empty.empty_display_type = 'CUBE'
                                    new_empty.location = [trigger['x']*scale, trigger['y']*scale, trigger['z']*scale]
                                    new_empty.rotation_euler = [ math.asin(trigger['vz']),0, math.atan2(trigger['vy'], trigger['vx'])]
                                    new_empty.scale = [trigger['width']*scale/2,trigger['width']*scale/2,trigger['height']*scale/2]
                                    def spawnObject(path, target):
                                        tf = open(path)
                                        tdata = json.load(tf)
                                        new_empty['flag'] = trigger['flag']
                                        new_empty['target'] = trigger['target']
                                        new_empty.parent = parent
                                        getStuff (tdata['data'], None, collection, tdata['header'], target)
                                        
                                    if trigger['flag'] == 211: #flames
                                        spawnObject("C:/Users/louri/Documents/GitHub/test/models/Modl/294_Modl_flames.json", new_empty)
                                    elif trigger['flag'] == 108: #flag
                                        spawnObject("C:/Users/louri/Documents/GitHub/test/models/Modl/197_Modl_marker flag.json", new_empty)
                                    elif trigger['flag'] == 208: #balloon
                                        spawnObject("C:/Users/louri/Documents/GitHub/test/models/Part/308_Part_Tatooine Balloon.json", bpy.data.objects[str(trigger['target'])])
                                    elif trigger['flag'] == 314: #methane gas
                                        spawnObject("C:/Users/louri/Documents/GitHub/test/models/Part/309_Part_Bubbles+Fish.json", bpy.data.objects[str(trigger['target'])])
                                    elif trigger['flag'] == 310: #dozer
                                        spawnObject("C:/Users/louri/Documents/GitHub/test/models/Part/312_Part_Mon Gazza Dozer.json", bpy.data.objects[str(trigger['target'])])
                                    else:
                                        new_empty.scale = [trigger['width']*scale/2,trigger['width']*scale/2,trigger['height']*scale/2]
                                        new_empty['flag'] = trigger['flag']
                                        new_empty['target'] = trigger['target']
                                        new_empty.parent = parent
                        material.node_tree.links.new(node_4.outputs[0], material.node_tree.nodes["Material Output"].inputs[0])
                        mesh.materials.append(material)
                if 'visuals' in structure[i]:
                    if (structure[i]['visuals']['vert_buffer'] != 0):
                        verts = []
                        edges = []
                        faces = []
                        #print(parent.parent.location)
                        for ind, v in enumerate(structure[i]['visuals']['vert_buffer']):
                            #if int(parent.parent['grouptag3']) &  1048576 != 0:
                            if 'group_count' in structure[i]['visuals'] and ind < structure[i]['visuals']['group_count'] :
                                verts.append( [v['x'] - parent.parent['x'], v['y'] - parent.parent['y'], v['z'] - parent.parent['z']])
                            else:
                                verts.append( [v['x'], v['y'], v['z']])
                            #else:
                                #verts.append( [v['x'], v['y'], v['z']])
                        for v in structure[i]['visuals']['index_buffer']:
                            faces.append( [v[0], v[1], v[2]])
                        mesh_name = str(i) + "_" + "visual"
                        if showbyte != None and (int(parent['grouptag2']) & showbyte == 0):
                            mesh_name += "_unloaded"
                        mesh = bpy.data.meshes.new(mesh_name)
                        obj = bpy.data.objects.new(mesh_name, mesh)
                        

                        
                        obj.hide_select = True
                        obj.scale = [0.01, 0.01, 0.01]
                        
                        #savedState = obj.matrix_world
                        obj.parent = parent
                        if showbyte != None and (int(parent['grouptag2']) & showbyte == 0):
                            obj.hide_viewport = True
                        #obj.matrix_world = savedState
                        
                        collection.objects.link(obj)
                        bpy.context.view_layer.objects.active = obj
                        mesh.from_pydata(verts, edges, faces)
                        if 'group_parent' in structure[i]['visuals'] and structure[i]['visuals']['group_parent'] != 0:
                            #parent.parent.location = [0,0,0]
                            #add relevant verts to group
                            group = obj.vertex_groups.new(name = 'Group')
                            group_verts = range(structure[i]['visuals']['group_count'])
                            #print("group count ", structure[i]['visuals']['group_count'])
                            group.add(group_verts, 1.0, 'ADD') 
                            bpy.ops.object.modifier_add(type = "HOOK")
                            bpy.context.object.modifiers["Hook"].object = bpy.data.objects[str(structure[i]['visuals']['group_parent'])]
                            bpy.context.object.modifiers["Hook"].vertex_group = "Group"
                        
                        #set texture
                        if (structure[i]['visuals']['material']['texture_data'] != 0):
                            
                            offset = str(structure[i]['visuals']['material']['offset'])
                            testmat = bpy.data.materials.get(offset)
                            if testmat and False: 
                                mesh.materials.append(testmat)
                            else:
                                image = str(structure[i]['visuals']['material']['texture_data']['tex_index'])
                                material = bpy.data.materials.new(offset)
                                material.use_nodes = True
                                #material.blend_method = 'BLEND' #use for transparency
                                material.blend_method = 'CLIP'
                                if structure[i]['visuals']['material']['texture_data']['format'] == 3:
                                    material.blend_method = 'BLEND'
                                if structure[i]['visuals']['material']['format'] != 6:
                                    material.use_backface_culling = True
                                if structure[i]['visuals']['material']['unk_data']['unk1'] == 8:
                                    material.show_transparent_back = False
                                else:
                                    material.show_transparent_back = True
                                 
                                node_1 = material.node_tree.nodes.new("ShaderNodeTexImage")
                                node_2 = material.node_tree.nodes.new("ShaderNodeVertexColor")
                                node_3 = material.node_tree.nodes.new("ShaderNodeMixRGB")
                                node_3.blend_type = 'MULTIPLY'
                                node_3.inputs[0].default_value = 1
                                material.node_tree.links.new(node_1.outputs["Color"], node_3.inputs["Color1"])
                                material.node_tree.links.new(node_2.outputs["Color"], node_3.inputs["Color2"])
                                material.node_tree.links.new(node_3.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Base Color"])
                                material.node_tree.links.new(node_1.outputs["Alpha"], material.node_tree.nodes['Principled BSDF'].inputs["Alpha"])
                                material.node_tree.nodes["Principled BSDF"].inputs[5].default_value = 0
                                material.node_tree.nodes["Principled BSDF"].inputs[7].default_value = 0 #turn off specular
                                
                                if 'anim' in header:
                                    if offset in header['anim']:
                                        anim = header['anim'][offset]
                                        shadernode = material.node_tree.nodes.new("ShaderNodeTexCoord")
                                        mappingnode = material.node_tree.nodes.new("ShaderNodeMapping")
                                        material.node_tree.links.new(shadernode.outputs["UV"], mappingnode.inputs["Vector"])
                                        material.node_tree.links.new(mappingnode.outputs["Vector"], node_1.inputs["Vector"])
                                        if '27' in anim: #x animation
                                            for f in range(anim['27']['num_keyframes']):
                                                mappingnode.inputs[1].default_value = [1-anim['27']['keyframe_poses'][f][0], 0, 0]
                                                mappingnode.inputs[1].keyframe_insert(data_path="default_value", frame = round(anim['27']['keyframe_times'][f] * 60))
                                        if '28' in anim: #y animation
                                            for f in range(anim['28']['num_keyframes']):
                                                mappingnode.inputs[1].default_value = [0, 1-anim['28']['keyframe_poses'][f][0], 0]
                                                mappingnode.inputs[1].keyframe_insert(data_path="default_value", frame = round(anim['28']['keyframe_times'][f] * 60))
                                        
                                        if material.node_tree.animation_data is not None and material.node_tree.animation_data.action is not None:
                                            for fcurves_f in material.node_tree.animation_data.action.fcurves:
                                                #new_modifier = fcurves_f.modifiers.new(type='CYCLES')
                                                for k in fcurves_f.keyframe_points:
                                                    k.interpolation = 'LINEAR'
                                
                                if image in ["1167", "1077", "1461", "1596"]: #probably shouldn't do it this way; TODO find specific tag
                                    material.blend_method = 'BLEND'
                                    material.node_tree.links.new(node_1.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Alpha"])
                                
                                if structure[i]['visuals']['material']['format'] in [31, 15, 7]:
                                    material.node_tree.links.new(node_2.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Normal"])
                                    material.node_tree.links.new(node_1.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Base Color"])
                                
                                if(structure[i]['visuals']['material']['texture_data']['unk_pointer']['unk0'] & 0x11 != 0):
                                    node_4 = material.node_tree.nodes.new("ShaderNodeUVMap")
                                    node_5 = material.node_tree.nodes.new("ShaderNodeSeparateXYZ")
                                    node_6 = material.node_tree.nodes.new("ShaderNodeCombineXYZ")
                                    material.node_tree.links.new(node_4.outputs["UV"], node_5.inputs["Vector"])
                                    material.node_tree.links.new(node_6.outputs["Vector"], node_1.inputs["Vector"])
                                    if 'anim' in header:
                                        if offset in header['anim']:
                                            material.node_tree.links.new(mappingnode.outputs["Vector"], node_5.inputs["Vector"])
                                    if(structure[i]['visuals']['material']['texture_data']['unk_pointer']['unk0'] & 0x11 == 0x11):
                                        node_7 = material.node_tree.nodes.new("ShaderNodeMath")
                                        node_7.operation = 'PINGPONG'
                                        node_7.inputs[1].default_value = 1
                                        material.node_tree.links.new(node_5.outputs["X"], node_7.inputs["Value"])
                                        material.node_tree.links.new(node_7.outputs["Value"], node_6.inputs["X"])
                                        node_8 = material.node_tree.nodes.new("ShaderNodeMath")
                                        node_8.operation = 'PINGPONG'
                                        node_8.inputs[1].default_value = 1
                                        material.node_tree.links.new(node_5.outputs["Y"], node_8.inputs["Value"])
                                        material.node_tree.links.new(node_8.outputs["Value"], node_6.inputs["Y"])
                                    elif(structure[i]['visuals']['material']['texture_data']['unk_pointer']['unk0'] & 0x11 == 0x01):
                                        material.node_tree.links.new(node_5.outputs["X"], node_6.inputs["X"])
                                        node_7 = material.node_tree.nodes.new("ShaderNodeMath")
                                        node_7.operation = 'PINGPONG'
                                        node_7.inputs[1].default_value = 1
                                        material.node_tree.links.new(node_5.outputs["Y"], node_7.inputs["Value"])
                                        material.node_tree.links.new(node_7.outputs["Value"], node_6.inputs["Y"])
                                    elif(structure[i]['visuals']['material']['texture_data']['unk_pointer']['unk0'] & 0x11 == 0x10):
                                       
                                        node_7 = material.node_tree.nodes.new("ShaderNodeMath")
                                        node_7.operation = 'PINGPONG'
                                        node_7.inputs[1].default_value = 1
                                        material.node_tree.links.new(node_5.outputs["X"], node_7.inputs["Value"])
                                        material.node_tree.links.new(node_7.outputs["Value"], node_6.inputs["X"])
                                        material.node_tree.links.new(node_5.outputs["Y"], node_6.inputs["Y"])
                                mesh.materials.append(material)
                                image_path = "C:/Users/louri/Documents/Github/test/textures/" + image + ".png"
                                if exists(image_path):
                                    bpy.data.images.load("C:/Users/louri/Documents/Github/test/textures/" + image + ".png", check_existing=True)
                                    #mat = bpy.context.view_layer.objects.active.active_material
                                    tex = bpy.data.images.get(image + '.png')
                                    image_node = material.node_tree.nodes["Image Texture"]
                                    image_node.image = tex
                                    
                                    if 'anim' in header:
                                        if offset in header['anim']:
                                            anim = header['anim'][offset]
                                            if '2' in anim or '18' in anim:
                                                if '2' in anim:
                                                    child = '2'
                                                if '18' in anim:
                                                    child = '18'
                                                bpy.data.images.load("C:/Users/louri/Documents/Github/test/textures/0.png", check_existing=True)
                                                image_node.image = bpy.data.images.get('0.png')
                                                bpy.data.images["0.png"].source = 'SEQUENCE'
                                                node_1.image_user.use_auto_refresh = True
                                                node_1.image_user.frame_duration = 1
                                                for f in range(anim[child]['num_keyframes']):
                                                    node_1.image_user.frame_offset = anim[child]['keyframe_poses'][f] - 1
                                                    node_1.image_user.keyframe_insert(data_path="frame_offset", frame = round(anim[child]['keyframe_times'][f] * 60))
                                                if material.node_tree.animation_data is not None and material.node_tree.animation_data.action is not None:
                                                    for fcurves_f in material.node_tree.animation_data.action.fcurves:
                                                        #new_modifier = fcurves_f.modifiers.new(type='CYCLES')
                                                        for k in fcurves_f.keyframe_points:
                                                            k.interpolation = 'CONSTANT'
                        else:
                            material = bpy.data.materials.new('material_blank')
                            material.use_nodes = True
                            material.node_tree.nodes["Principled BSDF"].inputs[5].default_value = 0
                            colors = structure[i]['visuals']['material']['unk_data']
                            #print(colors)
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [colors["r"]/255, colors["g"]/255, colors["b"]/255, colors["t"]/255]
                            node_1 = material.node_tree.nodes.new("ShaderNodeVertexColor")
                            material.node_tree.links.new(node_1.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Normal"])
                            
                            mesh.materials.append(material)
                        
                        #set vector colors / uv coords
                        uv_layer = mesh.uv_layers.new(name = 'uv')
                        color_layer = mesh.vertex_colors.new(name = 'colors') #color layer has to come after uv_layer
                        #mesh.uv_textures.new("uv")
                        for poly in mesh.polygons:
                            for p in range(len(poly.vertices)):
                                v = structure[i]['visuals']['vert_buffer'][poly.vertices[p]]
                                c = v['v_color']
                                color = [c[0]/255, c[1]/255, c[2]/255, c[3]/255]
                                uv_layer.data[poly.loop_indices[p]].uv = [v['uv_x']/4096, v['uv_y']/4096]
                                color_layer.data[poly.loop_indices[p]].color = color
                            
    #                        for loop_index in range(poly.loop_start, poly.loop_start + poly.loop_total):
    #                            print("Vertex: %d" % me.loops[loop_index].vertex_index)
    #                            print("UV: %r" % uv_layer[loop_index].uv)

                    
    getStuff (data['data'], None, main_parent, data['header'], None)

    f.close()

scol = bpy.data.collections.new("splines")

def makeSpline(offset, name):
    path = "C:/Users/louri/Documents/GitHub/test/splines/"
    fp = path + offset + ".csv"
    
    scale = 0.01
    curveData = bpy.data.curves.new("name", type='CURVE')
    curveData.dimensions = '3D'
    curveData.resolution_u = 10

    with open( fp ) as csvfile:
        list_data = list(csv.reader( csvfile ))
        for row in list_data:
            polyline = curveData.splines.new('BEZIER')
            
            #previous point
            previous = int(row[5])
            offset = -1
            index = 0
            if previous < len(list_data) and previous >= 0:
                polyline.bezier_points.add(1)
                polyline.bezier_points[index].handle_left_type = 'FREE'
                polyline.bezier_points[index].handle_right_type = 'FREE'
                polyline.bezier_points[index].co = (float(list_data[previous][9])*scale, float(list_data[previous][10])*scale, float(list_data[previous][11])*scale)
                polyline.bezier_points[index].handle_left = (float(list_data[previous][15])*scale, float(list_data[previous][16])*scale, float(list_data[previous][17])*scale)
                polyline.bezier_points[index].handle_right = (float(list_data[previous][18])*scale, float(list_data[previous][19])*scale, float(list_data[previous][20])*scale)
                index += 1
            #current point
            polyline.bezier_points[index].handle_left_type = 'FREE'
            polyline.bezier_points[index].handle_right_type = 'FREE'
            polyline.bezier_points[index].co = (float(row[9])*scale, float(row[10])*scale, float(row[11])*scale)
            polyline.bezier_points[index].handle_left = (float(row[15])*scale, float(row[16])*scale, float(row[17])*scale)
            polyline.bezier_points[index].handle_right = (float(row[18])*scale, float(row[19])*scale, float(row[20])*scale)
            if int(row[21]) == 0 and name == "trackspline":
                #print("found starting point")
                new_empty = bpy.data.objects.new("start", None)
                new_empty.location = (float(row[9])*scale, float(row[10])*scale, float(row[11])*scale + 0.25)
                new_empty.rotation_euler = [ 0,0, math.atan2(float(row[16]) - float(row[10]), float(row[15]) - float(row[9])) - math.pi/2]
                scol.objects.link(new_empty)
                tf = open("C:/Users/louri/Documents/GitHub/test/models/Part/310_Part_Starting Line Object.json")
                tdata = json.load(tf)
                getStuff (tdata['data'], None, scol, tdata['header'], new_empty)
            index += 1
            #next point
            next = int(row[3])
            if next < len(list_data) and next >= 0:
                polyline.bezier_points.add(1)
                polyline.bezier_points[index].handle_left_type = 'FREE'
                polyline.bezier_points[index].handle_right_type = 'FREE'
                polyline.bezier_points[index].co = (float(list_data[next][9])*scale, float(list_data[next][10])*scale, float(list_data[next][11])*scale)
                polyline.bezier_points[index].handle_left = (float(list_data[next][15])*scale, float(list_data[next][16])*scale, float(list_data[next][17])*scale)
                polyline.bezier_points[index].handle_right = (float(list_data[next][18])*scale, float(list_data[next][19])*scale, float(list_data[next][20])*scale)
                
        curveOB = bpy.data.objects.new(name, curveData)
        curveOB.data.bevel_depth = 0.06
        curveOB.data.bevel_resolution = 10
        curveOB.data.resolution_u = 50
        material = bpy.data.materials.new('material_blank')
        material.use_nodes = True
        if name == "trackspline":
            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [0, 1, 0, 1]
        elif name == "cameraspline":
            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [0, 0, 1, 1]
        curveOB.data.materials.append(material)
        return curveOB

if showbyte != None: 
    bpy.context.scene.collection.children.link(bpy.data.collections["splines"])
    tspline = makeSpline(trackdata[str(data['model'])]['spline'], "trackspline")
    scol.objects.link(tspline)
    bpy.context.view_layer.objects.active = tspline
    tspline.select_set(state = True)
    #bpy.ops.curvetools.operatorsplinesjoinneighbouring()
    #cone = bpy.ops.mesh.primitive_cone_add(location = [0, 0, 0.20], scale = [0.2, 0.2, -0.2])
    #bpy.context.active_object.name = "progressmarker"
    #bpy.context.active_object.constraints.new(type='FOLLOW_PATH')
    #bpy.context.active_object.constraints[0].target = bpy.data.objects["trackspline"]
    #bpy.context.active_object.constraints[0].use_fixed_location = True
    #scol.objects.link(bpy.context.active_object)

    cspline = makeSpline(trackdata[str(data['model'])]['cam'], "cameraspline")
    cspline.hide_select = True
    scol.objects.link(cspline)
    #tspline.hide_select = True
    
bpy.context.scene.tool_settings.use_transform_skip_children = True
#for obj in bpy.context.scene.objects:
#    print(obj.name)
#    if obj.type == 'EMPTY' and obj.empty_display_type != 'IMAGE':
#        if int(obj['grouptag0']) == 53349 and int(obj['grouptag3']) & 1048576 != 0:
#            obj.select_set(True)
#            bpy.ops.transform.translate(value=((obj['x1'])*scale, (obj['y1'])*scale, (obj['z1'])*scale))
#            obj.select_set(False)

bpy.context.scene.tool_settings.use_transform_skip_children = False 
