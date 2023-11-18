
exports.highlight = function ({ cursor, hl } = {}) {
    //this function is called whenever an address need to be 'highlighted' because it is a pointer
    //every model begins with a pointer map where each bit represents 4 bytes in the following model 
    //if the bit is 1, that corresponding DWORD is to be read as a pointer
    let highlightoffset = Math.floor(cursor / 32)
    let bit = 2 ** (7 - Math.floor((cursor % 32) / 4))
    let highlight = hl.readUInt8(highlightoffset)
    hl.writeUInt8((highlight | bit), highlightoffset)
}

exports.read_block = function ({ file } = {}) {
    let model_count = file.readUInt32BE(0)
    let models = []
    for (let i = 0; i < model_count; i++) {
        const model_start = file.readUInt32BE(8 + i * 8)
        const model_end = file.readUInt32BE(12 + i * 8)
        const model = file.slice(model_start, model_end)
        models.push(model)
    }
    return models
}

exports.read_Data = function ({ buffer, cursor, model } = {}) {
    model.data = { LStr: [], other: [] }
    const size = buffer.readUInt32BE(cursor)
    cursor += 4
    for (let i = 0; i < size; i++) {
        if (buffer.toString('utf8', cursor, cursor + 4) == 'LStr') {
            cursor += 4
            model.data.LStr.push([buffer.readFloatBE(cursor), buffer.readFloatBE(cursor + 4), buffer.readFloatBE(cursor + 8)])
            cursor += 12
            i += 3
        } else {
            model.data.other.push(buffer.readUInt32BE(cursor))
            cursor += 4
        }
    }
    return cursor
}

exports.read_Anim = function ({ buffer, cursor, model } = {}) {
    model.Anim = []
    let anim = buffer.readUInt32BE(cursor)
    while (anim) {
        model.Anim.push(exports.read_anim({ buffer, cursor: anim }))
        cursor += 4
        anim = buffer.readUInt32BE(cursor)
    }
    return cursor + 4
}

exports.read_AltN = function ({ buffer, cursor, model } = {}) {
    model.AltN = []
    let altn = buffer.readUInt32BE(cursor)
    while (altn) {
        model.AltN.push(altn)
        cursor += 4
        altn = buffer.readUInt32BE(cursor)
    }
    return cursor + 4
}

exports.read_header = function ({ buffer, model, index } = {}) {
    model.ext = buffer.toString('utf8', 0, 4)
    model.id = index
    model.header = []
    let cursor = 4
    let header = buffer.readInt32BE(cursor)
    while (header !== -1) {
        model.header.push(header)
        cursor += 4
        header = buffer.readInt32BE(cursor)
    }
    cursor += 4
    let header_string = buffer.toString('utf8', cursor, cursor + 4)
    while (header_string !== 'HEnd') {
        switch (header_string) {
            case 'Data':
                cursor = exports.read_Data({ buffer, cursor: cursor + 4, model })
                header_string = buffer.toString('utf8', cursor, cursor + 4)
                break
            case 'Anim':
                cursor = exports.read_Anim({ buffer, cursor: cursor + 4, model })
                header_string = buffer.toString('utf8', cursor, cursor + 4)
                break
            case 'AltN':
                cursor = exports.read_AltN({ buffer, cursor: cursor + 4, model })
                header_string = buffer.toString('utf8', cursor, cursor + 4)
                break
        }
    }

    return cursor + 4
}

exports.read_mat = function ({ buffer, cursor } = {}) {
    if (!cursor) {
        return 0
    }
    let mat = {
        format: buffer.readInt32BE(cursor),
        texture: exports.read_mat_texture({ buffer, cursor: buffer.readUInt32BE(cursor + 8) }),
        unk: exports.read_mat_unk({ buffer, cursor: buffer.readInt32BE(cursor + 12) })
    }
    return mat
}

