import sys
import os
import bpy
import struct
    
scale = 100
    
def unmake_LStr(objects, model):
    model['Data'] = {'LStr': [], 'other': []}
    for obj in objects:
        if obj.type != 'LIGHT': continue
        model['Data']['LStr'].append([l*scale for l in obj.location])
    
def find_topmost_parent(obj):
    while obj.parent is not None:
        obj = obj.parent
    return obj
    
def unmake_mesh_group(mesh):
    
    return
    
def unmake_node(obj):
    node = {
        'id': obj.name,
        'head': [obj['head0'], obj['head1'], obj['head2'], obj['head3'], 0],
        'children': []
    }
    
    if not obj.children:
        return node
    
    mesh_group = (obj.children[0].type == 'MESH')
    
    for child in obj.children:
        if mesh_group: 
            node['children'].append(unmake_mesh_group(child))
        else: 
            node['children'].append(unmake_node(child))
            
    return node
    
def unmake_model(collection):
    
    #this should be handled by plugin in the future
    id, ext = collection.name.split("_")
    
    model = {
        'ext': ext,
        'id': id,
        'nodes': []
    }
    if 'parent' in col: return
    for child in col.children:
        if 'lightstreaks' in child.name:
            unmake_LStr(child.objects, {})
    
    top_nodes = [] 
    for obj in col.objects:
        if obj.type != 'MESH': continue
        top = find_topmost_parent(obj)
        if top not in top_nodes: top_nodes.append(top)
    
    for node in top_nodes:
        model['nodes'].append(unmake_node(node))
        
    print(model)


for col in bpy.data.collections:
    unmake_model(col)