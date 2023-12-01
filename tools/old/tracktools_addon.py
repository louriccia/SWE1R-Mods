import bpy


def main(context):
    for ob in context.scene.objects:
        print(ob)


class LoadTrigger(bpy.types.Operator):
    """Tooltip"""
    bl_idname = "object.load_trigger"
    bl_label = "Run Load Trigger"

    def execute(self, context):
        #main(context)
        if('13_unload' in bpy.context.active_object):
            for obj in bpy.context.scene.objects:
                if obj.name != 'progressmarker' and obj.type == 'MESH' and obj != bpy.context.active_object and 'unloaded' not in obj.name:
                    if (int(obj.parent['grouptag0']) == 12388):
                        print(bpy.context.active_object['14_load'])
                        if (int(obj.parent['grouptag1']) & int(bpy.context.active_object['13_unload'], 2) != 0) and int(obj.parent['grouptag1']) & 64 != 0:
                            obj.hide_viewport = True
                        if (int(obj.parent['grouptag1']) & int(bpy.context.active_object['14_load'], 2) != 0) and int(obj.parent['grouptag1']) & 64 != 0:
                            obj.hide_viewport = False
        else:
            print('no collision data')
        #print(int("11", 2) & int("11", 2))
        #print(bpy.context.active_object.)
        return {'FINISHED'}

def ColVis(self, context):
    for obj in bpy.context.scene.objects:
        if 'collision' in obj.name and 'unloaded' not in obj.name:
            obj.hide_viewport = not self.colvis
        
def ColBak(self, context):
    for mat in bpy.data.materials:
            if mat.use_nodes and 'Wireframe' in mat.node_tree.nodes:
                mat.use_backface_culling = self.colbak
            
def SelVis(self, context):
    for obj in bpy.context.scene.objects:
        if 'visual' in obj.name:
            obj.hide_select = not self.selvis
                
def ShoVis(self, context):
    for obj in bpy.context.scene.objects:
            if 'visual' in obj.name and 'unloaded' not in obj.name:
                obj.hide_viewport = not self.shovis
                
def SplineVis(self, context):
    for obj in bpy.context.scene.objects:
            if obj.type == "CURVE":
                obj.hide_viewport = not self.splinevis
                
def EmptyVis(self, context):
    for obj in bpy.context.scene.objects:
            if obj.type == "EMPTY" or obj.type == "LIGHT":
                obj.hide_viewport = not self.emptyvis
                
def VColor(self, context):
    for mat in bpy.data.materials:
            if mat.use_nodes:
                if 'Mix' in mat.node_tree.nodes:
                    if self.vcolor == True:
                        mat.node_tree.nodes['Mix'].inputs[0].default_value = 1.0
                    else:
                        mat.node_tree.nodes['Mix'].inputs[0].default_value = 0.0
                        
def CTrans(self, context):
    for mat in bpy.data.materials:
            if mat.use_nodes and 'Wireframe' in mat.node_tree.nodes:
                mat.node_tree.nodes["Principled BSDF"].inputs[19].default_value = self.ctrans
    
class Props(bpy.types.PropertyGroup):

    colvis: bpy.props.BoolProperty(
        name='Show Collision',
        description="Hide or unhide collidable mesh",
        default=True,
        update = ColVis
    )
    colbak: bpy.props.BoolProperty(
        name='Backface Culling',
        description="Hide or unhide collision backsides",
        default=True,
        update = ColBak
    )
    selvis: bpy.props.BoolProperty(
        name='Selectable',
        description="Make visible mesh selectable or unselectable",
        default=False,
        update = SelVis
    )
    shovis: bpy.props.BoolProperty(
        name='Show Visuals',
        description="Hide or unhide visible mesh",
        default=True,
        update = ShoVis
    )
    splinevis: bpy.props.BoolProperty(
        name='Show Splines',
        description="Hide or unhide splines",
        default=True,
        update = SplineVis
    )
    emptyvis: bpy.props.BoolProperty(
        name='Show Empties/Triggers/Lights',
        description="Hide or unhide empties",
        default=True,
        update = EmptyVis
    )
    vcolor: bpy.props.BoolProperty(
        name='Show Vertex Colors',
        description="Hide or unhide vertex colors",
        default=True,
        update = VColor
    )
    ctrans: bpy.props.FloatProperty(
        name='Transparency',
        description="Adjust collision transparency",
        default=0.2,
        update = CTrans,
        soft_min = 0.0,
        soft_max = 1.0
    )

class LoadAll(bpy.types.Operator):
    """Tooltip"""
    bl_idname = "object.load_all"
    bl_label = "Load All"

    def execute(self, context):
        main(context)
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH' and 'unloaded' not in obj.name:
                obj.hide_viewport = False
        return {'FINISHED'}

class LayoutDemoPanel(bpy.types.Panel):
    """Creates a Panel in the scene context of the properties editor"""
    bl_idname = "SCENE_PT_test"
    bl_label = "Buttons"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Tools'
    bl_context = "objectmode"

    def draw(self, context):
        layout = self.layout

        scene = context.scene

        my_test = context.scene.my_test
        
        layout.label(text="Collidable Mesh Options")
        row = layout.row()
        row.scale_y = 1.5
        row.operator("object.load_trigger", icon = 'MOD_BUILD')
        row = layout.row()
        row.scale_y = 1.5
        row.operator("object.load_all", icon = "PROPERTIES")
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "colbak", toggle=True, icon = 'SELECT_DIFFERENCE')
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "ctrans", icon = 'FACESEL')
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "colvis", toggle=True, icon = 'HIDE_OFF')

        layout.label(text="Visible Mesh Options")
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "selvis", toggle = False, icon = 'RESTRICT_SELECT_OFF')
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "vcolor", toggle = False, icon = 'VPAINT_HLT')  
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "shovis", toggle = False, icon = 'HIDE_OFF')
        
        layout.label(text="Other Options")
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "splinevis", toggle = False, icon = 'HIDE_OFF')
        row = layout.row()
        row.scale_y = 1.5
        row.prop(my_test, "emptyvis", toggle = False, icon = 'HIDE_OFF')

        #show names

classes = (
    LoadTrigger,
    LoadAll,
    LayoutDemoPanel,
    Props
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.my_test = bpy.props.PointerProperty(type=Props)


def unregister():
    del bpy.types.Scene.my_test
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()




        