exports.read_mat_texture = function ({ buffer, cursor } = {}) {
    if (!cursor) {
        return 0
    }
    let mat = {
        id: cursor,
        unk0: buffer.readInt32BE(cursor),             //0, 1, 65, 73
        unk1: buffer.readInt16BE(cursor + 4),       //width * 4
        unk2: buffer.readInt16BE(cursor + 6),       //height * 4
        unk3: buffer.readInt32BE(cursor + 8),         //always 0
        format: buffer.readInt16BE(cursor + 12),     //3, 512, 513, 1024
        unk4: buffer.readInt16BE(cursor + 14),       //0, 4
        width: buffer.readInt16BE(cursor + 16),      //pixel width
        height: buffer.readInt16BE(cursor + 18),     //pixel height
        unk5: buffer.readInt16BE(cursor + 20),       //width * 512 (unsigned)
        unk6: buffer.readInt16BE(cursor + 22),       //height * 512 (unsigned)
        unk7: buffer.readInt16BE(cursor + 24),       //0 when unk4 is 4, 
        unk8: buffer.readInt16BE(cursor + 26),
        unk_pointer1: buffer.readInt32BE(cursor + 28),
        unk_pointer2: buffer.readInt32BE(cursor + 32),
        unk_pointer3: buffer.readInt32BE(cursor + 36),
        unk_pointer4: buffer.readInt32BE(cursor + 40),
        unk_pointer5: buffer.readInt32BE(cursor + 44),
        unk_pointer6: buffer.readInt32BE(cursor + 48),
        unk_pointers: [],
        unk9: buffer.readInt16BE(cursor + 56),      //2560, 2815 is used when cursor index is blank
        tex_index: buffer.readInt16BE(cursor + 58),
    }

    let unk_pointers = [
        mat.unk_pointer1,
        mat.unk_pointer2,
        mat.unk_pointer3,
        mat.unk_pointer4,
        mat.unk_pointer5,
        mat.unk_pointer6
    ]
    for (let i = 0; i < unk_pointers.length; i++) {
        let pointer = unk_pointers[i]
        if (pointer) {
            mat.unk_pointers.push({
                unk0: buffer.readInt32BE(pointer),
                unk1: buffer.readInt32BE(pointer + 4),
                unk2: buffer.readInt32BE(pointer + 8),
                unk3: buffer.readInt16BE(pointer + 12),
                unk4: buffer.readInt16BE(pointer + 14),
            })
        }
    }
    return mat
}

exports.read_mat_unk = function ({ buffer, cursor } = {}) {
    if (!cursor) {
        return 0
    }
    return {
        unk0: buffer.readInt16BE(cursor), //always 0
        unk1: buffer.readInt16BE(cursor + 2), //0, 1, 8, 9   
        unk2: buffer.readInt16BE(cursor + 4), //1, 2
        unk3: buffer.readInt16BE(cursor + 6), //287, 513, 799, 1055, 1537, 7967
        unk4: buffer.readInt16BE(cursor + 8), //287, 799, 1055, 3329, 7939, 7940
        unk5: buffer.readInt16BE(cursor + 10), //263, 513, 775, 1031, 1537, 1795, 1799
        unk6: buffer.readInt16BE(cursor + 12), //1, 259, 263, 775, 1031, 1793, 1795, 1796, 1798, 
        unk7: buffer.readInt16BE(cursor + 14), //31, 287, 799, 1055, 7967
        unk8: buffer.readInt16BE(cursor + 16), //31, 799, 1055, 7936, 7940
        unk9: buffer.readInt16BE(cursor + 18), //7, 1799
        unk10: buffer.readInt16BE(cursor + 20), //775, 1031, 1792, 1796, 1798
        unk11: buffer.readInt16BE(cursor + 22), //always 0
        unk12: buffer.readInt16BE(cursor + 24), //-14336, 68, 3080
        unk13: buffer.readInt16BE(cursor + 26), //0, 1, 8200, 8312
        unk14: buffer.readInt16BE(cursor + 28), //16, 17, 770
        unk15: buffer.readInt16BE(cursor + 30), //120, 8200, 8248, 8296, 8312, 16840, 16856, 16960, 17216, 18760, 18768, 18808, 18809, 18888, 18904, 18936, 19280, 20048
        unk16: buffer.readInt16BE(cursor + 32), //probably 0?
        r: buffer.readUInt8(cursor + 34),
        g: buffer.readUInt8(cursor + 35),
        b: buffer.readUInt8(cursor + 36),
        t: buffer.readUInt8(cursor + 37),
        unk17: buffer.readInt16BE(cursor + 38),
        unk18: buffer.readInt16BE(cursor + 40),
        unk19: buffer.readInt16BE(cursor + 42),
        unk20: buffer.readInt16BE(cursor + 44),
        unk21: buffer.readInt16BE(cursor + 46),
        unk22: buffer.readInt16BE(cursor + 48),
        unk23: buffer.readInt16BE(cursor + 50)
    }
}

