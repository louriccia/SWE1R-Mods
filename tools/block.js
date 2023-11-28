const Jimp = require('jimp');
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
        model.Anim.push(exports.read_animation({ buffer, cursor: anim, model }))
        cursor += 4
        anim = buffer.readUInt32BE(cursor)
    }
    return cursor + 4
}

exports.write_Anim = function ({ buffer, cursor, model, hl } = {}) {
    cursor += buffer.write('Anim', cursor)
    for (let i = 0; i < model.Anim.length; i++) {
        exports.highlight({ cursor, hl })
        cursor += 4
    }
    exports.highlight({ cursor, hl })
    cursor += 4
    return cursor
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

exports.write_AltN = function ({ buffer, cursor, model, hl } = {}) {
    //the length of AltN might need to be asserted based on model extension?
    cursor += buffer.write('AltN', cursor)
    for (let i = 0; i < model.AltN.length; i++) {
        exports.highlight({ cursor, hl })
        if (model.ext == 'Podd') {
            buffer.writeUInt32BE(model.AltN[i], cursor)
        }
        cursor += 4
    }

    exports.highlight({ cursor, hl })
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
        exports.highlight({ cursor, hl })
        cursor += 4 //buffer.writeInt32BE(model.header[i], cursor)
    }
    cursor = buffer.writeInt32BE(-1, cursor)
    let header_offsets = { //we'll need these to reference later
        Anim: null,
        AltN: null,
        HEnd: null
    }
    if (model.Data) {
        cursor = exports.write_Data({ buffer, cursor, model })
    }
    if (model.Anim) {
        header_offsets.Anim = cursor + 4
        cursor = exports.write_Anim({ buffer, cursor, model, hl })
    }
    if (model.AltN) {
        header_offsets.AltN = cursor + 4
        cursor = exports.write_AltN({ buffer, cursor, model, hl })
    }

    cursor += buffer.write('HEnd', cursor)
    header_offsets.HEnd = cursor
    return header_offsets
}

exports.read_mat = function ({ buffer, cursor, model } = {}) {
    if (!cursor) {
        return 0
    }
    let mat = {
        id: cursor,
        format: buffer.readInt32BE(cursor),
        texture: exports.read_mat_texture({ buffer, cursor: buffer.readUInt32BE(cursor + 8), model }),
        unk: exports.read_mat_unk({ buffer, cursor: buffer.readInt32BE(cursor + 12) })
    }
    if (!model.mats[cursor]) {
        model.mats[cursor] = mat
    }
    return cursor
}

exports.write_mat = function ({ buffer, cursor, mat_id, hl, model } = {}) {
    if (!mat_id) {
        return cursor
    }
    let mat_addr = cursor
    model.mats[mat_id].write = mat_addr
    let mat = model.mats[mat_id]
    cursor = buffer.writeInt32BE(mat.format, cursor)
    cursor += 12
    if (mat.texture) {
        let tex_id = mat.texture
        exports.highlight({ cursor: mat_addr + 8, hl })
        if (model.textures[tex_id].write) {
            buffer.writeUInt32BE(model.textures[tex_id].write, mat_addr + 8)
        } else {
            buffer.writeUInt32BE(cursor, mat_addr + 8)
            cursor = exports.write_mat_texture({ buffer, cursor, tex_id, hl, model })
        }
    }
    if (mat.unk) {
        exports.highlight({ cursor: mat_addr + 12, hl })
        buffer.writeUInt32BE(cursor, mat_addr + 12)
        cursor = exports.write_mat_unk({ buffer, cursor, unk: mat.unk })
    }
    return cursor
}

exports.read_mat_texture = function ({ buffer, cursor, model } = {}) {
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
    if (!model.textures[cursor]) {
        model.textures[cursor] = mat
    }
    return cursor
}

exports.write_mat_texture = function ({ buffer, cursor, tex_id, hl, model } = {}) {
    let texture = model.textures[tex_id]
    if (!texture) {
        return cursor
    }
    model.textures[tex_id].write = cursor
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
    cursor += 28
    exports.highlight({ cursor, hl })
    cursor = buffer.writeInt16BE(texture.unk9, cursor)      //2560, 2815 is used when cursor index is blank
    cursor = buffer.writeInt16BE(texture.tex_index, cursor)
    cursor += 4
    for (let i = 0; i < texture.unk_pointers.length; i++) {

        let pointer = texture.unk_pointers[i]
        exports.highlight({ cursor: unk_pointer + i * 4, hl })
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
    cursor = buffer.writeInt16BE(unk.unk0, cursor) //always 0
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

exports.read_animation_poses = function ({ buffer, cursor, anim, framecount }) {

    let poses = []


    return poses
}

exports.read_animation = function ({ buffer, cursor, model } = {}) {
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
                    anim.keyframe_poses.push(exports.read_mat_texture({ buffer, cursor: tex, model }))
                }

            }
        }
    }

    return anim
}

