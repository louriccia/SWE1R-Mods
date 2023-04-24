const fs = require('fs');
let out_spline = require('./out_splineblock.json')

function invertSpline(spline) {
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

//gather spline jsons from folder (output by splineblock_unpack.js)
let replacements = []
for (r = 0; r < out_spline.spline_count; r++) {
    if (fs.existsSync(`rep/${r}.json`)) {
        console.log("found " + r + " replacement")
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile(`rep/${r}.json`, async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });

    } else if (fs.existsSync(`splines/${r}.json`)) {
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile(`splines/${r}.json`, async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });
    }
}

Promise.all(replacements).then(replacements => {
    let file = Buffer.alloc(4 + (replacements.length * 4) + 4 + (86 * replacements.map(r => r.points.length).reduce((a, b) => a + b)))
    let cursor = 0
    cursor = file.writeInt32BE(replacements.length, cursor)
    cursor += replacements.length * 4 + 4
    for (let j = 0; j < replacements.length; j++) {
        file.writeInt32BE(cursor, 4 + j * 4)
        cursor = file.writeInt32BE(replacements[j].unknown, cursor)
        cursor = file.writeInt32BE(replacements[j].points.length, cursor) //the number of points of the spline
        cursor = file.writeInt32BE(replacements[j].points.map(p => p.next_count == 0 ? 1 : p.next_count).reduce((a, b) => a + b), cursor) //the number of segments/connections of the spline
        cursor = file.writeInt32BE(replacements[j].unknown2, cursor)

        //invert spline
        if (false) {
            replacements[j] = invertSpline(replacements[j])
        }

        //all the points of the spline
        for (let i = 0; i < replacements[j].points.length; i++) {
            cursor = file.writeInt16BE(replacements[j].points[i].next_count, cursor) //number of points this connects to
            cursor = file.writeInt16BE(replacements[j].points[i].previous_count, cursor) //number of points that connect to this
            cursor = file.writeInt16BE(replacements[j].points[i].next1, cursor) //index of the first point this connects to
            cursor = file.writeInt16BE(replacements[j].points[i].next2, cursor) //index of the second point this connects to
            cursor = file.writeInt16BE(replacements[j].points[i].previous1, cursor) //index of the first point that connects to this
            cursor = file.writeInt16BE(replacements[j].points[i].previous2, cursor) //index of the second point that connects to this
            cursor = file.writeInt16BE(replacements[j].points[i].unknown1, cursor) //
            cursor = file.writeInt16BE(replacements[j].points[i].unknown2, cursor) //
            //xyz coordinates of the point in global space
            cursor = file.writeFloatBE(replacements[j].points[i].point_x, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].point_y, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].point_z, cursor)
            //orientation of the spline point (always 0, 0, 1)
            cursor = file.writeFloatBE(replacements[j].points[i].rotation_x, cursor) //0
            cursor = file.writeFloatBE(replacements[j].points[i].rotation_y, cursor) //0
            cursor = file.writeFloatBE(replacements[j].points[i].rotation_z, cursor) //1
            //xyz coordinates of the trailing handle
            cursor = file.writeFloatBE(replacements[j].points[i].handle1_x, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].handle1_y, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].handle1_z, cursor)
            //xyz coordinates of the leading handle
            cursor = file.writeFloatBE(replacements[j].points[i].handle2_x, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].handle2_y, cursor)
            cursor = file.writeFloatBE(replacements[j].points[i].handle2_z, cursor)
            //the 'progress' index of the point, this value seens to determine where the player appears on the progress meter
            cursor = file.writeInt16BE(replacements[j].points[i].point_num0, cursor) //
            //the actual index of the point, setting to -1 doesn't seem to affect anything
            cursor = file.writeInt16BE(replacements[j].points[i].point_num1, cursor)
            //the overflow index of the point, setting to -1 doesn't seem to affect anything
            cursor = file.writeInt16BE(replacements[j].points[i].point_num2, cursor)
            //remaining indeces are always -1
            cursor = file.writeInt16BE(replacements[j].points[i].point_num3, cursor)
            cursor = file.writeInt16BE(replacements[j].points[i].point_num4, cursor)
            cursor = file.writeInt16BE(replacements[j].points[i].point_num5, cursor)
            cursor = file.writeInt16BE(replacements[j].points[i].point_num6, cursor)
            cursor = file.writeInt16BE(replacements[j].points[i].point_num7, cursor)
            cursor = file.writeInt16BE(replacements[j].points[i].point_num8, cursor)

            cursor = file.writeInt16BE(0, cursor) //replacements[j].points[i].point_unk
        }
    }

    file.writeInt32BE(cursor, 4 + replacements.length * 4)

    fs.writeFileSync('out/out_splineblock.bin', file);
    console.log(`successfully repacked ${replacements.length} /splines to out/splineblock.bin`)
})