exports.read_anim = function ({ buffer, cursor } = {}) {
    let anim = {
        float1: buffer.readFloatBE(cursor + 61 * 4),
        float2: buffer.readFloatBE(cursor + 62 * 4),
        float3: buffer.readFloatBE(cursor + 63 * 4), //first three floats always match
        flag1: buffer.readInt16BE(cursor + 64 * 4), //always 4352
        flag2: buffer.readInt16BE(cursor + 64 * 4 + 2),
        num_keyframes: buffer.readInt32BE(cursor + 65 * 4),
        float4: buffer.readFloatBE(cursor + 66 * 4),
        float5: buffer.readFloatBE(cursor + 67 * 4),
        float6: buffer.readFloatBE(cursor + 68 * 4), //always 1
        float7: buffer.readFloatBE(cursor + 69 * 4), //always 0
        float8: buffer.readFloatBE(cursor + 70 * 4), //always 0
        keyframe_times: buffer.readInt32BE(cursor + 71 * 4),
        keyframe_poses: buffer.readInt32BE(cursor + 72 * 4),
        target: buffer.readInt32BE(cursor + 73 * 4),
        unk32: buffer.readInt32BE(cursor + 74 * 4),
    }

    let keyframe_times = anim.keyframe_times
    let keyframe_poses = anim.keyframe_poses
    anim.keyframe_times = []
    anim.keyframe_poses = []
    if ([2, 18].includes(anim.flag2)) {
        anim.target = buffer.readUInt32BE(anim.target)
    }
    for (let f = 0; f < anim.num_keyframes; f++) {
        if (keyframe_times) {
            anim.keyframe_times.push(buffer.readFloatBE(keyframe_times + f * 4))
        }
        if (keyframe_poses) {
            if ([8, 24, 40, 56, 4152].includes(anim.flag2)) { //rotation (4)
                anim.keyframe_poses.push([
                    buffer.readFloatBE(keyframe_poses + f * 16),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 4),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 8),
                    buffer.readFloatBE(keyframe_poses + f * 16 + 12)
                ])
            } else if ([25, 41, 57, 4153].includes(anim.flag2)) { //position (3)
                anim.keyframe_poses.push([
                    buffer.readFloatBE(keyframe_poses + f * 12),
                    buffer.readFloatBE(keyframe_poses + f * 12 + 4),
                    buffer.readFloatBE(keyframe_poses + f * 12 + 8)
                ])
            } else if ([27, 28].includes(anim.flag2)) { //uv_x/uv_y (1)
                anim.keyframe_poses.push([
                    buffer.readFloatBE(keyframe_poses + f * 4)
                ])
            } else if ([2, 18].includes(anim.flag2)) { //texture
                let tex = buffer.readUInt32BE(keyframe_poses + f * 4)

                if (tex < cursor) {
                    anim.keyframe_poses.push({ repeat: tex })
                } else {
                    anim.keyframe_poses.push(exports.read_mat_texture({ buffer, cursor: tex }))
                }

            }
        }
    }

    return anim
}

exports.read_collision_vert_strips = function ({ buffer, cursor, count } = {}) {
    if (!cursor) {
        return 0
    }
    let vert_strips = []
    for (v = 0; v < count; v++) {
        vert_strips.push(buffer.readInt32BE(cursor + v * 4))
    }
    return vert_strips
}