exports.write_animation = function ({ buffer, cursor, animation, hl, model } = {}) {
    cursor += 61 * 4
    cursor = buffer.writeFloatBE(animation.float1, cursor)
    cursor = buffer.writeFloatBE(animation.float2, cursor)
    cursor = buffer.writeFloatBE(animation.float3, cursor)
    cursor = buffer.writeInt16BE(animation.flag1, cursor)
    cursor = buffer.writeInt16BE(animation.flag2, cursor)
    cursor = buffer.writeInt32BE(animation.num_keyframes, cursor)
    cursor = buffer.writeFloatBE(animation.float4, cursor)
    cursor = buffer.writeFloatBE(animation.float5, cursor)
    cursor = buffer.writeFloatBE(animation.float6, cursor)
    cursor = buffer.writeFloatBE(animation.float7, cursor)
    cursor = buffer.writeFloatBE(animation.float8, cursor)
    exports.highlight({ cursor, hl })
    let keyframe_times = cursor
    cursor += 4
    exports.highlight({ cursor, hl })
    let keyframe_poses = cursor
    cursor += 4
    let anim_target = null
    let flag = animation.flag2
    exports.highlight({ cursor, hl })
    if ([2, 18].includes(flag)) {
        anim_target = cursor
    } else {
        buffer.writeInt32BE(model.node_map[animation.target], cursor)
    }
    cursor += 4
    cursor = buffer.writeInt32BE(animation.unk32, cursor)

    //write keyframe times
    buffer.writeInt32BE(cursor, keyframe_times)
    for (let k = 0; k < animation.keyframe_times.length; k++) {
        cursor = buffer.writeFloatBE(animation.keyframe_times[k], cursor)
    }

    if ([2, 18].includes(flag)) {
        //write target list
        buffer.writeInt32BE(cursor, anim_target)
        exports.highlight({ cursor, hl })
        console.log(animation.target, model.textures)
        cursor = buffer.writeInt32BE(model.mats[animation.target].write, cursor)
        exports.highlight({ cursor, hl })
        cursor += 4
    }

    //write keyframe poses
    buffer.writeInt32BE(cursor, keyframe_poses)

    for (let p = 0; p < animation.keyframe_poses.length; p++) {

        if ([8, 24, 40, 56, 4152].includes(flag)) { //rotation (4)
            for (let f = 0; f < 4; f++) {
                cursor = buffer.writeFloatBE(animation.keyframe_poses[p][f], cursor)
            }
        } else if ([25, 41, 57, 4153].includes(flag)) { //position (3)
            for (let f = 0; f < 3; f++) {
                cursor = buffer.writeFloatBE(animation.keyframe_poses[p][f], cursor)
            }
        } else if ([27, 28].includes(flag)) { //uv_x/uv_y (1)
            cursor = buffer.writeFloatBE(animation.keyframe_poses[p], cursor)
        }
    }
    if ([2, 18].includes(flag)) { //texture
        let texturelist = cursor
        for (let k = 0; k < animation.keyframe_poses.length; k++) {
            exports.highlight({ cursor, hl })
            cursor += 4
        }
        for (let k = 0; k < animation.keyframe_poses.length; k++) {
            let tex_id = animation.keyframe_poses[k]
            if (model.textures[tex_id]?.write) {
                buffer.writeUInt32BE(model.textures[tex_id].write, texturelist + k * 4)
            } else {
                buffer.writeUInt32BE(cursor, texturelist + k * 4)
                cursor = exports.write_mat_texture({ buffer, cursor, tex_id, hl, model })
            }
        }
    }

    return cursor
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
    return (cursor % 4 == 0 ? cursor : cursor + 2)
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
        cursor = buffer.writeFloatBE(trigger.x, cursor)
        cursor = buffer.writeFloatBE(trigger.y, cursor)
        cursor = buffer.writeFloatBE(trigger.z, cursor)
        cursor = buffer.writeFloatBE(trigger.vx, cursor)
        cursor = buffer.writeFloatBE(trigger.vy, cursor)
        cursor = buffer.writeFloatBE(trigger.vz, cursor)
        cursor = buffer.writeFloatBE(trigger.width, cursor)
        cursor = buffer.writeFloatBE(trigger.height, cursor)
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
    cursor = buffer.writeUInt32BE(data.unload, cursor) //data.unload
    cursor = buffer.writeUInt32BE(data.load, cursor)//data.load

    cursor = exports.write_collision_triggers({ buffer, cursor, triggers: data.triggers, hl })

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
                        size: buffer.readUInt8(cursor + v + 3),
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

exports.write_visual_index_buffer = function ({ buffer, cursor, index_buffer, hl } = {}) {
    if (!index_buffer || !index_buffer.length) {
        return cursor
    }
    let v = 0
    for (let i = 0; i < index_buffer.length; i++) {
        let index = index_buffer[i]
        let type = index.type
        buffer.writeUInt8(type, cursor + v)
        switch (type) {
            case 1:
                buffer.writeUInt8(index.unk1, cursor + v + 1)
                buffer.writeUInt8(index.unk2, cursor + v + 2)
                buffer.writeUInt8(index.size, cursor + v + 3)
                exports.highlight({ cursor: cursor + v + 4, hl })
                //buffer.writeUInt32BE(index.start, cursor + v + 4)
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
    cursor = buffer.writeUInt8(223, cursor)
    cursor += 7
    return cursor
}

exports.read_visual_vert_buffer = function ({ buffer, cursor, count } = {}) {
    let vert_buffer = []
    for (v = 0; v < count; v++) {
        vert_buffer.push(
            {
                x: buffer.readInt16BE(cursor + v * 16),
                y: buffer.readInt16BE(cursor + v * 16 + 2),
                z: buffer.readInt16BE(cursor + v * 16 + 4),
                uv_x: buffer.readInt16BE(cursor + v * 16 + 8),
                uv_y: buffer.readInt16BE(cursor + v * 16 + 10),
                v_color: [
                    buffer.readUInt8(cursor + v * 16 + 12),
                    buffer.readUInt8(cursor + v * 16 + 13),
                    buffer.readUInt8(cursor + v * 16 + 14),
                    buffer.readUInt8(cursor + v * 16 + 15)
                ]
            }
        )
    }
    return vert_buffer
}

exports.write_visual_vert_buffer = function ({ buffer, cursor, vert_buffer, index_buffer, index_buffer_addr } = {}) {
    let vert_buffer_addr = cursor
    //write buffer
    for (let i = 0; i < vert_buffer.length; i++) {
        // if (bufferpointers[i]) {
        //     buffer.writeInt32BE(cursor, bufferpointers[i])
        // }
        let x = vert_buffer[i].x
        let y = vert_buffer[i].y
        let z = vert_buffer[i].z
        // x = x * (rep.extension == 'Trak' ? xStretch : 1) + (rep.extension == 'Trak' ? xOffset : 0)
        // y = y * (rep.extension == 'Trak' ? yStretch : 1) + (rep.extension == 'Trak' ? yOffset : 0)
        // z = z * (rep.extension == 'Trak' ? zStretch : 1) + (rep.extension == 'Trak' ? zOffset : 0) + y * slope

        // exports.adjustBB('x', x, bb)
        // exports.adjustBB('y', y, bb)
        // exports.adjustBB('z', z, bb)
        cursor = buffer.writeInt16BE(vert_buffer[i].x, cursor)
        cursor = buffer.writeInt16BE(vert_buffer[i].y, cursor)
        cursor = buffer.writeInt16BE(vert_buffer[i].z, cursor)
        cursor += 2

        cursor = buffer.writeInt16BE(vert_buffer[i].uv_x, cursor)
        cursor = buffer.writeInt16BE(vert_buffer[i].uv_y, cursor)

        cursor = buffer.writeUInt8(vert_buffer[i].v_color[0], cursor)
        cursor = buffer.writeUInt8(vert_buffer[i].v_color[1], cursor)
        cursor = buffer.writeUInt8(vert_buffer[i].v_color[2], cursor)
        cursor = buffer.writeUInt8(vert_buffer[i].v_color[3], cursor)
    }

    //write offsets in index_buffer to this section
    let total = 0
    for (let i = 0; i < index_buffer.length; i++) {
        let index = index_buffer[i]
        if (index.type == 1) {
            buffer.writeUInt32BE(vert_buffer_addr + total, index_buffer_addr + i * 8 + 4)
            total += index.size * 8
        }
    }
    return cursor
}

exports.read_mesh_group = function ({ buffer, cursor, model } = {}) {
    let mesh = {
        collision: {
            data: exports.read_collision_data({ buffer, cursor: buffer.readUInt32BE(cursor + 4) }),
            vert_strips: exports.read_collision_vert_strips({ buffer, cursor: buffer.readUInt32BE(cursor + 36), count: buffer.readInt16BE(cursor + 32) }),
            vert_buffer: exports.read_collision_vert_buffer({ buffer, cursor: buffer.readUInt32BE(cursor + 44), count: buffer.readInt16BE(cursor + 56) }),
        },
        visuals: {
            material: exports.read_mat({ buffer, cursor: buffer.readUInt32BE(cursor), model }),
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

exports.write_mesh_group = function ({ buffer, cursor, mesh, hl, model } = {}) {
    let headstart = cursor
    buffer.writeFloatBE(mesh.min_x, cursor + 8)
    buffer.writeFloatBE(mesh.min_y, cursor + 12)
    buffer.writeFloatBE(mesh.min_z, cursor + 16)
    buffer.writeFloatBE(mesh.max_x, cursor + 20)
    buffer.writeFloatBE(mesh.max_y, cursor + 24)
    buffer.writeFloatBE(mesh.max_z, cursor + 28)
    buffer.writeInt16BE(mesh.vert_strip_count, cursor + 32)
    buffer.writeInt16BE(mesh.vert_strip_default, cursor + 34)
    buffer.writeInt16BE(mesh.collision.vert_buffer.length, cursor + 56)
    buffer.writeInt16BE(mesh.visuals.vert_buffer.length, cursor + 58)
    cursor += 64

    if (mesh.collision.vert_strips) {
        exports.highlight({ cursor: headstart + 36, hl })
        buffer.writeUInt32BE(cursor, headstart + 36)
        cursor = exports.write_collision_vert_strips({ buffer, cursor, vert_strips: mesh.collision.vert_strips })
    }
    if (mesh.collision.vert_buffer) {
        exports.highlight({ cursor: headstart + 44, hl })
        buffer.writeUInt32BE(cursor, headstart + 44)
        cursor = exports.write_collision_vert_buffer({ buffer, cursor, vert_buffer: mesh.collision.vert_buffer })
    }
    if (mesh.visuals.material) {
        exports.highlight({ cursor: headstart + 0, hl })
        let mat_id = mesh.visuals.material
        if (model.mats[mat_id].write) {
            buffer.writeUInt32BE(model.mats[mat_id].write, headstart + 0)
        } else {
            buffer.writeUInt32BE(cursor, headstart + 0)
            cursor = exports.write_mat({ buffer, cursor, mat_id, hl, model })
        }
    }
    let index_buffer_addr = null
    if (mesh.visuals.index_buffer) {
        exports.highlight({ cursor: headstart + 48, hl })
        index_buffer_addr = cursor % 8 == 0 ? cursor : cursor + 4 //this section must be byte-aligned
        buffer.writeInt32BE(index_buffer_addr, headstart + 48)
        cursor = exports.write_visual_index_buffer({ buffer, cursor: index_buffer_addr, index_buffer: mesh.visuals.index_buffer, hl })
    }
    if (mesh.visuals.vert_buffer) {
        exports.highlight({ cursor: headstart + 52, hl })
        buffer.writeUInt32BE(cursor, headstart + 52)
        cursor = exports.write_visual_vert_buffer({ buffer, cursor, vert_buffer: mesh.visuals.vert_buffer, index_buffer: mesh.visuals.index_buffer, index_buffer_addr })
    }
    if (mesh.collision.data) {
        exports.highlight({ cursor: headstart + 4, hl })
        buffer.writeUInt32BE(cursor, headstart + 4)
        cursor = exports.write_collision_data({ buffer, cursor, data: mesh.collision.data, hl })
    }

    //adjust minmax
    // if (rep.extension == 'Trak') {
    //     buffer.writeFloatBE(bb.min_x, minmax)
    //     buffer.writeFloatBE(bb.min_y, minmax + 4)
    //     buffer.writeFloatBE(bb.min_z, minmax + 8)
    //     buffer.writeFloatBE(bb.max_x, minmax + 12)
    //     buffer.writeFloatBE(bb.max_y, minmax + 16)
    //     buffer.writeFloatBE(bb.max_z, minmax + 20)

    //     adjustBB('x', bb.min_x, parent.bb)
    //     adjustBB('x', bb.max_x, parent.bb)
    //     adjustBB('y', bb.min_y, parent.bb)
    //     adjustBB('y', bb.max_y, parent.bb)
    //     adjustBB('z', bb.min_z, parent.bb)
    //     adjustBB('z', bb.max_z, parent.bb)

    //     buffer.writeFloatBE(parent.bb.min_x, parent.bb.address)
    //     buffer.writeFloatBE(parent.bb.min_y, parent.bb.address + 4)
    //     buffer.writeFloatBE(parent.bb.min_z, parent.bb.address + 8)
    //     buffer.writeFloatBE(parent.bb.max_x, parent.bb.address + 12)
    //     buffer.writeFloatBE(parent.bb.max_y, parent.bb.address + 16)
    //     buffer.writeFloatBE(parent.bb.max_z, parent.bb.address + 20)
    // }

    return cursor
}

exports.read_node = function ({ buffer, cursor, model } = {}) {
    let node = {
        id: cursor,
        head: [
            buffer.readUInt32BE(cursor),
            buffer.readUInt32BE(cursor + 4),
            buffer.readUInt32BE(cursor + 8),
            buffer.readUInt32BE(cursor + 12),
            buffer.readUInt32BE(cursor + 16)
        ],
        children: []
    }

    if (model.AltN && model.AltN.includes(cursor)) {
        node.AltN = model.AltN.map((h, i) => h == cursor ? i : -1).filter(h => h > -1)
    }
    if (model.header.includes(cursor)) {
        node.header = model.header.map((h, i) => h == cursor ? i : -1).filter(h => h > -1)
    }
    if (!model.node_map[cursor]) {
        model.node_map[cursor] = true
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
                x1: buffer.readFloatBE(cursor + 76),
                y1: buffer.readFloatBE(cursor + 80),
                z1: buffer.readFloatBE(cursor + 84)
            }
            break
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
            if (model.AltN?.includes(child_start + i * 4)) {
                console.log('AltN wants to put something at', child_start + i * 4)
                node.children.push({ id: null, AltN: model.AltN.map((h, j) => h == child_start + i * 4 ? j : -1).filter(h => h > -1) })
            } else {
                node.children.push({ id: null }) //remove later
            }
            continue
        }

        if (model.node_map[child_address]) { //we've already read this node
            node.children.push({ id: child_address })
            continue
        }

        if (mesh_group) {
            node.children.push(exports.read_mesh_group({ buffer, cursor: child_address, model }))
        } else {
            node.children.push(exports.read_node({ buffer, cursor: child_address, model }))
        }
    }
    return node
}

exports.write_node = function ({ buffer, cursor, node, hl, model, header_offsets } = {}) {

    if (node.header) {
        for (let i = 0; i < node.header.length; i++) {
            buffer.writeUInt32BE(cursor, 4 + node.header[i] * 4)
        }
    }

    if (node.AltN) {
        for (let i = 0; i < node.AltN.length; i++) {
            buffer.writeUInt32BE(cursor, header_offsets.AltN + node.AltN[i] * 4)
        }
    }



    if (!model.node_map[node.id]) {
        model.node_map[node.id] = cursor
    }

    cursor = buffer.writeUInt32BE(node.head[0], cursor)
    cursor = buffer.writeUInt32BE(node.head[1], cursor)
    cursor = buffer.writeUInt32BE(node.head[2], cursor)
    cursor = buffer.writeUInt32BE(node.head[3], cursor)
    cursor = buffer.writeUInt32BE(node.head[4], cursor)
    cursor = buffer.writeUInt32BE(node.children.length, cursor)
    exports.highlight({ cursor, hl })
    let child_list_addr_addr = cursor
    cursor += 4

    let mesh_group = false
    switch (node.head[0]) {
        case 12388:
            mesh_group = true
            cursor = buffer.writeFloatBE(node.min_x, cursor)
            cursor = buffer.writeFloatBE(node.min_y, cursor)
            cursor = buffer.writeFloatBE(node.min_z, cursor)
            cursor = buffer.writeFloatBE(node.max_x, cursor)
            cursor = buffer.writeFloatBE(node.max_y, cursor)
            cursor = buffer.writeFloatBE(node.max_z, cursor)
            cursor += 8
            break
        case 20581:
            if (node.children?.length) {
                cursor += 4
            }
            break
        case 20582:
            cursor = buffer.writeFloatBE(node.xyz.f1, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f2, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f3, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f4, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f5, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f6, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f7, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f8, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f9, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f10, cursor)
            cursor = buffer.writeFloatBE(node.xyz.f11, cursor)
            break
        case 53348:
            cursor = buffer.writeFloatBE(node.xyz.ax, cursor)
            cursor = buffer.writeFloatBE(node.xyz.ay, cursor)
            cursor = buffer.writeFloatBE(node.xyz.az, cursor)
            cursor = buffer.writeFloatBE(node.xyz.bx, cursor)
            cursor = buffer.writeFloatBE(node.xyz.by, cursor)
            cursor = buffer.writeFloatBE(node.xyz.bz, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cx, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cy, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cz, cursor)
            cursor = buffer.writeFloatBE(node.xyz.x, cursor)
            cursor = buffer.writeFloatBE(node.xyz.y, cursor)
            cursor = buffer.writeFloatBE(node.xyz.z, cursor)
            break
        case 53349:
            cursor = buffer.writeFloatBE(node.xyz.ax, cursor)
            cursor = buffer.writeFloatBE(node.xyz.ay, cursor)
            cursor = buffer.writeFloatBE(node.xyz.az, cursor)
            cursor = buffer.writeFloatBE(node.xyz.bx, cursor)
            cursor = buffer.writeFloatBE(node.xyz.by, cursor)
            cursor = buffer.writeFloatBE(node.xyz.bz, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cx, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cy, cursor)
            cursor = buffer.writeFloatBE(node.xyz.cz, cursor)
            cursor = buffer.writeFloatBE(node.xyz.x, cursor)
            cursor = buffer.writeFloatBE(node.xyz.y, cursor)
            cursor = buffer.writeFloatBE(node.xyz.z, cursor)
            cursor = buffer.writeFloatBE(node.xyz.x1, cursor)
            cursor = buffer.writeFloatBE(node.xyz.y1, cursor)
            cursor = buffer.writeFloatBE(node.xyz.z1, cursor)
            break
        case 53350:
            cursor = buffer.writeInt32BE(node['53350'].unk1, cursor)
            cursor = buffer.writeInt32BE(node['53350'].unk2, cursor)
            cursor = buffer.writeInt32BE(node['53350'].unk3, cursor)
            cursor = buffer.writeFloatBE(node['53350'].unk4, cursor)
            break
    }

    if (node.children.length) {
        //write offset to this child list
        buffer.writeInt32BE(cursor, child_list_addr_addr)

        //child list
        let child_list_addr = cursor
        for (let c = 0; c < node.children.length; c++) {
            exports.highlight({ cursor, hl })
            cursor += 4
        }

        //write children
        for (let c = 0; c < node.children.length; c++) {

            let child = node.children[c]

            if (child.id === null) {
                buffer.writeUInt32BE(0, child_list_addr + c * 4)
                if (child.AltN) {
                    for (let i = 0; i < child.AltN.length; i++) {
                        buffer.writeUInt32BE(child_list_addr + c * 4, header_offsets.AltN + child.AltN[i] * 4)
                    }
                }
                continue
            }

            if (model.node_map[child.id]) {
                buffer.writeUInt32BE(model.node_map[child.id], child_list_addr + c * 4)
                continue
            }

            buffer.writeUInt32BE(cursor, child_list_addr + c * 4)
            if (mesh_group) {
                cursor = exports.write_mesh_group({ buffer, cursor, mesh: child, hl, model })
            } else {
                cursor = exports.write_node({ buffer, cursor, node: child, hl, model, header_offsets })
            }
        }
    }


    return cursor
}

exports.read_model = function ({ buffer, index } = {}) {
    console.log('reading model', index)
    let model = {
        mats: {}, //unique mats
        textures: {}, //unique textures
        node_map: {}, //unique node locations
        nodes: [],

    }
    let size = 0
    let cursor = exports.read_header({ buffer, model, index, size })
    if (model.AltN?.length && model.ext !== 'Podd') {
        let AltN = [...new Set(model.AltN)]
        for (let i = 0; i < AltN.length; i++) {
            model.nodes.push(exports.read_node({ buffer, cursor: AltN[i], model }))
        }
    } else {
        model.nodes = [exports.read_node({ buffer, cursor, model })]
    }
    return model
}

exports.write_model = function ({ model } = {}) {
    let buffer = Buffer.alloc(8000000)
    let hl = Buffer.alloc(1000000)
    let cursor = 0
    let header_offsets = exports.write_header({ buffer, cursor, hl, model })
    cursor = header_offsets.HEnd

    model.node_map = {} //clear and init node_map

    //write all nodes
    for (let i = 0; i < model.nodes.length; i++) {
        cursor = exports.write_node({ buffer, cursor, hl, node: model.nodes[i], model, header_offsets })
    }

    //write all animations
    for (let i = 0; i < model.Anim?.length; i++) {
        buffer.writeUInt32BE(cursor, header_offsets.Anim + i * 4)
        cursor = exports.write_animation({ buffer, cursor, animation: model.Anim[i], hl, model })
    }

    return [hl.subarray(0, Math.ceil(cursor / (32 * 4)) * 4), buffer.subarray(0, cursor)]
}

exports.read_block = function ({ file, arr } = {}) {
    let asset_count = file.readUInt32BE(0)
    let cursor = 4
    for (let i = 0; i < asset_count; i++) {
        for (let j = 0; j < arr.length; j++) {
            const asset_start = file.readUInt32BE(cursor)
            cursor += 4
            let asset_end = file.readUInt32BE(cursor)
            if (!asset_end) {
                asset_end = file.readUInt32BE(cursor + 4) //for textureblock we need to seek forward after blank offsets
            }
            const asset = file.subarray(asset_start, asset_end)
            if (arr[j]) {
                arr[j].push(asset_start ? asset : null)
            }
        }
    }
    return arr
}

exports.write_block = function ({ arr } = {}) {
    let length = arr[0].length
    let index = Buffer.alloc((length * arr.length + 2) * 4)
    let block = []
    block.push(index)

    index.writeUInt32BE(length, 0) //write total number of assets
    let cursor = index.byteLength
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < arr.length; j++) {
            index.writeUInt32BE((arr[j][i] && arr[j][i].length) ? cursor : 0, 4 + (i * arr.length + j) * 4)
            cursor += arr[j][i].byteLength
            block.push(arr[j][i])
        }
    }
    index.writeUInt32BE(cursor, (length * arr.length + 1) * 4) //end of block offset

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

exports.read_spline_point = function ({ buffer, cursor } = {}) {
    let point = {
        next_count: buffer.readInt16BE(cursor),
        previous_count: buffer.readInt16BE(cursor + 2),
        next1: buffer.readInt16BE(cursor + 4),
        next2: buffer.readInt16BE(cursor + 6),
        previous1: buffer.readInt16BE(cursor + 8),
        previous2: buffer.readInt16BE(cursor + 10),
        unknown1: buffer.readInt16BE(cursor + 12),
        unknown2: buffer.readInt16BE(cursor + 14),
        point_x: buffer.readFloatBE(cursor + 16),
        point_y: buffer.readFloatBE(cursor + 20),
        point_z: buffer.readFloatBE(cursor + 24),
        rotation_x: buffer.readFloatBE(cursor + 28),
        rotation_y: buffer.readFloatBE(cursor + 32),
        rotation_z: buffer.readFloatBE(cursor + 36),
        handle1_x: buffer.readFloatBE(cursor + 40),
        handle1_y: buffer.readFloatBE(cursor + 44),
        handle1_z: buffer.readFloatBE(cursor + 48),
        handle2_x: buffer.readFloatBE(cursor + 52),
        handle2_y: buffer.readFloatBE(cursor + 56),
        handle2_z: buffer.readFloatBE(cursor + 60),
        point_num0: buffer.readInt16BE(cursor + 64),
        point_num1: buffer.readInt16BE(cursor + 66),
        point_num2: buffer.readInt16BE(cursor + 68),
        point_num3: buffer.readInt16BE(cursor + 70),
        point_num4: buffer.readInt16BE(cursor + 72),
        point_num5: buffer.readInt16BE(cursor + 74),
        point_num6: buffer.readInt16BE(cursor + 76),
        point_num7: buffer.readInt16BE(cursor + 78),
        point_num8: buffer.readInt16BE(cursor + 80),
        point_unk: buffer.readInt16BE(cursor + 82)
    }
    return point
}

exports.write_spline_point = function ({ buffer, cursor, point } = {}) {
    cursor = buffer.writeInt16BE(point.next_count, cursor) //number of points this connects to
    cursor = buffer.writeInt16BE(point.previous_count, cursor) //number of points that connect to this
    cursor = buffer.writeInt16BE(point.next1, cursor) //index of the first point this connects to
    cursor = buffer.writeInt16BE(point.next2, cursor) //index of the second point this connects to
    cursor = buffer.writeInt16BE(point.previous1, cursor) //index of the first point that connects to this
    cursor = buffer.writeInt16BE(point.previous2, cursor) //index of the second point that connects to this
    cursor = buffer.writeInt16BE(point.unknown1, cursor) //
    cursor = buffer.writeInt16BE(point.unknown2, cursor) //
    //xyz coordinates of the point in global space
    cursor = buffer.writeFloatBE(point.point_x, cursor)
    cursor = buffer.writeFloatBE(point.point_y, cursor)
    cursor = buffer.writeFloatBE(point.point_z, cursor)
    //orientation of the spline point (always 0, 0, 1)
    cursor = buffer.writeFloatBE(point.rotation_x, cursor) //0
    cursor = buffer.writeFloatBE(point.rotation_y, cursor) //0
    cursor = buffer.writeFloatBE(point.rotation_z, cursor) //1
    //xyz coordinates of the trailing handle
    cursor = buffer.writeFloatBE(point.handle1_x, cursor)
    cursor = buffer.writeFloatBE(point.handle1_y, cursor)
    cursor = buffer.writeFloatBE(point.handle1_z, cursor)
    //xyz coordinates of the leading handle
    cursor = buffer.writeFloatBE(point.handle2_x, cursor)
    cursor = buffer.writeFloatBE(point.handle2_y, cursor)
    cursor = buffer.writeFloatBE(point.handle2_z, cursor)
    //the 'progress' index of the point, this value seens to determine where the player appears on the progress meter
    cursor = buffer.writeInt16BE(point.point_num0, cursor) //
    //the actual index of the point, setting to -1 doesn't seem to affect anything
    cursor = buffer.writeInt16BE(point.point_num1, cursor)
    //the overflow index of the point, setting to -1 doesn't seem to affect anything
    cursor = buffer.writeInt16BE(point.point_num2, cursor)
    //remaining indeces are always -1
    cursor = buffer.writeInt16BE(point.point_num3, cursor)
    cursor = buffer.writeInt16BE(point.point_num4, cursor)
    cursor = buffer.writeInt16BE(point.point_num5, cursor)
    cursor = buffer.writeInt16BE(point.point_num6, cursor)
    cursor = buffer.writeInt16BE(point.point_num7, cursor)
    cursor = buffer.writeInt16BE(point.point_num8, cursor)

    cursor = buffer.writeInt16BE(point.point_unk, cursor) //point.point_unk
    return cursor
}

exports.read_spline = function ({ buffer, index } = {}) {
    let cursor = 0
    let spline = {
        id: index,
        unknown: buffer.readInt32BE(cursor),
        point_count: buffer.readInt32BE(cursor + 4),
        segment_count: buffer.readInt32BE(cursor + 8),
        unknown2: buffer.readInt32BE(cursor + 12),
        points: []
    }
    cursor += 16
    for (let i = 0; i < spline.point_count; i++) {
        spline.points.push(
            exports.read_spline_point({ buffer, cursor })
        )
        cursor += 84
    }
    return spline
}

exports.write_spline = function ({ spline } = {}) {
    let buffer = Buffer.alloc(16 + spline.points.length * 84)
    let cursor = 0
    cursor = buffer.writeInt32BE(spline.unknown, cursor)
    cursor = buffer.writeInt32BE(spline.point_count, cursor) //the number of points on the spline
    cursor = buffer.writeInt32BE(spline.segment_count, cursor) //the number of segments/connections on the spline
    cursor = buffer.writeInt32BE(spline.unknown2, cursor)
    for (let i = 0; i < spline.points.length; i++) {
        cursor = exports.write_spline_point({ buffer, cursor, point: spline.points[i] })
    }
    return buffer.subarray(0, cursor) //cut off any excess bytes
}

exports.invert_spline = function ({ spline } = {}) {
    //special thanks to kingbeandip for helping figuring out a simple way to accomplish this
    let inverted_points = []
    let doublecount = 0
    let biggest_num0 = 0

    for (let i = 0; i < spline.points.length; i++) { //scan to find largest num0 value
        if (spline.points[i].point_num0 > biggest_num0) {
            biggest_num0 = spline.points[i].point_num0
        }
    }

    for (let i = 0; i < spline.points.length; i++) {
        let point = {}
        point.previous_count = spline.points[i].next_count //swap join/splits
        point.next_count = spline.points[i].previous_count //swap join/splits
        point.next1 = spline.points[i].previous1
        point.next2 = spline.points[i].previous2
        point.previous1 = spline.points[i].next1
        point.previous2 = spline.points[i].next2
        point.unknown1 = spline.points[i].unknown1
        point.unknown2 = spline.points[i].unknown2
        point.point_x = spline.points[i].point_x
        point.point_y = spline.points[i].point_y
        point.point_z = spline.points[i].point_z
        point.rotation_x = spline.points[i].rotation_x //always 0
        point.rotation_y = spline.points[i].rotation_y //always 0
        point.rotation_z = spline.points[i].rotation_z //always 1
        point.handle1_x = spline.points[i].handle2_x //swap handles
        point.handle1_y = spline.points[i].handle2_y //swap handles
        point.handle1_z = spline.points[i].handle2_z //swap handles
        point.handle2_x = spline.points[i].handle1_x //swap handles 
        point.handle2_y = spline.points[i].handle1_y //swap handles
        point.handle2_z = spline.points[i].handle1_z //swap handles
        point.point_num0 = (spline.points[i].point_num0 == 0) ? 0 : biggest_num0 - spline.points[i].point_num0 + 1;
        point.point_num1 = i
        if (point.splits == 2) {
            point.point_num2 = spline.points.length + doublecount
            doublecount++
        } else {
            point.point_num2 = -1
        }
        point.point_num3 = -1
        point.point_num4 = -1
        point.point_num5 = -1
        point.point_num6 = -1
        point.point_num7 = -1
        point.point_num8 = -1
        point.point_unk = spline.points[i].point_unk
        inverted_points.push(point)
    }
    spline.points = [...inverted_points]
    return spline
}

exports.read_palette = function ({ buffer, format } = {}) {
    const format_map = {
        512: 16,
        513: 256
    }
    if (!buffer) {
        return []
    }
    let palette = []
    for (let cursor = 0; cursor < format_map[format] * 2; cursor += 2) {
        let color = buffer.readInt16BE(cursor)
        let a = ((color >> 0) & 0x1) * 0xFF
        let b = Math.round((((color >> 1) & 0x1F) / 0x1F) * 255)
        let g = Math.round((((color >> 6) & 0x1F) / 0x1F) * 255)
        let r = Math.round((((color >> 11) & 0x1F) / 0x1F) * 255)
        if ((r + g + b) > 0 && a == 0) {
            a = 255
        }
        palette.push([r, g, b, a])
    }
    return palette
}

exports.write_palette = function ({ palette }) {
    if (!palette.length) {
        return Buffer.alloc(0)
    }
    let cursor = 0
    let buffer = Buffer.alloc(palette.length * 2)
    for (let j = 0; j < palette.length; j++) {
        let p = palette[j]
        let r = parseInt(((p[0]) / 255) * 0x1F) << 11
        let g = parseInt(((p[1]) / 255) * 0x1F) << 6
        let b = parseInt(((p[2]) / 255) * 0x1F) << 1
        let a = parseInt((p[3]) / 255)
        let pal = (((r | g) | b) | a)
        buffer.writeUInt16BE(pal, cursor)
        cursor += 2
    }

    return buffer
}

exports.read_pixels = function ({ buffer, format, pixel_count } = {}) {
    let pixels = []
    let cursor = 0
    switch (format) {
        case 3:
            for (let i = 0; i < pixel_count && cursor < buffer.length; i++) {
                let r = buffer.readUInt8(cursor)
                let g = buffer.readUInt8(cursor + 1)
                let b = buffer.readUInt8(cursor + 2)
                let a = buffer.readUInt8(cursor + 3)
                let pixel = [r, g, b, a]
                pixels.push(pixel)
                cursor += 4
            }
            break
        case 512:
            for (let i = 0; i < pixel_count && cursor < buffer.length; i++) {
                let p = buffer.readUInt8(cursor)
                let pixel_0 = (p >> 4) & 0xF
                let pixel_1 = p & 0xF
                pixels.push(pixel_0, pixel_1)
                cursor++
            }
            break
        case 513:
            for (let i = 0; i < pixel_count && cursor < buffer.length; i++) {
                let pixel = buffer.readUInt8(cursor)
                pixels.push(pixel)
                cursor++
            }
            break
        case 1024:
            for (let i = 0; i < pixel_count && cursor < buffer.length; i++) {
                let p = buffer.readUInt8(cursor)
                let pixel_0 = ((p >> 4) & 0xF) * 0x11
                let pixel_1 = (p & 0xF) * 0x11
                pixels.push(pixel_0, pixel_1)
                cursor++
            }
            break
        case 1025:
            for (let i = 0; i < pixel_count && cursor < buffer.length; i++) {
                let pixel = null
                pixel = buffer.readUInt8(cursor)
                pixels.push(pixel)
                cursor++
            }
            break
    }
    return pixels
}

exports.write_pixels = function ({ pixels, format } = {}) {
    const formatmap = {
        3: 4,
        512: 0.5,
        513: 1,
        1024: 0.5,
        1025: 1
    }
    let buffer = Buffer.alloc(pixels.length * formatmap[format])
    let cursor = 0
    if ([512, 1024].includes(format)) {
        for (let i = 0; i < pixels.length / 2; i++) {
            if (format == 512) {
                buffer.writeUInt8(parseInt((pixels[i * 2]) << 4) | parseInt((pixels[i * 2 + 1])), cursor)
            } else if (format == 1024) {
                buffer.writeUInt8((parseInt((pixels[i * 2]) / 0x11) << 4) | (parseInt((pixels[i * 2 + 1]) / 0x11)), cursor)
            }
            cursor++
        }
    } else if ([513, 1025, 3].includes(format)) {
        for (let i = 0; i < pixels.length; i++) {
            let pixel = pixels[i]
            if (format == 3) {
                for (let j = 0; j < 4; j++) {
                    buffer.writeUInt8((pixels[i][j]), cursor)
                    cursor++
                }
            } else {
                buffer.writeUInt8(pixel, cursor)
                cursor++
            }
        }
    }
    return buffer
}

exports.draw_texture = async function ({ pixels, palette, width, height, format, path, index } = {}) {
    if (!pixels.length) {
        console.log(`texture ${index} does not have any pixels`)
        return
    }
    if ([undefined, null, ""].includes(format) || [undefined, null, ""].includes(width) || [undefined, null, ""].includes(height)) {
        console.log(`texture ${index} is missing width/height/format data`)
        return
    }
    const image = new Jimp(width, height)

    for (let i = 0; i < height; i++) {
        for (j = 0; j < width; j++) {
            let ind = i * width + j
            let p = null
            let color = null
            if ([512, 513].includes(format)) {
                p = palette[pixels[ind]]
                color = Jimp.rgbaToInt(p?.[0] ?? 0, p?.[1] ?? 0, p?.[2] ?? 0, p?.[3] ?? 0)
            } else if ([1024, 1025].includes(format)) {
                p = pixels[ind]
                color = Jimp.rgbaToInt(p ?? 0, p ?? 0, p ?? 0, 255)
            } else if (format == 3) {
                p = pixels[ind]
                color = Jimp.rgbaToInt(p?.[0] ?? 0, p?.[1] ?? 0, p?.[2] ?? 0, p?.[3] ?? 0)
            }

            let x = 0

            //certain textures in the pc release are scrambled and must use the following code to be drawn correctly
            if (i % 2 == 1 && [49, 58, 99, 924, 966, 972, 991, 992, 1000, 1048, 1064].includes(index)) {
                if (Math.floor(j / 8) % 2 == 0) {
                    x = 8
                } else {
                    x = -8
                }
            }
            image.setPixelColor(color, j + x, height - 1 - i);

        }
    }
    if (path) {
        image.write(path)
    }

    return image
}

exports.read_texture = async function ({ path } = {}) {
    await Jimp.read(path).then(image => {
        let texture = {
            width: texdata[r].width,
            height: texdata[r].height,
            format: texdata[r].format,
            palette_offset: 0,
            palette: [],
            pages: 1,
            page_width: image.bitmap.width,
            page_height: image.bitmap.height,
            page_offset: 28,
            pixels: []
        }
        for (i = texture.height - 1; i >= 0; i--) {
            for (j = 0; j < texture.width; j++) {
                let color = Object.values(Jimp.intToRGBA(image.getPixelColor(j, i)))
                if ([512, 513].includes(texture.format)) { //build palette
                    let pindex = null
                    texture.palette.forEach((p, index) => {
                        if (p[0] == color[0] && p[1] == color[1] && p[2] == color[2] && p[3] == color[3]) {
                            pindex = index
                        }
                    })
                    if (pindex == null && ((texture.format == 512 && texture.palette.length < 16) || (texture.format == 513 && texture.palette.length < 256))) {
                        texture.palette.push(color)
                        texture.pixels.push(texture.palette.length - 1)
                    } else {
                        if (pindex == null) {
                            pindex = 0
                        }
                        texture.pixels.push(pindex)
                    }
                } else if (texture.format == 1024) {
                    texture.pixels.push(Math.floor(color[0] / 16) * 16)
                } else if (texture.format == 1025) {
                    texture.pixels.push(color[0])
                } else if (texture.format == 3) {
                    texture.pixels.push(color)
                }
            }
        }

        return texture
    })
}

exports.read_sprite = async function ({ buffer, index } = {}) {
    let cursor = 0
    let sprite = {
        index,
        width: buffer.readInt16BE(cursor),
        height: buffer.readInt16BE(cursor + 2),
        format: buffer.readInt16BE(cursor + 4),
        palette_offset: buffer.readInt32BE(cursor + 8),
        page_count: buffer.readInt16BE(cursor + 12),
        unk_0: buffer.readInt16BE(cursor + 14),
        unk_1: buffer.readInt32BE(cursor + 16),
        pages: [],
    }
    if (index == 173) {
        sprite.width = 192
    }
    //get pages
    for (i = 0; i < sprite.page_count; i++) {
        let page_start = 20 + i * 8
        let page = {
            width: buffer.readInt16BE(page_start),
            height: buffer.readInt16BE(page_start + 2),
            offset: buffer.readInt32BE(page_start + 4)//offset to start of pixel data for page
        }

        //with some odd sprite widths, page widths need to be corrected to line up pixels
        if ([513, 1025].includes(sprite.format)) {
            page.width = (page.width + 0x7) & 0xFFFFFFF8
        } else if ([512, 1024].includes(sprite.format)) {
            page.width = (page.width + 0xF) & 0xFFFFFFF0
        }
        sprite.pages.push(page)
    }
    //get palette
    sprite.palette = exports.read_palette({ buffer: buffer.subarray(sprite.palette_offset, buffer.length), format: sprite.format })

    const sprite_image = new Jimp(sprite.width, sprite.height);
    let sprite_pages = []
    //get pixels from pages and assemble image
    for (let k = 0; k < sprite.page_count; k++) {
        let page = sprite.pages[k]
        let pixels = exports.read_pixels({ buffer: buffer.subarray(page.offset, buffer.length), format: sprite.format, pixel_count: page.width * page.height })

        const page_image = await exports.draw_texture({ pixels, palette: sprite.palette, width: page.width, height: page.height, format: sprite.format, path: `sprites/${index}_${k}.png` })
        sprite_pages.push(page_image)
    }
    let x = 0, y = 0
    for (let i = 0; i < sprite_pages.length; i++) {
        sprite_image.blit(sprite_pages[i], x, y)
        x += sprite_pages[i].bitmap.width
        if (x >= sprite.width) {
            x = 0
            y += sprite_pages[i].bitmap.height
        }
    }

    sprite_image.write(`sprites/${index}.png`)

    return sprite
}


