
const fs = require('fs');

exports.highlight = function ({ cursor, hl } = {}) {
    //this function is called whenever an address need to be 'highlighted' because it is a pointer
    //every model begins with a pointer map where each bit represents 4 bytes in the following model 
    //if the bit is 1, that corresponding DWORD is to be read as a pointer
    let highlightoffset = Math.floor(cursor / 32)
    let bit = 2 ** (7 - Math.floor((cursor % 32) / 4))
    let highlight = hl.readUInt8(highlightoffset)
    hl.writeUInt8((highlight | bit), highlightoffset)
}

exports.read_Data = function ({ buffer, cursor, model } = {}) {
    model.Data = { LStr: [], other: [] }
    const size = buffer.readUInt32BE(cursor)
    cursor += 4
    for (let i = 0; i < size; i++) {
        if (buffer.toString('utf8', cursor, cursor + 4) == 'LStr') {
            cursor += 4
            model.Data.LStr.push([buffer.readFloatBE(cursor), buffer.readFloatBE(cursor + 4), buffer.readFloatBE(cursor + 8)])
            cursor += 12
            i += 3
        } else {
            model.Data.other.push(buffer.readUInt32BE(cursor))
            cursor += 4
        }
    }
    return cursor
}

exports.write_Data = function ({ buffer, cursor, model } = {}) {
    cursor += buffer.write('Data', cursor)
    if (model.Data.LStr) {
        //write size
        cursor = buffer.writeUInt32BE(model.Data.LStr.length, cursor)
        for (let i = 0; i < model.Data.LStr.length; i++) {
            let LStr = model.Data.LStr[i]
            cursor += buffer.write('LStr', cursor)
            for (let j = 0; j < LStr.length; j++) {
                cursor = buffer.writeFloatBE(LStr[j], cursor)
            }
        }
    } else {
        //write size
        cursor = buffer.writeUInt32BE(model.Data.other.length, cursor)
        for (let i = 0; i < model.Data.other.length; i++) {
            cursor = buffer.writeUInt32BE(model.Data.other[i], cursor)
        }
    }
    return cursor
}

exports.read_Anim = function ({ buffer, cursor, model } = {}) {
    model.Anim = []
    let anim = buffer.readUInt32BE(cursor)
    while (anim) {
        model.Anim.push(exports.read_animation({ buffer, cursor: anim }))
        cursor += 4
        anim = buffer.readUInt32BE(cursor)
    }
    return cursor + 4
}