exports.read_collision_vert_buffer = function ({ buffer, cursor, count } = {}) {
    if (!cursor) {
        return 0
    }
    let vert_buffer = []
    // if (model.model == 114) {
    //     for (v = 0; v < header.collision.vertex_count * 3; v += 3) {
    //         header.collision.vert_buffer.push(
    //             [data[data_keys[vert_buffer + v]].float, data[data_keys[vert_buffer + v + 1]].float, data[data_keys[vert_buffer + v + 2]].float]
    //         )
    //     }
    // }
    for (v = 0; v < count; v++) {
        vert_buffer.push(
            [
                buffer.readInt16BE(cursor + v * 6),
                buffer.readInt16BE(cursor + v * 6 + 2),
                buffer.readInt16BE(cursor + v * 6 + 4)
            ]
        )
    }
    return vert_buffer
}

exports.read_collision_triggers = function ({ buffer, cursor } = {}) {
    //reads through a linked list
    let next = cursor
    let triggers = []
    while (next) {
        let trigger = {
            x: buffer.readFloatBE(next),
            y: buffer.readFloatBE(next + 4),
            z: buffer.readFloatBE(next + 8),
            vx: buffer.readFloatBE(next + 12),
            vy: buffer.readFloatBE(next + 16),
            vz: buffer.readFloatBE(next + 20),
            width: buffer.readFloatBE(next + 24),
            height: buffer.readFloatBE(next + 28),
            target: buffer.readUInt32BE(next + 32),
            flag: buffer.readInt16BE(next + 36),
        }
        triggers.push(trigger)
        next = buffer.readUInt32BE(next + 40)
    }
    return triggers
}

exports.read_collision_data = function ({ buffer, cursor } = {}) {
    if (!cursor) {
        return 0
    }
    let data = {
        unk: buffer.readInt16BE(cursor),          //2, 4, 16, 18, 20, 32, 36
        fog: {
            flag: buffer.readUInt8(cursor + 2),        //0, 1, 2, 3, 4, 5, 7, 11, 12
            r: buffer.readUInt8(cursor + 3),
            g: buffer.readUInt8(cursor + 4),
            b: buffer.readUInt8(cursor + 5),
            start: buffer.readInt16BE(cursor + 6),
            end: buffer.readInt16BE(cursor + 8)     //1000 - 6000
        },
        lights: {
            flag: buffer.readInt16BE(cursor + 10),   //0, 1, 3, 6, 7, 11, 15, 23
            ambient_r: buffer.readUInt8(cursor + 12),
            ambient_g: buffer.readUInt8(cursor + 13),
            ambient_b: buffer.readUInt8(cursor + 14),
            r: buffer.readUInt8(cursor + 15),
            g: buffer.readUInt8(cursor + 16),
            b: buffer.readUInt8(cursor + 17),
            unk1: buffer.readUInt8(cursor + 18),
            unk2: buffer.readUInt8(cursor + 19),
            x: buffer.readFloatBE(cursor + 20),
            y: buffer.readFloatBE(cursor + 24),
            z: buffer.readFloatBE(cursor + 28),
            unk3: buffer.readFloatBE(cursor + 32),   //-1, 0, 1
            unk4: buffer.readFloatBE(cursor + 36),   //-1, 0, 1
            unk5: buffer.readFloatBE(cursor + 40)   //always 0
        },
        flags: buffer.readUInt32BE(cursor + 44), // >>> 0).toString(2),
        unk2: buffer.readUInt32BE(cursor + 48),
        unload: buffer.readUInt32BE(cursor + 52), // >>> 0).toString(2),
        load: buffer.readUInt32BE(cursor + 56), // >>> 0).toString(2),
        triggers: exports.read_collision_triggers({ buffer, cursor: buffer.readUInt32BE(cursor + 60) })
    }
    return data
}

