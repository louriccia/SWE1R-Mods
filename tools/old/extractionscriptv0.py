import bpy
import json
import glob
from os.path import exists
import math
import numpy
import mathutils
path = "C:/Users/louri/Documents/GitHub/test/models/Trak/115_Trak_0-Boonta Training Course.json"
#all_files = glob.glob(path + "*.json")
from rna_prop_ui import rna_idprop_ui_prop_get


#set up world properties
bpy.context.scene.world["collision opacity"] = 0.25
bpy.context.scene.world["collision wireframe"] = 0.50

#for fp in all_files:
    #print(fp)
    
scale = 0.01
    
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

if 'data' in data['header']:
    for l in data['header']['data']['lightstreaks']:
        light = bpy.data.lights.new(name = "lightstreak",type = 'POINT')
        light_object = bpy.data.objects.new(name = "lightstreak", object_data = light)
        new_col.objects.link(light_object)
        light_object.location = (l[0]*scale, l[1]*scale, l[2]*scale)
def getStuff (structure, parent):
    for i in structure:
        if 'children' in structure[i]:
            new_parent = str(i)# + ": " + str(structure[i]['head'][0])
            
            #if data['extension'] == "Trak":
                #if (str(i) in [str(data['header']['head'][0]), str(data['header']['head'][1]), str(data['header']['head'][2]), str(data['header']['head'][3]), str(data['header']['head'][4]), str(data['header']['head'][5])]):
                    #new_parent = "**" + new_parent + "**"
            
            if (structure[i]['head'][0] in [53349, 53350]):
                new_empty = bpy.data.objects.new(new_parent, None)
                main_parent.objects.link(new_empty)
                
                #new_empty.empty_display_size = 2
                new_empty.empty_display_type = 'ARROWS'

                if structure[i]['head'][0] ==53349:
                    #new_empty.location = [structure[i]['xyz']['x']*scale, structure[i]['xyz']['y']*scale, structure[i]['xyz']['z']*scale]
                    new_empty.matrix_world = [
                    [structure[i]['xyz']['ax'], structure[i]['xyz']['ay'], structure[i]['xyz']['az'], 0],
                    [structure[i]['xyz']['bx'], structure[i]['xyz']['by'], structure[i]['xyz']['bz'], 0],
                    [structure[i]['xyz']['cx'], structure[i]['xyz']['cy'], structure[i]['xyz']['cz'], 0],
                    [structure[i]['xyz']['x']*scale, structure[i]['xyz']['y']*scale, structure[i]['xyz']['z']*scale, 1],
                    ]
                    
            else:
                new_empty = bpy.data.objects.new(new_parent, None)
                new_empty.empty_display_type = 'PLAIN_AXES'
                main_parent.objects.link(new_empty)
            
            #set group tags
            new_empty['grouptag0'] = str(structure[i]['head'][0])
            new_empty['grouptag1'] = str(structure[i]['head'][1])
            new_empty['grouptag2'] = str(structure[i]['head'][2])
            
            #assign parent
            if parent != None:
                #savedState = new_empty.matrix_world
                new_empty.parent = parent
                #new_empty.matrix_world = savedState
            
            if new_parent in data['header']['anim']:
                anim = data['header']['anim'][new_parent]
                
                if '57' in anim:
                    #fcurve = new_empty.animation_data.action.fcurves.new(data_path = "location")
                    for f in range(anim['57']['num_keyframes']):
                        new_empty.location = [anim['57']['keyframe_poses'][f][0]*scale, anim['57']['keyframe_poses'][f][1]*scale, anim['57']['keyframe_poses'][f][2]*scale]
                        kf = new_empty.keyframe_insert(data_path="location", frame = round(anim['57']['keyframe_times'][f] * 60))
                    #fcurve.modifiers.new(type = 'CYCLES')
                if '56' in anim:
                    print('anim ',anim['56']['offset'])
                    new_empty.rotation_mode = 'QUATERNION'
                    previous_q = None
                    #fcurve = new_empty.animation_data.action.fcurves.new(data_path = "rotation_quaternion")
                    for f in range(anim['56']['num_keyframes']):
                        axis_angle = [anim['56']['keyframe_poses'][f][3]*math.pi/180, anim['56']['keyframe_poses'][f][0], anim['56']['keyframe_poses'][f][1], anim['56']['keyframe_poses'][f][2]]
                        angle, *axis = axis_angle
                        R = mathutils.Matrix.Rotation(angle, 4, axis)
                        R = R.to_quaternion()
                        if previous_q != None:
                            print(previous_q[3],R[3])
                            R.make_compatible(previous_q)
                        
                        print(axis_angle, R)
                        new_empty.rotation_quaternion = R
                        kf = new_empty.keyframe_insert(data_path="rotation_quaternion", frame = round(anim['56']['keyframe_times'][f] * 60))
                        previous_q = R
                    #fcurve.modifiers.new(type = 'CYCLES')
                if new_empty.animation_data is not None and new_empty.animation_data.action is not None:
                    for fcurves_f in new_empty.animation_data.action.fcurves:
                        new_modifier = fcurves_f.modifiers.new(type='CYCLES')
                        for k in fcurves_f.keyframe_points:
                            k.interpolation = 'LINEAR'
                    
            getStuff (structure[i]['children'], new_empty)
        else:
            if 'collision' in structure[i]:
                if (structure[i]['collision']['vert_buffer'] != 0):
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
                    
                    
                    
                    main_parent.objects.link(obj)
                    bpy.context.view_layer.objects.active = obj
                    mesh.from_pydata(verts, edges, faces)
                    
                    #savedState = obj.matrix_world
                    obj.parent = parent
                    #obj.matrix_world = savedState
                    
                    #set material
                    material = bpy.data.materials.new('material_blank')
                    material.use_nodes = True
                    if(structure[i]['collision']['data'] != 0):
                        if "Slow" in structure[i]['collision']['data']['flags']:
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [1, 0, 0, 1] #set color
                        elif "Fast" in structure[i]['collision']['data']['flags']:
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [0, 1, 0, 1] #set color
                        elif "Slip" in structure[i]['collision']['data']['flags']:
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [0, 1, 1, 1] #set color
                        elif ("ZOn" in structure[i]['collision']['data']['flags'] or "ZOff" in structure[i]['collision']['data']['flags']):
                            material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [1, 0, 1, 1] #set color
                    material.node_tree.nodes["Principled BSDF"].inputs[19].default_value = 0.25
                    d = material.node_tree.nodes["Principled BSDF"].inputs[19].driver_add("default_value").driver
                    v = d.variables.new()
                    d.type = 'SUM'
                    v.targets[0].id_type = 'WORLD'
                    v.targets[0].id = bpy.data.worlds["World"]
                    v.targets[0].data_path = "[\"collision opacity\"]"
                    node_1 = material.node_tree.nodes.new("ShaderNodeMixShader")
                    node_2 = material.node_tree.nodes.new("ShaderNodeBsdfTransparent")
                    node_3 = material.node_tree.nodes.new("ShaderNodeWireframe")
                    node_4 = material.node_tree.nodes.new("ShaderNodeMixShader")
                    node_5 = material.node_tree.nodes.new("ShaderNodeRGB")
                    node_1.inputs[0].default_value =  0.5
                    #node_1.inputs[0].default_value = 0.5
                    
