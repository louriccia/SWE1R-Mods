const fs = require('fs');
const file = fs.readFileSync('out_splineblock.bin')

let cursor = 0
let out_spline = {
  spline_count: file.readInt32BE(cursor),
  addresses: [],
  splines: []
}

for (let j = 1; j < 93; j++) {
  cursor = j * 4
  out_spline.addresses.push(file.readInt32BE(cursor))
}
for (let j = 0; j < out_spline.addresses.length - 1; j++) {
  cursor = out_spline.addresses[j]
  let spline = {
    header: {},
    points: []
  }
  spline.offset = cursor
  spline.unknown = file.readInt32BE(cursor)
  cursor += 4
  spline.point_count = file.readInt32BE(cursor)
  cursor += 4
  spline.segment_count = file.readInt32BE(cursor)
  cursor += 4
  spline.unknown2 = file.readInt32BE(cursor)
  cursor += 4
  let spline_num = 0
  for (let i = cursor; i < out_spline.addresses[j + 1]; i += 84) {
    cursor = i
    let point = {}
    point.next_count = file.readInt16BE(cursor)
    cursor += 2
    point.previous_count = file.readInt16BE(cursor)
    cursor += 2
    point.next1 = file.readInt16BE(cursor)
    cursor += 2
    point.next2 = file.readInt16BE(cursor)
    cursor += 2
    point.previous1 = file.readInt16BE(cursor)
    cursor += 2
    point.previous2 = file.readInt16BE(cursor)
    cursor += 2
    point.unknown1 = file.readInt16BE(cursor)
    cursor += 2
    point.unknown2 = file.readInt16BE(cursor)
    cursor += 2
    point.point_x = file.readFloatBE(cursor)
    cursor += 4
    point.point_y = file.readFloatBE(cursor)
    cursor += 4
    point.point_z = file.readFloatBE(cursor)
    cursor += 4
    point.rotation_x = file.readFloatBE(cursor)
    cursor += 4
    point.rotation_y = file.readFloatBE(cursor)
    cursor += 4
    point.rotation_z = file.readFloatBE(cursor)
    cursor += 4
    point.handle1_x = file.readFloatBE(cursor)
    cursor += 4
    point.handle1_y = file.readFloatBE(cursor)
    cursor += 4
    point.handle1_z = file.readFloatBE(cursor)
    cursor += 4
    point.handle2_x = file.readFloatBE(cursor)
    cursor += 4
    point.handle2_y = file.readFloatBE(cursor)
    cursor += 4
    point.handle2_z = file.readFloatBE(cursor)
    cursor += 4
    point.point_num0 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num1 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num2 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num3 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num4 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num5 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num6 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num7 = file.readInt16BE(cursor)
    cursor += 2
    point.point_num8 = file.readInt16BE(cursor)
    cursor += 2
    point.point_unk = file.readInt16BE(cursor)
    spline.points.push(point)
    console.log(point.point_unk)
    spline_num ++
  }
  //console.log(j, spline.unknown, spline.point_count, spline.segment_count, spline.points.map(p => p.splits).reduce((a,b) => a + b), spline.segment_count == spline.points.map(p => p.splits == 0 ? 1 : p.splits).reduce((a,b) => a + b), spline.unknown2)
  out_spline.splines.push(spline)
  fs.writeFile(`splines/${j}.json`, JSON.stringify(spline), (err) => {
    if (err) console.error(err)
  })
}

fs.writeFile("out_splineblock.json", JSON.stringify(out_spline), (err) => {
  if (err) console.error(err)
});

console.log(`successfully unpacked out_splineblock to ${out_spline.splines.length} /splines`)