exports.read_visual_index_buffer = function ({ buffer, cursor } = {}) {
    if (!cursor) {
        return 0
    }
    let index_buffer = []
    let v = 0

    while (buffer.readUInt8(cursor + v) !== 223) {
        let type = buffer.readUInt8(cursor + v)
        switch (type) {
            case 1:
                index_buffer.push(
                    {
                        type,
                        unk1: buffer.readUInt8(cursor + v + 1),
                        unk2: buffer.readUInt8(cursor + v + 2),
                        unk3: buffer.readUInt8(cursor + v + 3),
                        start: (buffer.readUInt32BE(cursor + v + 4) - cursor) / 16
                    }
                )
                break
            case 3:
                index_buffer.push(
                    {
                        type,
                        unk: buffer.readUInt8(cursor + v + 7)
                    }
                )
                break
            case 5:
                index_buffer.push(
                    {
                        type,
                        x: buffer.readUInt8(cursor + v + 1),
                        y: buffer.readUInt8(cursor + v + 2),
                        z: buffer.readUInt8(cursor + v + 3)
                    }
                )
                break
            case 6:
                index_buffer.push(
                    {
                        type,
                        x1: buffer.readUInt8(cursor + v + 1),
                        y1: buffer.readUInt8(cursor + v + 2),
                        z1: buffer.readUInt8(cursor + v + 3),
                        x2: buffer.readUInt8(cursor + v + 5),
                        y2: buffer.readUInt8(cursor + v + 6),
                        z2: buffer.readUInt8(cursor + v + 7)
                    }
                )
                break
        }
        v += 8
    }
    return index_buffer
}

exports.read_visual_vert_buffer = function ({ buffer, cursor, count } = {}) {
    let vert_buffer = []
    for (v = 0; v < count; v++) {
        vert_buffer.push(
            {
                x: buffer.readInt16BE(cursor + v),
                y: buffer.readInt16BE(cursor + v + 2),
                z: buffer.readInt16BE(cursor + v + 4),
                uv_x: buffer.readInt16BE(cursor + v + 8),
                uv_y: buffer.readInt16BE(cursor + v + 10),
                v_color: [
                    buffer.readUInt8(cursor + v + 12),
                    buffer.readUInt8(cursor + v + 13),
                    buffer.readUInt8(cursor + v + 14),
                    buffer.readUInt8(cursor + v + 15)
                ]
            }
        )
    }
    return vert_buffer
}

exports.read_mesh_group = function ({ buffer, cursor } = {}) {
    let mesh = {
        collision: {
            data: exports.read_collision_data({ buffer, cursor: buffer.readUInt32BE(cursor + 4) }),
            vert_strips: exports.read_collision_vert_strips({ buffer, cursor: buffer.readUInt32BE(cursor + 36), count: buffer.readInt16BE(cursor + 32) }),
            vert_buffer: exports.read_collision_vert_buffer({ buffer, cursor: buffer.readUInt32BE(cursor + 44), count: buffer.readInt16BE(cursor + 56) }),
        },
        visuals: {
            material: exports.read_mat({ buffer, cursor: buffer.readUInt32BE(cursor) }),
            index_buffer: exports.read_visual_index_buffer({ buffer, cursor: buffer.readUInt32BE(cursor + 48) }),
            vert_buffer: exports.read_visual_vert_buffer({ buffer, cursor: buffer.readUInt32BE(cursor + 52), count: buffer.readInt16BE(cursor + 58) }),
            group_parent: buffer.readUInt32BE(cursor + 40),
            group_count: buffer.readInt16BE(cursor + 62)
        },
        min_x: buffer.readFloatBE(cursor + 8),
        min_y: buffer.readFloatBE(cursor + 12),
        min_z: buffer.readFloatBE(cursor + 16),
        max_x: buffer.readFloatBE(cursor + 20),
        max_y: buffer.readFloatBE(cursor + 24),
        max_z: buffer.readFloatBE(cursor + 28),
        vert_strip_count: buffer.readInt16BE(cursor + 32),
        vert_strip_default: buffer.readInt16BE(cursor + 34)
    }

    return mesh
}

