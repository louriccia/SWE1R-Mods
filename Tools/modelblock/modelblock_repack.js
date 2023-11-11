const fs = require('fs');
let splineblock = {}

if (fs.existsSync('../splineblock/out_splineblock.json')) {
    splineblock = require('../splineblock/out_splineblock.json') //we'll need splineblock if we want to update splines for any track mods
}
//gather model jsons from folder (output by modelblock_unpack.js)
let replacements = []
for (r = 0; r < 323; r++) {
    if (fs.existsSync('rep/' + r + '.json')) {
        console.log("found " + r + " replacement")
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile('rep/' + r + '.json', async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });

    } else if (fs.existsSync('models/' + r + '.json')) {
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile('models/' + r + '.json', async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });
    }
}

let headers = {}
function headerGatherer(extension, index, header) {
    if (!headers[extension]) {
        headers[extension] = {}
    }
    headers[extension][index] = header
}

//some basic parameters for modifying track mesh/collision
const slope = 0
const xStretch = 1
const yStretch = 1
const zStretch = 1
const xOffset = 0
const yOffset = 0
const zOffset = 0
const xSplineOffset = 0
const ySplineOffset = 0
const zSplineOffset = 0
Promise.all(replacements).then(replacements => {

    let models = []
    let highlights = []

    function writeModel(index) {
        console.log(`---- MODEL ${index} ----`)
        //writes an entire model to the buffer


        let cursor = 0
        let buf = Buffer.alloc(1000000)
        let hl = Buffer.alloc(400000)

        function highlight(cursor) {
            //this function is called whenever an address need to be 'highlighted' because it is a pointer
            //every model begins with a pointer map where each bit represents 4 bytes in the following model 
            //if the bit is 1, that corresponding DWORD is to be read as a pointer
            let highlightoffset = Math.floor(cursor / 32)
            let bit = 2 ** (7 - Math.floor((cursor % 32) / 4))
            let highlight = hl.readUInt8(highlightoffset)
            hl.writeUInt8((highlight | bit), highlightoffset)
        }

        let rep = replacements[index]
        let animkeeper = []
        let altnkeeper = []
        let headkeeper = []
        let childkeeper = []
        let triggerkeeper = []
        let animlist = null
        let header = []
        let skyboxid = rep.header.head[2]
        function writeNode(node, start, id, parent, skybox) {
            if (Number(id) == Number(skyboxid)) {
                skybox = true
            }
            //replace references in anim targets
            if (rep.header.anim) {
                for (let i = 0; i < rep.header.anim.length; i++) {
                    if (id == rep.header.anim[i].target) {
                        rep.header.anim[i].target = start
                    }
                }
            }

            //replace references in altn
            for (let i = 0; i < altnkeeper.length; i++) {
                if (id == altnkeeper[i].original && !altnkeeper[i].replaced) {
                    buf.writeInt32BE(start, altnkeeper[i].address)
                    altnkeeper[i].replaced = true
                } else if (id + 18 * 4 == altnkeeper[i].original && !altnkeeper[i].replaced) {
                    buf.writeInt32BE(start + 18 * 4, altnkeeper[i].address)
                    altnkeeper[i].replaced = true
                } else if (id + 19 * 4 == altnkeeper[i].original && !altnkeeper[i].replaced) {
                    buf.writeInt32BE(start + 19 * 4, altnkeeper[i].address)
                    altnkeeper[i].replaced = true
                }
            }

            //replace references in model head
            for (let i = 0; i < headkeeper.length; i++) {
                if (id == headkeeper[i].original && !headkeeper[i].replaced) {
                    buf.writeInt32BE(start, headkeeper[i].address)
                    headkeeper[i].replaced = true
                }
            }

            //replace references in child list
            for (let i = 0; i < childkeeper.length; i++) {
                if (id == childkeeper[i].original && !childkeeper[i].replaced) {
                    buf.writeInt32BE(start, childkeeper[i].address)
                    childkeeper[i].replaced = start
                }
            }

            cursor = start
            if (node.head) {
                //write node head
                for (let i = 0; i < node.head.length; i++) {
                    cursor = buf.writeInt32BE(node.head[i], cursor)
                }
                if (!node.bb) {
                    node.bb = {}
                }
                let numberofchildren = node.childlist.length
                let childlist = null
                if (numberofchildren) {
                    //write number of children
                    cursor = buf.writeInt32BE(numberofchildren, cursor)
                    //keep pointer to list of children
                    childlist = cursor
                    highlight(cursor)
                    cursor += 4
                } else {
                    cursor += 4
                    highlight(cursor)
                    cursor += 4
                }

                if (node['53350']) {
                    cursor = buf.writeInt32BE(node['53350'].unk1, cursor)
                    cursor = buf.writeInt32BE(node['53350'].unk2, cursor)
                    cursor = buf.writeInt32BE(node['53350'].unk3, cursor)
                    cursor = buf.writeFloatBE(node['53350'].unk4, cursor)
                }

                if (node.min_x !== undefined) {
                    node.bb.address = cursor
                    cursor = buf.writeFloatBE(node.min_x, cursor)
                    cursor = buf.writeFloatBE(node.min_y, cursor)
                    cursor = buf.writeFloatBE(node.min_z, cursor)
                    cursor = buf.writeFloatBE(node.max_x, cursor)
                    cursor = buf.writeFloatBE(node.max_y, cursor)
                    cursor = buf.writeFloatBE(node.max_z, cursor)
                    cursor += 8
                }

                if (node.xyz !== undefined) {
                    if (node.xyz.f1 !== undefined) {
                        cursor = buf.writeFloatBE(node.xyz.f1, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f2, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f3, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f4, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f5, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f6, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f7, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f8, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f9, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f10, cursor)
                        cursor = buf.writeFloatBE(node.xyz.f11, cursor)
                    } else if (node.xyz.ax !== undefined) {
                        cursor = buf.writeFloatBE(node.xyz.ax, cursor)
                        cursor = buf.writeFloatBE(node.xyz.ay, cursor)
                        cursor = buf.writeFloatBE(node.xyz.az, cursor)
                        cursor = buf.writeFloatBE(node.xyz.bx, cursor)
                        cursor = buf.writeFloatBE(node.xyz.by, cursor)
                        cursor = buf.writeFloatBE(node.xyz.bz, cursor)
                        cursor = buf.writeFloatBE(node.xyz.cx, cursor)
                        cursor = buf.writeFloatBE(node.xyz.cy, cursor)
                        cursor = buf.writeFloatBE(node.xyz.cz, cursor)
                        cursor = buf.writeFloatBE(node.xyz.x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0), cursor)
                        cursor = buf.writeFloatBE(node.xyz.y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0), cursor)
                        cursor = buf.writeFloatBE(node.xyz.z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + node.xyz.x * slope, cursor)
                        if (node.xyz.x1 !== undefined) {
                            cursor = buf.writeFloatBE(node.xyz.x1 * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0), cursor)
                            cursor = buf.writeFloatBE(node.xyz.y1 * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0), cursor)
                            cursor = buf.writeFloatBE(node.xyz.z1 * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0), cursor)
                        }
                    }

                }

                if (numberofchildren) {
                    if (node.head[0] == 20581) {
                        cursor += 4
                    }
                    //write pointer to this child list
                    buf.writeInt32BE(cursor, childlist)
                    let children = node.children
                    //keep list of where children pointers should go
                    for (let c = 0; c < numberofchildren; c++) {
                        let repeat = null
                        let child = node.childlist[c]
                        if (child !== 0) {
                            if (Object.values(children).filter(c => c.repeat == child).length > 0) {
                                let thisrepeat = Object.values(children).filter(c => c.repeat == child)[0]
                                for (let r = 0; r < childkeeper.length; r++) {
                                    if (childkeeper[r].original == thisrepeat.repeat) {
                                        repeat = childkeeper[r].replaced
                                    }
                                }
                                if (repeat) {
                                    buf.writeInt32BE(repeat, cursor)
                                }
                            } else {
                                childkeeper.push({ original: child, address: cursor })
                            }
                        }
                        highlight(cursor)
                        cursor += 4
                    }
                    //write children
                    for (let c = 0; c < numberofchildren; c++) {
                        let child = node.childlist[c]
                        if (Object.values(children).filter(c => c.repeat == child).length == 0) {
                            if (child !== 0 && children[child]) {
                                cursor = writeNode(children[child], cursor, child, node, skybox)
                            }
                        }
                    }
                }

            } else {

                let headstart = cursor
                if (node.visuals.material) {
                    highlight(cursor)
                }
                cursor += 4
                let col_testing = false
                if (node.collision.data || col_testing) {
                    highlight(cursor)
                }
                cursor += 4

                let minmax = cursor
                cursor = buf.writeFloatBE(node.min_x, cursor)
                cursor = buf.writeFloatBE(node.min_y, cursor)
                cursor = buf.writeFloatBE(node.min_z, cursor)
                cursor = buf.writeFloatBE(node.max_x, cursor)
                cursor = buf.writeFloatBE(node.max_y, cursor)
                cursor = buf.writeFloatBE(node.max_z, cursor)

                let bb = {}
                function adjustBB(axis, value, bb) {
                    if ([undefined, null].includes(bb['min_' + axis])) {
                        bb['min_' + axis] = value
                    }
                    if ([undefined, null].includes(bb['max_' + axis])) {
                        bb['max_' + axis] = value
                    }
                    if (value < bb['min_' + axis]) {
                        bb['min_' + axis] = value
                    }
                    if (value > bb['max_' + axis]) {
                        bb['max_' + axis] = value
                    }
                }

                cursor = buf.writeInt16BE(node.vert_strip_count, cursor)
                cursor = buf.writeInt16BE(node.vert_strip_default, cursor)

                if (node.collision.vert_strips) {
                    highlight(cursor)
                }
                cursor += 4

                for (let g = 0; g < childkeeper.length; g++) {
                    if (childkeeper[g].original == node.visuals.group_parent && childkeeper[g].replaced) {
                        buf.writeInt32BE(childkeeper[g].replaced, cursor)
                        g = childkeeper.length
                    }
                }
                if (node.visuals.group_parent) {
                    highlight(cursor)
                }
                cursor += 4

                if (node.collision.vert_buffer) {
                    highlight(cursor)
                }
                cursor += 4

                if (node.visuals.index_buffer) {
                    highlight(cursor)
                }
                cursor += 4

                if (node.visuals.vert_buffer) {
                    highlight(cursor)
                }
                cursor += 4

                cursor = buf.writeInt16BE(node.collision.vertex_count, cursor)

                cursor = buf.writeInt16BE(node.visuals.vert_count, cursor)

                cursor += 2
                cursor = buf.writeInt16BE(node.visuals.group_count, cursor)

                if (id == '60312' && index == 1) {
                    cursor += 12
                }
                if (node.collision.vert_strips) {

                    buf.writeInt32BE(cursor, headstart + 36)
                    for (let i = 0; i < node.collision.vert_strips.length; i++) {
                        cursor = buf.writeInt32BE(node.collision.vert_strips[i], cursor)

                    }
                }
                if (node.collision.vert_buffer) {

                    buf.writeInt32BE(cursor, headstart + 44)
                    for (let i = 0; i < node.collision.vertex_count; i++) {
                        for (let j = 0; j < Object.values(node.collision.vert_buffer[i]).length; j++) {
                            let write = Object.values(node.collision.vert_buffer[i])[j]
                            if (index == 114) {
                                cursor = buf.writeFloatBE(Object.values(node.collision.vert_buffer[i])[j], cursor)
                            } else {
                                if (j == 0) {
                                    write = write * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0)
                                } else if (j == 1) {
                                    write = write * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0)
                                } else if (j == 2) {
                                    write = write * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + slope * Object.values(node.collision.vert_buffer[i])[1]
                                }
                                cursor = buf.writeInt16BE(Math.min(rep.extension == 'Trak' ? write : Object.values(node.collision.vert_buffer[i])[j]), cursor)

                            }
                            const coordMap = {
                                0: "x",
                                1: 'y',
                                2: 'z'
                            }
                            adjustBB(coordMap[j], write, bb)
                        }
                    }
                    if (node.collision.vertex_count % 2 == 1 && index !== 114) {
                        cursor += 2
                    }
                }

                //MATERIAL DATA

                if (node.visuals.material) {
                    if (!rep.materials[node.visuals.material.offset]?.address) {
                        if (!rep.materials[node.visuals.material.offset]) {
                            rep.materials[node.visuals.material.offset] = {}
                        }
                        rep.materials[node.visuals.material.offset].address = cursor
                        let materialstart = cursor

                        if (rep.header.anim) {
                            for (let i = 0; i < rep.header.anim.length; i++) {
                                if (node.visuals.material.offset == rep.header.anim[i].target) {
                                    if ([27, 28].includes(rep.header.anim[i].flag2)) {
                                        //console.log(id)
                                    }
                                    rep.header.anim[i].target = materialstart
                                }
                            }
                        }

                        buf.writeInt32BE(cursor, headstart)
                        cursor = buf.writeInt32BE(node.visuals.material.format, cursor) //node.visuals.material.format

                        //0000001   1   254 1 = lightmap
                        //0000010   2   253 no apparent changes
                        //0000100   4   251 
                        //0001000   8   247 0 = double sided, 1 = single sided
                        //0010000   16  239 1 = weird lighting
                        //0100000   32  223 
                        //1000000   64  191 1 =  breaking change

                        //0000100 format 4 is only used for engine trail, binder, and flame effects
                        //0000110 format 6 seems to indicate doublesidedness
                        //0000111 format 7
                        //0001100 format 12 is for any kind of skybox material
                        //0001110 14/15/71 are used for a majority
                        //0001111 15
                        //1000110 70
                        //1000111 71
                        //0010111 23/31/87 are used exclusively with texture 35 possibly for sheen
                        //0011111
                        //1010111
                        cursor += 4

                        if (node.visuals.material.texture_data) {
                            highlight(cursor) //node.visuals.material.texture_data
                        }
                        cursor += 4

                        if (node.visuals.material.unk_data) {
                            highlight(cursor) //node.visuals.material.unk_data
                        }

                        cursor += 4
                        if (node.visuals.material.texture_data) {
                            if (!rep.textures[node.visuals.material.texture_data.offset]?.address) {
                                if (!rep.textures[node.visuals.material.texture_data.offset]) {
                                    rep.textures[node.visuals.material.texture_data.offset] = {}
                                }
                                buf.writeInt32BE(cursor, materialstart + 8)
                                let ti = node.visuals.material.texture_data.tex_index
                                rep.textures[node.visuals.material.texture_data.offset].address = cursor
                                cursor = buf.writeInt32BE(node.visuals.material.texture_data.unk0, cursor)//0, 1, 65, 73 node.visuals.material.texture_data.unk1 //node.visuals.material.texture_data.unk0
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk1, cursor) //node.visuals.material.texture_data.unk1, ti, true, false) //strange stretching/bluring effect, also removes gliding texture animations
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk2, cursor) //replaceHeight(node.visuals.material.texture_data.unk2, ti, true, false)
                                cursor = buf.writeInt32BE(node.visuals.material.texture_data.unk3, cursor) //node.visuals.material.texture_data.unk3
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.format, cursor)
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk4, cursor) //(node.visuals.material.texture_data.unk4


                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.width, cursor)
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.height, cursor)

                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk5, cursor) //node.visuals.material.texture_data.unk5
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk6, cursor) //node.visuals.material.texture_data.unk6
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk7, cursor) //node.visuals.material.texture_data.unk7
                                cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk8, cursor) //node.visuals.material.texture_data.unk8

                                let unk_pointer_start = cursor
                                cursor += 28
                                highlight(cursor)
                                cursor = buf.writeInt16BE(2560, cursor) //node.visuals.material.texture_data.unk9 game breaking

                                if ([107, 108, 109, 110, 111, 112, 113, 114, 115].includes(node.visuals.material.texture_data.tex_index) && [2].includes(index)) {
                                    console.log('found a engine texture at', id)
                                    cursor = buf.writeInt16BE(75, cursor) //node.visuals.material.texture_data.tex_index

                                } else {
                                    cursor = buf.writeInt16BE(node.visuals.material.texture_data.tex_index, cursor) //node.visuals.material.texture_data.tex_index
                                }

                                cursor += 4

                                for (let p = 0; p < node.visuals.material.texture_data.unk_pointers.length; p++) {
                                    highlight(unk_pointer_start + p * 4)
                                    buf.writeInt32BE(cursor, unk_pointer_start + p * 4)
                                    cursor = buf.writeInt32BE(node.visuals.material.texture_data.unk_pointers[p].unk0, cursor)
                                    cursor = buf.writeInt32BE(node.visuals.material.texture_data.unk_pointers[p].unk1, cursor)
                                    cursor = buf.writeInt32BE(node.visuals.material.texture_data.unk_pointers[p].unk2, cursor)
                                    cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk_pointers[p].unk3, cursor) //replaceWidth(node.visuals.material.texture_data.unk_pointers[p].unk3, ti, true, true)
                                    cursor = buf.writeInt16BE(node.visuals.material.texture_data.unk_pointers[p].unk4, cursor) //replaceHeight(node.visuals.material.texture_data.unk_pointers[p].unk4, ti, true, true)

                                }

                            } else {
                                buf.writeInt32BE(rep.textures[node.visuals.material.texture_data.offset].address, materialstart + 8)
                            }
                        }
                        if (node.visuals.material.unk_data) {
                            buf.writeInt32BE(cursor, materialstart + 12)

                            cursor = buf.writeInt16BE(0, cursor) //always 0 //node.visuals.material.unk_data.unk0
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk1, cursor) //0, 1, 8, 9    node.visuals.material.unk_data.unk1
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk2, cursor) //node.visuals.material.unk_data.unk2
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk3, cursor) //setting to 0 removes tinting on shadows/green arrow/start line object binder
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk4, cursor) //node.visuals.material.unk_data.unk4
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk5, cursor) //node.visuals.material.unk_data.unk5
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk6, cursor) //node.visuals.material.unk_data.unk6 messed up shadows/effects
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk7, cursor) //node.visuals.material.unk_data.unk7 
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk8, cursor) //node.visuals.material.unk_data.unk8 
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk9, cursor) //node.visuals.material.unk_data.unk9
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk10, cursor) //node.visuals.material.unk_data.unk10
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk11, cursor) //node.visuals.material.unk_data.unk11
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk12, cursor) //node.visuals.material.unk_data.unk12 blending mode on effects?
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk13, cursor) //node.visuals.material.unk_data.unk13 messed up transparency for shadows/effects
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk14, cursor) //node.visuals.material.unk_data.unk14 blending mode on effects?
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk15, cursor) //node.visuals.material.unk_data.unk15 transparency tags and layering 120 (no transparency), 8200, 8248, 8296, 8312, 16840, 16960, 17216, 18760, 18768, 18808, 18809, 1888, 18904, 18936, 19280, 20048
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk16, cursor) //node.visuals.material.unk_data.unk16
                            cursor = buf.writeUInt8(node.visuals.material.unk_data.r, cursor) //node.visuals.material.unk_data.r
                            cursor = buf.writeUInt8(node.visuals.material.unk_data.g, cursor) //node.visuals.material.unk_data.g
                            cursor = buf.writeUInt8(node.visuals.material.unk_data.b, cursor) //node.visuals.material.unk_data.b
                            cursor = buf.writeUInt8(node.visuals.material.unk_data.t, cursor) //node.visuals.material.unk_data.t

                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk17, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk18, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk19, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk20, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk21, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk22, cursor)
                            cursor = buf.writeInt16BE(node.visuals.material.unk_data.unk23, cursor)
                        }
                    } else {
                        buf.writeInt32BE(rep.materials[node.visuals.material.offset].address, headstart)
                    }
                }

                let bufferpointers = {}
                if (node.visuals.index_buffer) {

                    if (cursor % 8 !== 0) {
                        cursor += 4
                    }
                    buf.writeInt32BE(cursor, headstart + 48)
                    for (let j = 0; j < node.visuals.index_buffer.length; j++) {
                        cursor = buf.writeUInt8(node.visuals.index_buffer[j].type, cursor)
                        if (node.visuals.index_buffer[j].type == 1) {
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].unk1, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].unk2, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].unk3, cursor)
                            bufferpointers[node.visuals.index_buffer[j].start] = cursor
                            highlight(cursor)

                            cursor += 4

                        } else if (node.visuals.index_buffer[j].type == 3) {
                            cursor += 6
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].unk, cursor)
                        } else if (node.visuals.index_buffer[j].type == 5) {
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].x, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].y, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].z, cursor)
                            cursor += 4
                        } else if (node.visuals.index_buffer[j].type == 6) {
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].x1, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].y1, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].z1, cursor)
                            cursor++
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].x2, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].y2, cursor)
                            cursor = buf.writeUInt8(node.visuals.index_buffer[j].z2, cursor)
                        }
                    }
                    cursor = buf.writeUInt8(223, cursor)
                    cursor += 7
                }
                if (node.visuals.vert_buffer) {

                    buf.writeInt32BE(cursor, headstart + 52)
                    for (let i = 0; i < node.visuals.vert_buffer.length; i++) {
                        if (bufferpointers[i]) {
                            buf.writeInt32BE(cursor, bufferpointers[i])
                        }

                        let x = node.visuals.vert_buffer[i].x
                        let y = node.visuals.vert_buffer[i].y
                        let z = node.visuals.vert_buffer[i].z
                        x = x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0) //+ noiseMaker(node.visuals.vert_buffer[i].x, node.visuals.vert_buffer[i].y, node.visuals.vert_buffer[i].z, xNoise, rep.extension)
                        y = y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0) //+ noiseMaker(node.visuals.vert_buffer[i].x, node.visuals.vert_buffer[i].y, node.visuals.vert_buffer[i].z, yNoise, rep.extension)
                        z = z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + y * slope //+ noiseMaker(node.visuals.vert_buffer[i].x, node.visuals.vert_buffer[i].y, node.visuals.vert_buffer[i].z, zNoise, rep.extension) + y * slope

                        cursor = buf.writeInt16BE(Math.min(!skybox ? x : node.visuals.vert_buffer[i].x), cursor)
                        cursor = buf.writeInt16BE(Math.min(!skybox ? y : node.visuals.vert_buffer[i].y), cursor)
                        cursor = buf.writeInt16BE(Math.min(!skybox ? z : node.visuals.vert_buffer[i].z), cursor)


                        adjustBB('x', x, bb)
                        adjustBB('y', y, bb)
                        adjustBB('z', z, bb)

                        cursor += 2
                        cursor = buf.writeInt16BE(node.visuals.vert_buffer[i].uv_x, cursor)
                        cursor = buf.writeInt16BE(node.visuals.vert_buffer[i].uv_y, cursor) //(fixed_32x32.includes(ti) ? .5 : 1) * 

                        cursor = buf.writeUInt8(rep.extension !== 'MAlt' ? 0 : node.visuals.vert_buffer[i].v_color[0], cursor) //node.visuals.vert_buffer[i].v_color[0]
                        cursor = buf.writeUInt8(rep.extension !== 'MAlt' ? 0 : node.visuals.vert_buffer[i].v_color[1], cursor) //node.visuals.vert_buffer[i].v_color[1]
                        cursor = buf.writeUInt8(rep.extension !== 'MAlt' ? 0 : node.visuals.vert_buffer[i].v_color[2], cursor) //node.visuals.vert_buffer[i].v_color[2],
                        cursor = buf.writeUInt8(rep.extension !== 'MAlt' ? 0 : node.visuals.vert_buffer[i].v_color[3], cursor) //node.visuals.vert_buffer[i].v_color[3],

                    }
                }

                //  COLLISION DATA

                if (node.collision.data) { //|| node.collision.vertex_count
                    //if (node.collision.data) {
                    buf.writeInt32BE(cursor, headstart + 4)
                    cursor = buf.writeInt16BE(2, cursor) //node.collision.data.unk
                    cursor = buf.writeUInt8(15, cursor) //node.collision.data.fog.flag
                    cursor = buf.writeUInt8(255, cursor) //node.collision.data.fog.r
                    cursor = buf.writeUInt8(255, cursor) //node.collision.data.fog.g
                    cursor = buf.writeUInt8(255, cursor) //node.collision.data.fog.b
                    cursor = buf.writeInt16BE(2200, cursor) //node.collision.data.fog.start
                    cursor = buf.writeInt16BE(4500, cursor) //node.collision.data.fog.end
                    cursor = buf.writeInt16BE(7, cursor) //node.collision.data.lights.flag
                    cursor = buf.writeUInt8(0, cursor) //node.collision.data.lights.ambient_r
                    cursor = buf.writeUInt8(0, cursor) //node.collision.data.lights.ambient_g
                    cursor = buf.writeUInt8(0, cursor) //node.collision.data.lights.ambient_b
                    cursor = buf.writeUInt8(50, cursor) //node.collision.data.lights.r
                    cursor = buf.writeUInt8(50, cursor) //node.collision.data.lights.g
                    cursor = buf.writeUInt8(50, cursor) //node.collision.data.lights.b
                    cursor = buf.writeUInt8(0, cursor) //node.collision.data.lights.unk1
                    cursor = buf.writeUInt8(0, cursor) //node.collision.data.lights.unk2
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.x
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.y
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.z
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.unk3
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.unk4
                    cursor = buf.writeFloatBE(0, cursor) //node.collision.data.lights.unk5
                    cursor = buf.writeInt32BE(node.collision?.data?.flags ?? 0, cursor) //node.collision.data.flags
                    cursor = buf.writeInt32BE(22860, cursor) //node.collision.data.unk2
                    cursor = buf.writeInt32BE(node.collision.data.unload ?? 0, cursor) //node.collision.data.unload
                    cursor = buf.writeInt32BE(node.collision.data.load ?? 0, cursor)//node.collision.data.load

                    //      TRIGGERS
                    if (node.collision.data?.triggers?.length) { //(node.collision.data?.triggers?.length && index !== 1) || (index == 1 && ![666740].includes(id))
                        if (index == 1 && node.collision.data.triggers.length) {
                            //console.log(headstart, id)
                        }
                        for (let t = 0; t < node.collision.data.triggers.length; t++) {
                            //write pointer to next trigger
                            highlight(cursor)
                            cursor = buf.writeInt32BE(cursor + 4, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].x * xStretch + xOffset, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].y * yStretch + yOffset, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].z * zStretch + zOffset + node.collision.data.triggers[t].y * slope, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].vx, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].vy, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].vz, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].width * xStretch, cursor)
                            cursor = buf.writeFloatBE(node.collision.data.triggers[t].height * zStretch, cursor)
                            triggerkeeper.push({ original: node.collision.data.triggers[t].target, address: cursor })
                            highlight(cursor) //node.collision.data.triggers[t].target
                            cursor += 4
                            cursor = buf.writeInt16BE(node.collision.data.triggers[t].flag, cursor) //node.collision.data.triggers[t].flag
                            cursor += 2
                        }
                    }
                    highlight(cursor) //ends with blank pointer since there doesn't seem to be a value for how many triggers exist
                    cursor += 4
                }

                //adjust minmax
                if (rep.extension == 'Trak') {
                    buf.writeFloatBE(bb.min_x, minmax)
                    buf.writeFloatBE(bb.min_y, minmax + 4)
                    buf.writeFloatBE(bb.min_z, minmax + 8)
                    buf.writeFloatBE(bb.max_x, minmax + 12)
                    buf.writeFloatBE(bb.max_y, minmax + 16)
                    buf.writeFloatBE(bb.max_z, minmax + 20)

                    adjustBB('x', bb.min_x, parent.bb)
                    adjustBB('x', bb.max_x, parent.bb)
                    adjustBB('y', bb.min_y, parent.bb)
                    adjustBB('y', bb.max_y, parent.bb)
                    adjustBB('z', bb.min_z, parent.bb)
                    adjustBB('z', bb.max_z, parent.bb)

                    buf.writeFloatBE(parent.bb.min_x, parent.bb.address)
                    buf.writeFloatBE(parent.bb.min_y, parent.bb.address + 4)
                    buf.writeFloatBE(parent.bb.min_z, parent.bb.address + 8)
                    buf.writeFloatBE(parent.bb.max_x, parent.bb.address + 12)
                    buf.writeFloatBE(parent.bb.max_y, parent.bb.address + 16)
                    buf.writeFloatBE(parent.bb.max_z, parent.bb.address + 20)
                }

            }
            return cursor
        }
        cursor += buf.write(rep.extension, cursor)
        header.push(rep.extension)
        //console.log(rep.extension, rep.header.head.length * 4)
        for (let i = 0; i < rep.header.head.length; i++) {
            if (rep.header.head[i] !== 0) {
                headkeeper.push({ original: rep.header.head[i], address: cursor })
            }
            highlight(cursor)
            cursor = buf.writeInt32BE(rep.header.head[i], cursor)
            header.push(rep.header.head[i])
            if (i == rep.header.head.length - 1) {
                cursor = buf.writeInt32BE(-1, cursor)
                header.push(-1)
            }
        }

        //add lightstreaks
        if (rep.header?.data?.lightstreaks) {
            cursor += buf.write("Data", cursor)
            header.push("Data")
            cursor = buf.writeInt32BE(rep.header.data.lightstreaks.length * 4, cursor)
            header.push(rep.header.data.lightstreaks.length * 4)
            for (let i = 0; i < rep.header.data.lightstreaks.length; i++) {
                cursor += buf.write("LStr", cursor)
                cursor = buf.writeFloatBE(rep.header.data.lightstreaks[i][0] * xStretch + xOffset, cursor)
                cursor = buf.writeFloatBE(rep.header.data.lightstreaks[i][1] * yStretch + yOffset, cursor)
                cursor = buf.writeFloatBE(rep.header.data.lightstreaks[i][2] * zStretch + zOffset + rep.header.data.lightstreaks[i][1] * slope, cursor)
                header.push("LStr", ...rep.header.data.lightstreaks[i])
            }
        }

        //collect animations
        if (rep.header.anim) {
            cursor += buf.write("Anim", cursor)
            header.push("Anim")
            animlist = cursor //save start of anim list
            for (let i = 0; i < rep.header.anim.length; i++) {
                highlight(cursor)
                header.push(0)
                cursor += 4
            }
            header.push(0)
            highlight(cursor)
            cursor += 4
        }

        //AltN

        if (rep.header.altn) {
            cursor += buf.write('AltN', cursor)
            header.push("AltN")
            for (let i = 0; i < rep.header.altn.length; i++) {
                altnkeeper.push({ original: rep.header.altn[i], address: cursor })
                header.push(rep.header.altn[i])
                highlight(cursor)
                cursor += 4
            }
            highlight(cursor)
            header.push(0)
            cursor += 4
        }
        cursor += buf.write('HEnd', cursor)
        header.push("HEnd")
        headerGatherer(rep.extension, index, header)
        //this loop writes all of the model data recursively
        for (let d = 0; d < Object.keys(rep.data).length; d++) {
            cursor = writeNode(Object.values(rep.data)[d], cursor, Object.keys(rep.data)[d], false)
        }

        //write animations
        if (rep.header.anim) {
            for (let a = 0; a < rep.header.anim.length; a++) {

                buf.writeInt32BE(cursor, (animlist + a * 4))
                cursor += 61 * 4
                cursor = buf.writeFloatBE(rep.header.anim[a].float1, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float2, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float3, cursor)
                cursor = buf.writeInt16BE(rep.header.anim[a].flag1, cursor)
                cursor = buf.writeInt16BE(rep.header.anim[a].flag2, cursor)
                cursor = buf.writeInt32BE(rep.header.anim[a].num_keyframes, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float4, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float5, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float6, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float7, cursor)
                cursor = buf.writeFloatBE(rep.header.anim[a].float8, cursor)
                highlight(cursor)
                let keyframe_times = cursor
                cursor += 4
                highlight(cursor)
                let keyframe_poses = cursor
                cursor += 4
                let anim_target = null
                let flag = rep.header.anim[a].flag2
                highlight(cursor)
                if ([2, 18].includes(flag)) {
                    anim_target = cursor
                } else {
                    buf.writeInt32BE(rep.header.anim[a].target, cursor)
                }
                cursor += 4
                cursor = buf.writeInt32BE(rep.header.anim[a].unk32, cursor)

                //write keyframe times
                buf.writeInt32BE(cursor, keyframe_times)
                for (let k = 0; k < rep.header.anim[a].keyframe_times.length; k++) {
                    cursor = buf.writeFloatBE(rep.header.anim[a].keyframe_times[k], cursor)
                }

                if ([2, 18].includes(flag)) {
                    //write target list
                    buf.writeInt32BE(cursor, anim_target)
                    highlight(cursor)
                    cursor = buf.writeInt32BE(rep.header.anim[a].target, cursor)
                    highlight(cursor)
                    cursor += 4
                }

                //write keyframe poses
                buf.writeInt32BE(cursor, keyframe_poses)

                for (let p = 0; p < rep.header.anim[a].keyframe_poses.length; p++) {

                    if ([8, 24, 40, 56, 4152].includes(flag)) { //rotation (4)
                        for (let f = 0; f < 4; f++) {
                            cursor = buf.writeFloatBE(rep.header.anim[a].keyframe_poses[p][f], cursor)
                        }
                    } else if ([25, 41, 57, 4153].includes(flag)) { //position (3)
                        for (let f = 0; f < 3; f++) {
                            cursor = buf.writeFloatBE(rep.header.anim[a].keyframe_poses[p][f] * (f == 0 ? xStretch : f == 1 ? yStretch : zStretch) + (f == 0 ? xStretch : f == 1 ? yStretch : zStretch), cursor)
                        }
                    } else if ([27, 28].includes(flag)) { //uv_x/uv_y (1)
                        cursor = buf.writeFloatBE(rep.header.anim[a].keyframe_poses[p], cursor)
                    }
                }
                if ([2, 18].includes(flag)) { //texture
                    let texturelist = cursor
                    for (let k = 0; k < rep.header.anim[a].keyframe_poses.length; k++) {
                        highlight(cursor)
                        cursor += 4
                    }
                    for (let k = 0; k < rep.header.anim[a].keyframe_poses.length; k++) {
                        if (rep.textures[rep.header.anim[a].keyframe_poses[k]?.repeat]?.address) { //rep.header.anim[a].keyframe_poses[k].repeat && 
                            buf.writeInt32BE(rep.textures[rep.header.anim[a].keyframe_poses[k].repeat].address, texturelist + k * 4)
                        } else if (rep.textures[rep.header.anim[a].keyframe_poses[k]?.offset]?.address) { //rep.header.anim[a].keyframe_poses[k].repeat && 
                            buf.writeInt32BE(rep.textures[rep.header.anim[a].keyframe_poses[k].offset].address, texturelist + k * 4)
                        } else {
                            buf.writeInt32BE(cursor, texturelist + k * 4)

                            rep.textures[rep.header.anim[a].keyframe_poses[k].offset] = { address: cursor }
                            cursor = buf.writeInt32BE(rep.header.anim[a].keyframe_poses[k].unk0, cursor)             //0, 1, 65, 73
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk1, cursor)         //width * 4
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk2, cursor)         //height * 4
                            cursor = buf.writeInt32BE(rep.header.anim[a].keyframe_poses[k].unk3, cursor)           //always 0
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].format, cursor)       //3, 512, 513, 1024
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk4, cursor)         //0, 4
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].width, cursor)       //pixel width
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].height, cursor)       //pixel height
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk5, cursor)         //width * 512 (unsigned)
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk6, cursor)         //height * 512 (unsigned)
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk7, cursor)        //0 when unk4 is 4, 
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk8, cursor)
                            let unk_pointer_start = cursor
                            cursor += 28
                            highlight(cursor)
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk9, cursor)
                            cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].tex_index, cursor)
                            cursor += 4

                            for (let p = 0; p < rep.header.anim[a].keyframe_poses[k].unk_pointers.length; p++) {
                                highlight(unk_pointer_start + p * 4)
                                buf.writeInt32BE(cursor, unk_pointer_start + p * 4)
                                cursor = buf.writeInt32BE(rep.header.anim[a].keyframe_poses[k].unk_pointers[p].unk0, cursor)
                                cursor = buf.writeInt32BE(rep.header.anim[a].keyframe_poses[k].unk_pointers[p].unk1, cursor)
                                cursor = buf.writeInt32BE(rep.header.anim[a].keyframe_poses[k].unk_pointers[p].unk2, cursor)
                                cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk_pointers[p].unk3, cursor)
                                cursor = buf.writeInt16BE(rep.header.anim[a].keyframe_poses[k].unk_pointers[p].unk4, cursor)
                            }
                        }
                    }
                }

            }
        }

        for (let t = 0; t < triggerkeeper.length; t++) {
            for (let g = 0; g < childkeeper.length; g++) {
                if (childkeeper[g].original == triggerkeeper[t].original && !triggerkeeper[t].replaced && childkeeper[g].replaced) {
                    buf.writeInt32BE(childkeeper[g].replaced, triggerkeeper[t].address)
                    triggerkeeper[t].replaced = true
                }
            }
        }

        buf = buf.subarray(0, cursor)
        hl = hl.subarray(0, Math.ceil(cursor / (32 * 4)) * 4)
        models.push(buf)

        highlights.push(hl)
    }

    const length = 323

    for (let m = 0; m < length; m++) {
        writeModel(m)
    }

    console.log('length', length)

    let index = Buffer.alloc((length * 2 + 2) * 4)
    let modelblock = []
    modelblock.push(index)

    index.writeUInt32BE(length, 0) //write total number of models

    let c = index.byteLength
    for (let m = 0; m < length; m++) {
        index.writeUInt32BE(c, 4 + (m * 2) * 4)
        console.log(c)
        c += highlights[m].byteLength

        //console.log(m, 'hl', highlights[m].byteLength)
        modelblock.push(highlights[m])

        index.writeUInt32BE(c, 4 + (m * 2 + 1) * 4)
        console.log(c)
        c += models[m].byteLength
        //console.log(m, 'm', models[m].byteLength)
        modelblock.push(models[m])
    }

    index.writeUInt32BE(c, (length * 2 + 1) * 4)


    let mb = Buffer.concat(modelblock)

    fs.writeFileSync('C:/Program Files (x86)/Steam/steamapps/common/Star Wars Episode I Racer/data/lev01/out_modelblock.bin', mb);

    Object.keys(headers).forEach(key => {
        fs.writeFileSync(`headers_${key}.csv`, Object.keys(headers[key]).map(k => `${k}, ${headers[key][k].join(", ")}`).join("\n"));
    })

    if (splineblock) {
        let splineblock_new = Buffer.alloc(700000)
        cursor = 0
        splineblock_new.writeInt32BE(splineblock.splines.length, cursor)
        cursor = splineblock.splines.length * 4 + 8
        for (let s = 0; s < splineblock.splines.length; s++) {
            splineblock_new.writeInt32BE(cursor, s * 4 + 4)
            for (let i = 0; i < 8; i++) {
                if (i == 6) {
                    cursor = splineblock_new.writeInt32BE(splineblock.splines[s].header.unknown_address, cursor)
                    i++
                } else {
                    cursor = splineblock_new.writeInt16BE(splineblock.splines[s].header["unknown_" + i], cursor)
                }
            }
            for (let p = 0; p < splineblock.splines[s].points.length; p++) {
                let point = splineblock.splines[s].points[p]
                cursor = splineblock_new.writeInt16BE(point.splits, cursor)
                cursor = splineblock_new.writeInt16BE(point.joins, cursor)
                cursor = splineblock_new.writeInt16BE(point.next1, cursor)
                cursor = splineblock_new.writeInt16BE(point.next2, cursor)
                cursor = splineblock_new.writeInt16BE(point.previous1, cursor)
                cursor = splineblock_new.writeInt16BE(point.previous2, cursor)
                cursor = splineblock_new.writeInt16BE(point.unknown1, cursor)
                cursor = splineblock_new.writeInt16BE(point.unknown2, cursor)
                cursor = splineblock_new.writeFloatBE(point.point_x * xStretch + xOffset + xSplineOffset, cursor)
                cursor = splineblock_new.writeFloatBE(point.point_y * yStretch + yOffset + ySplineOffset, cursor)
                cursor = splineblock_new.writeFloatBE(point.point_z * zStretch + zOffset + zSplineOffset + point.point_y * slope, cursor)
                cursor = splineblock_new.writeFloatBE(point.unknown_x, cursor)
                cursor = splineblock_new.writeFloatBE(point.unknown_y, cursor)
                cursor = splineblock_new.writeFloatBE(point.unknown_z, cursor)
                cursor = splineblock_new.writeFloatBE(point.handle1_x * xStretch + xOffset + xSplineOffset, cursor) //+ noiseMaker(point.handle1_x, point.handle1_y, point.handle1_z, xNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeFloatBE(point.handle1_y * yStretch + yOffset + ySplineOffset, cursor) //+ noiseMaker(point.handle1_x, point.handle1_y, point.handle1_z, yNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeFloatBE(point.handle1_z * zStretch + zOffset + zSplineOffset + point.handle1_y * slope, cursor) //+ noiseMaker(point.handle1_x, point.handle1_y, point.handle1_z, zNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeFloatBE(point.handle2_x * xStretch + xOffset + xSplineOffset, cursor) //+ noiseMaker(point.handle2_x, point.handle2_y, point.handle2_z, xNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeFloatBE(point.handle2_y * yStretch + yOffset + ySplineOffset, cursor) //+ noiseMaker(point.handle2_x, point.handle2_y, point.handle2_z, yNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeFloatBE(point.handle2_z * zStretch + zOffset + zSplineOffset + point.handle2_y * slope, cursor) //+ noiseMaker(point.handle2_x, point.handle2_y, point.handle2_z, zNoise, 'Trak'), cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num0, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num1, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num2, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num3, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num4, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num5, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num6, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num7, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_num8, cursor)
                cursor = splineblock_new.writeInt16BE(point.point_unk, cursor)
            }
        }
        splineblock_new.writeInt32BE(cursor, splineblock.splines.length * 4 + 4)

        fs.writeFileSync('out/out_splineblock.bin', splineblock_new);
    }


})

