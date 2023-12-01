import bpy
import csv
import glob
import os
path = "C:/Users/louri/Documents/GitHub/test/splines/"
all_files = glob.glob(path + "*.csv")

col = bpy.data.collections.new("splines")
bpy.context.scene.collection.children.link(bpy.data.collections["splines"])
scale = 0.01
for fp in all_files:
    print(fp)
    # create the Curve Datablock
    curveData = bpy.data.curves.new(os.path.basename(fp), type='CURVE')
    curveData.dimensions = '3D'
    curveData.resolution_u = 10

    # map coords to spline
    

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
                
        curveOB = bpy.data.objects.new(os.path.basename(fp), curveData)
        curveOB.data.bevel_depth = 0.1
        curveOB.data.bevel_resolution = 10
        curveOB.data.resolution_u = 50
        material = bpy.data.materials.new('material_blank')
        material.use_nodes = True
        material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = [0, 1, 0, 1]
        curveOB.data.materials.append(material)
        col.objects.link(curveOB)