exports.read_node = function ({ buffer, cursor, model } = {}) {
    console.log(cursor)
    let node = {
        id: cursor,
        head: [
            buffer.readInt32BE(cursor),
            buffer.readInt32BE(cursor + 4),
            buffer.readInt32BE(cursor + 8),
            buffer.readInt32BE(cursor + 12),
            buffer.readInt32BE(cursor + 16)
        ],
        children: []
    }

    if (model.AltN && model.AltN.includes(cursor)) {
        node.AltN = true
    }
    if (model.header.includes(cursor)) {
        node.header = model.header.map((h, i) => h == cursor ? i : -1).filter(h => h > -1)
    }

    let mesh_group = false
    switch (buffer.readInt32BE(cursor)) {
        case 12388:
            mesh_group = true
            node = {
                ...node,
                min_x: buffer.readFloatBE(cursor + 28),
                min_y: buffer.readFloatBE(cursor + 32),
                min_z: buffer.readFloatBE(cursor + 36),
                max_x: buffer.readFloatBE(cursor + 40),
                max_y: buffer.readFloatBE(cursor + 44),
                max_z: buffer.readFloatBE(cursor + 48)
            }
            break
        case 53349:
            node.xyz = {
                x1: buffer.readFloatBE(cursor + 76),
                y1: buffer.readFloatBE(cursor + 80),
                z1: buffer.readFloatBE(cursor + 84)
            }
        case 53348:
            node.xyz = {
                ...node.xyz,
                ax: buffer.readFloatBE(cursor + 28),
                ay: buffer.readFloatBE(cursor + 32),
                az: buffer.readFloatBE(cursor + 36),
                bx: buffer.readFloatBE(cursor + 40),
                by: buffer.readFloatBE(cursor + 44),
                bz: buffer.readFloatBE(cursor + 48),
                cx: buffer.readFloatBE(cursor + 52),
                cy: buffer.readFloatBE(cursor + 56),
                cz: buffer.readFloatBE(cursor + 60),
                x: buffer.readFloatBE(cursor + 64),
                y: buffer.readFloatBE(cursor + 68),
                z: buffer.readFloatBE(cursor + 72),
            }
            break
        case 53350:
            node['53350'] = {
                unk1: buffer.readInt32BE(cursor + 28),
                unk2: buffer.readInt32BE(cursor + 32),
                unk3: buffer.readInt32BE(cursor + 36),
                unk4: buffer.readFloatBE(cursor + 40)
            }
            break
        case 20582:
            node.xyz = {
                f1: buffer.readFloatBE(cursor + 28),
                f2: buffer.readFloatBE(cursor + 32),
                f3: buffer.readFloatBE(cursor + 36),
                f4: buffer.readFloatBE(cursor + 40),
                f5: buffer.readFloatBE(cursor + 44),
                f6: buffer.readFloatBE(cursor + 48),
                f7: buffer.readFloatBE(cursor + 52),
                f8: buffer.readFloatBE(cursor + 56),
                f9: buffer.readFloatBE(cursor + 60),
                f10: buffer.readFloatBE(cursor + 64),
                f11: buffer.readFloatBE(cursor + 68)
            }
            break
    }

    let child_count = buffer.readInt32BE(cursor + 20)
    let child_start = buffer.readUInt32BE(cursor + 24)
    for (let i = 0; i < child_count; i++) {
        let child_address = buffer.readUInt32BE(child_start + i * 4)
        if (!child_address) {
            continue
        }
        if (mesh_group) {
            node.children.push(exports.read_mesh_group({ buffer, cursor: child_address }))
        } else {
            node.children.push(exports.read_node({ buffer, cursor: child_address, model }))
        }
    }
    //console.log(node)
    return node
}

exports.read_model = function ({ buffer, index } = {}) {
    let model = {}
    let cursor = exports.read_header({ buffer, model, index })
    model.nodes = [exports.read_node({ buffer, cursor, model })]
    return model
}