exports.write_Anim = function ({ buffer, cursor, model } = {}) {
    cursor += buffer.write('Anim', cursor)
    for (let i = 0; i < model.Anim.length; i++) {
        highlight(cursor)
        cursor += 4
    }
    highlight(cursor)
    cursor += 4
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

exports.write_AltN = function ({ buffer, cursor, model } = {}) {
    cursor += buffer.write('AltN', cursor)
    for (let i = 0; i < model.AltN.length; i++) {
        highlight(cursor)
        cursor += 4
    }

    highlight(cursor)
    cursor += 4

    return cursor
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

exports.write_header = function ({ buffer, cursor, model, hl } = {}) {
    cursor += buffer.write(model.ext, cursor)
    for (let i = 0; i < model.header.length; i++) {
        highlight(cursor)
        cursor = buffer.writeInt32BE(model.header[i], cursor)
    }
    cursor = buffer.writeInt32BE(-1, cursor)

    if (model.Data) {
        cursor = exports.write_Data({ buffer, cursor, model, hl })
    }
    if (model.Anim) {
        cursor = exports.write_Anim({ buffer, cursor, model, hl })
    }
    if (model.AltN) {
        cursor = exports.write_AltN({ buffer, cursor, model, hl })
    }

    cursor += buffer.write('HEnd', cursor)
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

exports.write_mat = function ({ buffer, cursor, mat } = {}) {
    if (!mat) {
        return cursor
    }
    let mat_addr = cursor
    cursor = buffer.writeInt32BE(mat.format, cursor)
    cursor += 4
    highlight(cursor)
    cursor += 4
    highlight(cursor)
    cursor += 4
    if (mat.texture) {
        buffer.writeUInt32BE(cursor, mat_addr + 8)
        cursor = exports.write_mat_texture({ buffer, cursor, texture: mat.texture })
    }
    if (mat.unk) {
        buffer.writeUInt32BE(cursor, mat_addr + 12)
        cursor = exports.write_mat_unk({ buffer, cursor, unk: mat.unk })
    }
    return cursor
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
        unk_pointers: [],
        unk9: buffer.readInt16BE(cursor + 56),      //2560, 2815 is used when cursor index is blank
        tex_index: buffer.readInt16BE(cursor + 58),
    }

    for (let i = 0; i < 6; i++) {
        let pointer = buffer.readInt32BE(cursor + 28 + i * 4)
        if (pointer) {
            mat.unk_pointers.push({
                unk0: buffer.readInt32BE(pointer),
                unk1: buffer.readInt32BE(pointer + 4),
                unk2: buffer.readInt32BE(pointer + 8),
                unk3: buffer.readInt16BE(pointer + 12),
                unk4: buffer.readInt16BE(pointer + 14),
            })
        } else {
            i = 6
        }
    }

    return mat
}

exports.write_mat_texture = function ({ buffer, cursor, texture } = {}) {
    if (!texture) {
        return cursor
    }

    cursor = buffer.writeInt32BE(texture.unk0, cursor)             //0, 1, 65, 73
    cursor = buffer.writeInt16BE(texture.unk1, cursor)       //width * 4
    cursor = buffer.writeInt16BE(texture.unk2, cursor)       //height * 4
    cursor = buffer.writeInt32BE(texture.unk3, cursor)         //always 0
    cursor = buffer.writeInt16BE(texture.format, cursor)     //3, 512, 513, 1024
    cursor = buffer.writeInt16BE(texture.unk4, cursor)       //0, 4
    cursor = buffer.writeInt16BE(texture.width, cursor)      //pixel width
    cursor = buffer.writeInt16BE(texture.height, cursor)    //pixel height
    cursor = buffer.writeInt16BE(texture.unk5, cursor)      //width * 512 (unsigned)
    cursor = buffer.writeInt16BE(texture.unk6, cursor)      //height * 512 (unsigned)
    cursor = buffer.writeInt16BE(texture.unk7, cursor)       //0 when unk4 is 4, 
    cursor = buffer.writeInt16BE(texture.unk8, cursor)

    let unk_pointer = cursor
    for (let i = 0; i < 6; i++) {
        highlight(cursor)
        cursor += 4
    }

    cursor = buffer.writeInt16BE(texture.unk9, cursor)      //2560, 2815 is used when cursor index is blank
    cursor = buffer.writeInt16BE(texture.tex_index, cursor)

    for (let i = 0; i < texture.unk_pointers.length; i++) {
        let pointer = texture.unk_pointers[i]

        buffer.writeUInt32BE(cursor, unk_pointer + i * 4)
        cursor = buffer.writeInt32BE(pointer.unk0, cursor)
        cursor = buffer.writeInt32BE(pointer.unk1, cursor)
        cursor = buffer.writeInt32BE(pointer.unk2, cursor)
        cursor = buffer.writeInt16BE(pointer.unk3, cursor)
        cursor = buffer.writeInt16BE(pointer.unk4, cursor)
    }

    return cursor
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

exports.write_mat_unk = function ({ buffer, cursor, unk } = {}) {

    cursor = buffer.readInt16BE(unk.unk0, cursor) //always 0
    cursor = buffer.writeInt16BE(unk.unk1, cursor) //0, 1, 8, 9   
    cursor = buffer.writeInt16BE(unk.unk2, cursor) //1, 2
    cursor = buffer.writeInt16BE(unk.unk3, cursor) //287, 513, 799, 1055, 1537, 7967
    cursor = buffer.writeInt16BE(unk.unk4, cursor) //287, 799, 1055, 3329, 7939, 7940
    cursor = buffer.writeInt16BE(unk.unk5, cursor) //263, 513, 775, 1031, 1537, 1795, 1799
    cursor = buffer.writeInt16BE(unk.unk6, cursor) //1, 259, 263, 775, 1031, 1793, 1795, 1796, 1798, 
    cursor = buffer.writeInt16BE(unk.unk7, cursor) //31, 287, 799, 1055, 7967
    cursor = buffer.writeInt16BE(unk.unk8, cursor) //31, 799, 1055, 7936, 7940
    cursor = buffer.writeInt16BE(unk.unk9, cursor) //7, 1799
    cursor = buffer.writeInt16BE(unk.unk10, cursor) //775, 1031, 1792, 1796, 1798
    cursor = buffer.writeInt16BE(unk.unk11, cursor) //always 0
    cursor = buffer.writeInt16BE(unk.unk12, cursor) //-14336, 68, 3080
    cursor = buffer.writeInt16BE(unk.unk13, cursor) //0, 1, 8200, 8312
    cursor = buffer.writeInt16BE(unk.unk14, cursor) //16, 17, 770
    cursor = buffer.writeInt16BE(unk.unk15, cursor) //120, 8200, 8248, 8296, 8312, 16840, 16856, 16960, 17216, 18760, 18768, 18808, 18809, 18888, 18904, 18936, 19280, 20048
    cursor = buffer.writeInt16BE(unk.unk16, cursor) //probably 0?
    cursor = buffer.writeUInt8(unk.r, cursor)
    cursor = buffer.writeUInt8(unk.g, cursor)
    cursor = buffer.writeUInt8(unk.b, cursor)
    cursor = buffer.writeUInt8(unk.t, cursor)
    cursor = buffer.writeInt16BE(unk.unk17, cursor)
    cursor = buffer.writeInt16BE(unk.unk18, cursor)
    cursor = buffer.writeInt16BE(unk.unk19, cursor)
    cursor = buffer.writeInt16BE(unk.unk20, cursor)
    cursor = buffer.writeInt16BE(unk.unk21, cursor)
    cursor = buffer.writeInt16BE(unk.unk22, cursor)
    cursor = buffer.writeInt16BE(unk.unk23, cursor)

    return cursor
}

exports.read_animation = function ({ buffer, cursor } = {}) {
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

//write animation

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

exports.write_collision_vert_strips = function ({ buffer, cursor, vert_strips } = {}) {
    if (!vert_strips || !vert_strips.length) {
        return cursor
    }
    for (v = 0; v < vert_strips.length; v++) {
        cursor = buffer.writeInt32BE(vert_strips[v], cursor)
    }
    return cursor
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

exports.write_collision_vert_buffer = function ({ buffer, cursor, vert_buffer } = {}) {
    if (!vert_buffer || !vert_buffer.length) {
        return cursor
    }
    // if (model.model == 114) {
    //     for (v = 0; v < header.collision.vertex_count * 3; v += 3) {
    //         header.collision.vert_buffer.push(
    //             [data[data_keys[vert_buffer + v]].float, data[data_keys[vert_buffer + v + 1]].float, data[data_keys[vert_buffer + v + 2]].float]
    //         )
    //     }
    // }
    for (v = 0; v < vert_buffer.length; v++) {
        let vert = vert_buffer[v]
        for (let i = 0; i < vert.length; i++) {
            cursor = buffer.writeInt16BE(vert[i], cursor)
        }
    }
    return cursor
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

exports.write_collision_triggers = function ({ buffer, cursor, triggers, hl } = {}) {
    //write pointer to next trigger
    for (let i = 0; i < triggers.length; i++) {
        let trigger = triggers[i]
        exports.highlight({ cursor, hl })
        cursor = buffer.writeInt32BE(cursor + 4, cursor)
        cursor = buffer.writeFloatBE(trigger.x * xStretch + xOffset, cursor)
        cursor = buffer.writeFloatBE(trigger.y * yStretch + yOffset, cursor)
        cursor = buffer.writeFloatBE(trigger.z * zStretch + zOffset + trigger.y * slope, cursor)
        cursor = buffer.writeFloatBE(trigger.vx, cursor)
        cursor = buffer.writeFloatBE(trigger.vy, cursor)
        cursor = buffer.writeFloatBE(trigger.vz, cursor)
        cursor = buffer.writeFloatBE(trigger.width * xStretch, cursor)
        cursor = buffer.writeFloatBE(trigger.height * zStretch, cursor)
        //triggerkeeper.push({ original: trigger.target, address: cursor })
        exports.highlight({ cursor, hl }) //trigger.target
        cursor += 4
        cursor = buffer.writeInt16BE(trigger.flag, cursor) //trigger.flag
        cursor += 2
    }
    exports.highlight({ cursor, hl }) //end with blank pointer to mark end of linked list
    cursor += 4
    return cursor
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

exports.write_collision_data = function ({ buffer, cursor, data, hl } = {}) {
    buffer.writeInt32BE(cursor, headstart + 4)
    cursor = buffer.writeInt16BE(data.unk, cursor) //data.unk
    cursor = buffer.writeUInt8(data.fog.flag, cursor) //data.fog.flag
    cursor = buffer.writeUInt8(data.fog.r, cursor) //data.fog.r
    cursor = buffer.writeUInt8(data.fog.g, cursor) //data.fog.g
    cursor = buffer.writeUInt8(data.fog.b, cursor) //data.fog.b
    cursor = buffer.writeInt16BE(data.fog.start, cursor) //data.fog.start
    cursor = buffer.writeInt16BE(data.fog.end, cursor) //data.fog.end
    cursor = buffer.writeInt16BE(data.lights.flag, cursor) //data.lights.flag
    cursor = buffer.writeUInt8(data.lights.ambient_r, cursor) //data.lights.ambient_r
    cursor = buffer.writeUInt8(data.lights.ambient_g, cursor) //data.lights.ambient_g
    cursor = buffer.writeUInt8(data.lights.ambient_b, cursor) //data.lights.ambient_b
    cursor = buffer.writeUInt8(data.lights.r, cursor) //data.lights.r
    cursor = buffer.writeUInt8(data.lights.g, cursor) //data.lights.g
    cursor = buffer.writeUInt8(data.lights.b, cursor) //data.lights.b
    cursor = buffer.writeUInt8(data.lights.unk1, cursor) //data.lights.unk1
    cursor = buffer.writeUInt8(data.lights.unk2, cursor) //data.lights.unk2
    cursor = buffer.writeFloatBE(data.lights.x, cursor) //data.lights.x
    cursor = buffer.writeFloatBE(data.lights.y, cursor) //data.lights.y
    cursor = buffer.writeFloatBE(data.lights.z, cursor) //data.lights.z
    cursor = buffer.writeFloatBE(data.lights.unk3, cursor) //data.lights.unk3
    cursor = buffer.writeFloatBE(data.lights.unk4, cursor) //data.lights.unk4
    cursor = buffer.writeFloatBE(data.lights.unk5, cursor) //data.lights.unk5
    cursor = buffer.writeInt32BE(data.flags, cursor) //data.flags
    cursor = buffer.writeInt32BE(data.unk2, cursor) //data.unk2
    cursor = buffer.writeInt32BE(data.unload, cursor) //data.unload
    cursor = buffer.writeInt32BE(data.load, cursor)//data.load

    cursor = exports.write_collision_triggers({ cursor, trigger: data.triggers })

    return cursor
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

exports.write_visual_index_buffer = function ({ buffer, cursor, index_buffer } = {}) {
    if (!index_buffer || !index_buffer.length) {
        return cursor
    }
    if (cursor % 8 !== 0) { //must byte align this section
        cursor += 4
    }
    let v = 0
    for (let i = 0; i < index_buffer.length; i++) {
        let index = index_buffer[i]
        let type = index.type
        cursor = buffer.writeUInt8(type, cursor + v)
        switch (type) {
            case 1:
                buffer.writeUInt8(index.unk1, cursor + v + 1)
                buffer.writeUInt8(index.unk2, cursor + v + 2)
                buffer.writeUInt8(index.unk3, cursor + v + 3)
                exports.highlight({ cursor: cursor + v + 4, hl })
                buffer.writeUInt32BE(index.start, cursor + v + 4)
                break
            case 3:
                buffer.writeUInt8(index.unk, cursor + v + 7)
                break
            case 5:
                buffer.writeUInt8(index.x, cursor + v + 1)
                buffer.writeUInt8(index.y, cursor + v + 2)
                buffer.writeUInt8(index.z, cursor + v + 3)
                break
            case 6:
                buffer.writeUInt8(index.x1, cursor + v + 1)
                buffer.writeUInt8(index.y1, cursor + v + 2)
                buffer.writeUInt8(index.z1, cursor + v + 3)
                buffer.writeUInt8(index.x2, cursor + v + 5)
                buffer.writeUInt8(index.y2, cursor + v + 6)
                buffer.writeUInt8(index.z2, cursor + v + 7)
                break
        }
        v += 8
    }
    cursor += v
    cursor = buf.writeUInt8(223, cursor)
    cursor += 7
    return cursor
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

exports.write_visual_vert_buffer = function ({ buffer, cursor, buf } = {}) {
    buf.writeInt32BE(cursor, headstart + 52)
    for (let i = 0; i < buffer.length; i++) {
        if (bufferpointers[i]) {
            buf.writeInt32BE(cursor, bufferpointers[i])
        }

        let x = buffer[i].x
        let y = buffer[i].y
        let z = buffer[i].z
        // x = x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0)
        // y = y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0)
        // z = z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + y * slope

        exports.adjustBB('x', x, bb)
        exports.adjustBB('y', y, bb)
        exports.adjustBB('z', z, bb)

        cursor = buf.writeInt16BE(Math.min(!skybox ? x : buffer[i].x), cursor)
        cursor = buf.writeInt16BE(Math.min(!skybox ? y : buffer[i].y), cursor)
        cursor = buf.writeInt16BE(Math.min(!skybox ? z : buffer[i].z), cursor)
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

exports.write_mesh_group = function ({ buffer, cursor, mesh_group, hl } = {}) {
    let headstart = cursor
    cursor += 64

    if (mesh_group.collision.vert_strips) {
        exports.highlight(headstart + 36, hl)
        buffer.writeUInt32BE(cursor, headstart + 36)
        cursor = exports.write_collision_vert_strips({ buffer, cursor, vert_strips: mesh_group.collision.vert_strips })
    }
    if (mesh_group.collision.vert_buffer) {
        exports.highlight(headstart + 44, hl)
        buffer.writeUInt32BE(cursor, headstart + 44)
        cursor = exports.write_collision_vert_buffer({ buffer, cursor, vert_buffer: mesh_group.collision.vert_buffer })
    }
    if (mesh_group.visuals.material) {
        exports.highlight(headstart + 0, hl)
        buffer.writeUInt32BE(cursor, headstart + 0)
        cursor = exports.write_mat({ buffer, cursor, mat: mesh_group.mat })
    }
    if (mesh_group.visuals.index_buffer) {
        exports.highlight({ cursor: headstart + 0, hl })
        buffer.writeInt32BE(cursor, headstart + 48)
        cursor = exports.write_visual_index_buffer({ buffer, cursor, index_buffer: mesh_group.visuals.index_buffer })
    }
    if (mesh_group.visuals.vert_buffer) {
        exports.highlight(headstart + 52, hl)
        buffer.writeUInt32BE(cursor, headstart + 52)
        cursor = exports.write_visual_vert_buffer({ buffer, cursor, buf: mesh_group.visuals.vert_buffer })
    }
    if (mesh_group.collision.data) {
        exports.highlight(headstart + 4, hl)
        buf.writeUInt32BE(cursor, headstart + 4)
        cursor = exports.write_collision_data({ buffer, cursor, data: mesh_group.collision.data, hl })
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

    return cursor
}

exports.read_node = function ({ buffer, cursor, model } = {}) {
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

//write node

exports.read_model = function ({ buffer, index } = {}) {
    let model = {}
    let size = 0
    let cursor = exports.read_header({ buffer, model, index, size })
    model.nodes = [exports.read_node({ buffer, cursor, model })]
    return model
}

exports.write_model = function ({ model } = {}) {
    let buffer = Buffer.alloc(1000000)
    let hl = Buffer.alloc(1000000)
    let cursor = 0
    cursor = exports.write_header({ buffer, cursor, hl, model })
    for (let i = 0; i < model.nodes.length; i++) {
        cursor = exports.write_node({ buffer, cursor, hl, node: model.nodes[i] })
    }
    return cursor
}

exports.read_block = function ({ file, map } = {}) {
    let asset_count = file.readUInt32BE(0)
    let assets = []
    for (let i = 0; i < asset_count; i++) {
        const asset_start = file.readUInt32BE((map ? 8 : 0) + i * (map ? 8 : 4))
        const asset_end = file.readUInt32BE((map ? 12 : 4) + i * (map ? 8 : 4))
        const asset = file.slice(asset_start, asset_end)
        assets.push(asset)
    }
    return assets
}

exports.write_block = function ({ asset_buffers, hl_buffers, map } = {}) {
    let length = asset_buffers.length
    let index = Buffer.alloc((length * (map ? 2 : 1) + 2) * 4)
    let block = []
    block.push(index)

    index.writeUInt32BE(length, 0) //write total number of assets
    let cursor = index.byteLength
    for (let i = 0; i < length; i++) {
        if (map) {
            index.writeUInt32BE(cursor, 4 + (i * 2) * 4)
            cursor += hl_buffers[i].byteLength
            block.push(hl_buffers[i])
        }

        index.writeUInt32BE(cursor, 4 + (map ? (i * 2 + 1) : i) * 4)
        cursor += asset_buffers[i].byteLength
        block.push(asset_buffers[i])
    }
    index.writeUInt32BE(cursor, (length * 2 + 1) * 4) //end of block offset

    return Buffer.concat(block)
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