#                    d1 = node_1.inputs[0].driver_add("default_value").driver
#                    v1 = d1.variables.new()
#                    d1.type = 'SUM'
#                    v1.targets[0].id_type = 'WORLD'
#                    v1.targets[0].id = bpy.data.worlds["World"]
#                    v1.targets[0].data_path = "[\"collision wireframe\"]"
#                    d2 = node_4.inputs[0].driver_add("default_value").driver
#                    v2 = d2.variables.new()
#                    d2.type = 'SUM'
#                    v2.targets[0].id_type = 'WORLD'
#                    v2.targets[0].id = bpy.data.worlds["World"]
#                    v2.targets[0].data_path = "[\"collision wireframe\"]"
                    material.blend_method = 'BLEND'
                    #material.use_backface_culling = True
                    material.node_tree.nodes["Principled BSDF"].inputs[5].default_value = 0 #turn off specular
                    material.node_tree.links.new(material.node_tree.nodes["Principled BSDF"].outputs[0], node_1.inputs[2])
                    material.node_tree.links.new(material.node_tree.nodes["Transparent BSDF"].outputs[0], node_1.inputs[1])
                    material.node_tree.links.new(node_1.outputs[0], node_4.inputs[1])
                    material.node_tree.links.new(node_3.outputs[0], node_4.inputs[0])
                    material.node_tree.links.new(node_5.outputs[0], node_4.inputs[2])
                    node_5.outputs[0].default_value = [0, 0, 0, 1]
                    node_3.inputs[0].default_value = 0.025
                    if(structure[i]['collision']['data'] != 0): 
                        if (structure[i]['collision']['data']['load'] != "0" or structure[i]['collision']['data']['unload'] != "0"):
                            node_5.outputs[0].default_value = [1, 1, 1, 1]
                            node_3.inputs[0].default_value = 0.08
                    
                    
                        if(structure[i]['collision']['data']['triggers'] != 0):
                            for trigger in structure[i]['collision']['data']['triggers']:
                                new_empty = bpy.data.objects.new("trigger_" + str(trigger['flag']), None)
                                main_parent.objects.link(new_empty)
                                
                                new_empty.empty_display_type = 'CUBE'

                                new_empty.location = [trigger['x']*scale, trigger['y']*scale, trigger['z']*scale]
                                new_empty.rotation_euler = [ 
                                math.asin(trigger['vz']),
                                0, 
                                math.atan2(trigger['vy'], trigger['vx'])
                                ]
                                new_empty.scale = [
                                trigger['width']*scale/2,
                                trigger['width']*scale/2,
                                trigger['height']*scale/2
                                ]
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
                    for v in structure[i]['visuals']['vert_buffer']:
                        verts.append( [v['x'], v['y'], v['z']])
                    for v in structure[i]['visuals']['index_buffer']:
                        faces.append( [v[0], v[1], v[2]])
                    mesh_name = str(i) + "_" + "visual"
                    mesh = bpy.data.meshes.new(mesh_name)
                    obj = bpy.data.objects.new(mesh_name, mesh)
                    obj.hide_select = True
                    obj.scale = [0.01, 0.01, 0.01]
                    
                    #savedState = obj.matrix_world
                    obj.parent = parent
                    #obj.matrix_world = savedState
                    
                    main_parent.objects.link(obj)
                    bpy.context.view_layer.objects.active = obj
                    mesh.from_pydata(verts, edges, faces)
                    
                    #set texture
                    if (structure[i]['visuals']['material']['texture_data'] != 0):
                        
                        offset = str(structure[i]['visuals']['material']['offset'])
                        testmat = bpy.data.materials.get(offset)
                        print(offset)
                        if testmat: 
                            mesh.materials.append(testmat)
                            print("found ", testmat)
                        else:
                            print("new mat: ", offset)
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
                            
                            if image in ["1167", "1077"]: #probably shouldn't do it this way; TODO find specific tag
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
                                mat = bpy.context.view_layer.objects.active.active_material
                                tex = bpy.data.images.get(image + '.png')
                                image_node = material.node_tree.nodes["Image Texture"]
                                image_node.image = tex
                    else:
                        material = bpy.data.materials.new('material_blank')
                        material.use_nodes = True
                        node_1 = material.node_tree.nodes.new("ShaderNodeVertexColor")
                        material.node_tree.links.new(node_1.outputs["Color"], material.node_tree.nodes['Principled BSDF'].inputs["Base Color"])
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

                
getStuff (data['data'], None)

f.close()