exports.write_triggers = function ({ cursor, trigger, hl, buf } = {}) {
    //write pointer to next trigger
    exports.highlight({ cursor, hl })
    cursor = buf.writeInt32BE(cursor + 4, cursor)
    cursor = buf.writeFloatBE(trigger.x * xStretch + xOffset, cursor)
    cursor = buf.writeFloatBE(trigger.y * yStretch + yOffset, cursor)
    cursor = buf.writeFloatBE(trigger.z * zStretch + zOffset + trigger.y * slope, cursor)
    cursor = buf.writeFloatBE(trigger.vx, cursor)
    cursor = buf.writeFloatBE(trigger.vy, cursor)
    cursor = buf.writeFloatBE(trigger.vz, cursor)
    cursor = buf.writeFloatBE(trigger.width * xStretch, cursor)
    cursor = buf.writeFloatBE(trigger.height * zStretch, cursor)
    triggerkeeper.push({ original: trigger.target, address: cursor })
    exports.highlight({ cursor, hl }) //trigger.target
    cursor += 4
    cursor = buf.writeInt16BE(trigger.flag, cursor) //trigger.flag
    cursor += 2
    return cursor
}

exports.write_collision_data = function ({ cursor, data, hl, buf } = {}) {
    buf.writeInt32BE(cursor, headstart + 4)
    cursor = buf.writeInt16BE(data.unk, cursor) //data.unk
    cursor = buf.writeUInt8(data.fog.flag, cursor) //data.fog.flag
    cursor = buf.writeUInt8(data.fog.r, cursor) //data.fog.r
    cursor = buf.writeUInt8(data.fog.g, cursor) //data.fog.g
    cursor = buf.writeUInt8(data.fog.b, cursor) //data.fog.b
    cursor = buf.writeInt16BE(data.fog.start, cursor) //data.fog.start
    cursor = buf.writeInt16BE(data.fog.end, cursor) //data.fog.end
    cursor = buf.writeInt16BE(data.lights.flag, cursor) //data.lights.flag
    cursor = buf.writeUInt8(data.lights.ambient_r, cursor) //data.lights.ambient_r
    cursor = buf.writeUInt8(data.lights.ambient_g, cursor) //data.lights.ambient_g
    cursor = buf.writeUInt8(data.lights.ambient_b, cursor) //data.lights.ambient_b
    cursor = buf.writeUInt8(data.lights.r, cursor) //data.lights.r
    cursor = buf.writeUInt8(data.lights.g, cursor) //data.lights.g
    cursor = buf.writeUInt8(data.lights.b, cursor) //data.lights.b
    cursor = buf.writeUInt8(data.lights.unk1, cursor) //data.lights.unk1
    cursor = buf.writeUInt8(data.lights.unk2, cursor) //data.lights.unk2
    cursor = buf.writeFloatBE(data.lights.x, cursor) //data.lights.x
    cursor = buf.writeFloatBE(data.lights.y, cursor) //data.lights.y
    cursor = buf.writeFloatBE(data.lights.z, cursor) //data.lights.z
    cursor = buf.writeFloatBE(data.lights.unk3, cursor) //data.lights.unk3
    cursor = buf.writeFloatBE(data.lights.unk4, cursor) //data.lights.unk4
    cursor = buf.writeFloatBE(data.lights.unk5, cursor) //data.lights.unk5
    cursor = buf.writeInt32BE(data.flags, cursor) //data.flags
    cursor = buf.writeInt32BE(data.unk2, cursor) //data.unk2
    cursor = buf.writeInt32BE(data.unload, cursor) //data.unload
    cursor = buf.writeInt32BE(data.load, cursor)//data.load

    if (data?.triggers?.length) {
        for (let t = 0; t < data.triggers.length; t++) {
            cursor = exports.collision_trigger({ cursor, trigger: data.triggers[t] })
        }
    }
    exports.highlight({ cursor, hl }) //end with blank pointer since there doesn't seem to be a value for how many triggers exist
    cursor += 4
    return cursor
}

