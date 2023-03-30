const fs = require('fs');
let out_spline = require('./out_splineblock.json')

function invertSpline(spline) {
    let inverted_points = []
    let offset = spline.points[0].offset
    let doublecount = 0
    let biggest_num0 = 0
    for (let i = 0; i < spline.points.length; i++) { //scan to find largest num0 value
        if (spline.points[i].point_num0 > biggest_num0) {
            biggest_num0 = spline.points[i].point_num0
        }
    }

    for (let i = 0; i < spline.points.length; i++) {
        let point = {}
        point.offset = offset
        point.splits = spline.points[i].joins //swap join/splits
        point.joins = spline.points[i].splits //swap join/splits
        point.next1 = spline.points[i].previous1
        point.next2 = spline.points[i].previous2
        point.previous1 = spline.points[i].next1
        point.previous2 = spline.points[i].next2
        point.unknown1 = spline.points[i].unknown1
        point.unknown2 = spline.points[i].unknown2
        point.point_x = spline.points[i].point_x
        point.point_y = spline.points[i].point_y
        point.point_z = spline.points[i].point_z
        point.unknown_x = spline.points[i].unknown_x //always 0
        point.unknown_y = spline.points[i].unknown_y //always 0
        point.unknown_z = spline.points[i].unknown_z //always 1
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
        offset += 84
    }
    spline.points = [...inverted_points]
    return spline
}

let file = Buffer.alloc(1000000)
cursor = 0
file.writeInt32BE(out_spline.spline_count, cursor)
cursor += 4

for (let j = 0; j < 92; j++) {
    file.writeInt32BE(out_spline.addresses[j], cursor)
    cursor += 4
}

for (let j = 0; j < out_spline.addresses.length - 1; j++) {
    cursor = out_spline.addresses[j]
    let header = Object.values(out_spline.splines[j].header)
    for (let i = 0; i < 7; i++) {
        if (i == 6) {
            file.writeInt32BE(header[i], cursor)
            cursor += 4
        } else {
            file.writeInt16BE(header[i], cursor)
            cursor += 2
        }
    }

    //out_spline.splines[j] = invertSpline(out_spline.splines[j]) //invert spline

    for (let i = 0; i < out_spline.splines[j].points.length; i++) { //out_spline.splines[j].points.length
        cursor = out_spline.splines[j].points[i].offset
        file.writeInt16BE(out_spline.splines[j].points[i].splits, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].joins, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].next1, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].next2, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].previous1, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].previous2, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].unknown1, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].unknown2, cursor)
        cursor += 2
        file.writeFloatBE(out_spline.splines[j].points[i].point_x, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].point_y, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].point_z, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].unknown_x, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].unknown_y, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].unknown_z, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle1_x, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle1_y, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle1_z, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle2_x, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle2_y, cursor)
        cursor += 4
        file.writeFloatBE(out_spline.splines[j].points[i].handle2_z, cursor)
        cursor += 4
        file.writeInt16BE(out_spline.splines[j].points[i].point_num0, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num1, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num2, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num3, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num4, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num5, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num6, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num7, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_num8, cursor)
        cursor += 2
        file.writeInt16BE(out_spline.splines[j].points[i].point_unk, cursor)
    }
}

fs.writeFileSync('out/out_splineblock.bin', file);