exports.write_vert_buffer = function ({ cursor, buffer, buf } = {}) {
    buf.writeInt32BE(cursor, headstart + 52)
    for (let i = 0; i < buffer.length; i++) {
        if (bufferpointers[i]) {
            buf.writeInt32BE(cursor, bufferpointers[i])
        }

        let x = buffer[i].x
        let y = buffer[i].y
        let z = buffer[i].z
        x = x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0)
        y = y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0)
        z = z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + y * slope

        cursor = buf.writeInt16BE(Math.min(!skybox ? x : buffer[i].x), cursor)
        cursor = buf.writeInt16BE(Math.min(!skybox ? y : buffer[i].y), cursor)
        cursor = buf.writeInt16BE(Math.min(!skybox ? z : buffer[i].z), cursor)

        exports.adjustBB('x', x, bb)
        exports.adjustBB('y', y, bb)
        exports.adjustBB('z', z, bb)

        cursor += 2
        cursor = buf.writeInt16BE(buffer[i].uv_x, cursor)
        cursor = buf.writeInt16BE(buffer[i].uv_y, cursor)

        cursor = buf.writeUInt8(buffer[i].v_color[0], cursor)
        cursor = buf.writeUInt8(buffer[i].v_color[1], cursor)
        cursor = buf.writeUInt8(buffer[i].v_color[2], cursor)
        cursor = buf.writeUInt8(buffer[i].v_color[3], cursor)
    }
    return cursor
}

exports.adjustBB = function ({ axis, value, bb } = {}) {
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

exports.write_node = function ({ node, start, id, parent, skybox } = {}) {
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
        let child_count = node.childlist.length
        let childlist = null
        if (child_count) {
            //write number of children
            cursor = buf.writeInt32BE(child_count, cursor)
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

        if (child_count) {
            if (node.head[0] == 20581) {
                cursor += 4
            }
            //write pointer to this child list
            buf.writeInt32BE(cursor, childlist)
            let children = node.children
            //keep list of where children pointers should go
            for (let c = 0; c < child_count; c++) {
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
            for (let c = 0; c < child_count; c++) {
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

                        cursor = buf.writeInt16BE((node.visuals.material.texture_data.tex_index > 1014 && node.visuals.material.texture_data.tex_index < 1039) ? 3 : node.visuals.material.texture_data.format, cursor)
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
                x = x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0)
                y = y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0)
                z = z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + y * slope

                cursor = buf.writeInt16BE(Math.min(!skybox ? x : node.visuals.vert_buffer[i].x), cursor)
                cursor = buf.writeInt16BE(Math.min(!skybox ? y : node.visuals.vert_buffer[i].y), cursor)
                cursor = buf.writeInt16BE(Math.min(!skybox ? z : node.visuals.vert_buffer[i].z), cursor)

                adjustBB('x', x, bb)
                adjustBB('y', y, bb)
                adjustBB('z', z, bb)

                cursor += 2
                cursor = buf.writeInt16BE(node.visuals.vert_buffer[i].uv_x, cursor)
                cursor = buf.writeInt16BE(node.visuals.vert_buffer[i].uv_y, cursor)

                cursor = buf.writeUInt8(node.visuals.vert_buffer[i].v_color[0], cursor)
                cursor = buf.writeUInt8(node.visuals.vert_buffer[i].v_color[1], cursor)
                cursor = buf.writeUInt8(node.visuals.vert_buffer[i].v_color[2], cursor)
                cursor = buf.writeUInt8(node.visuals.vert_buffer[i].v_color[3], cursor)

            }
        }

        //  COLLISION DATA

        if (node.collision.data) { //|| node.collision.vertex_count
            cursor = exports.collision_data(cursor, node.collision.data)
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

exports.write_model = function () {
    //writes an entire model to the buffer

    let cursor = 0
    let buf = Buffer.alloc(1000000)
    let hl = Buffer.alloc(400000)

    let rep = replacements[index]
    let animkeeper = []
    let altnkeeper = []
    let headkeeper = []
    let childkeeper = []
    let triggerkeeper = []
    let animlist = null
    let header = []
    let skyboxid = rep.header.head[2]
    exports.writeNode()
    cursor += buf.write(rep.extension, cursor)
    header.push(rep.extension)
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