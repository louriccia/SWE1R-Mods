const BinaryFile = require('binary-file');
const fs = require('fs');

const myBinaryFile = new BinaryFile('./out_splineblock.bin', 'r');
const myWrittenFile = new BinaryFile('./out_splineblock_modified.bin', 'w')
var out_spline = {}
myBinaryFile.open().then(function () {
  console.log('Reading file...');
  return myBinaryFile
}).then(async function (file) {

  var cursor = 0
  var addresses = []
  out_spline.spline_count = await file.readInt32(position = cursor)
  for (let j = 1; j < 93; j++) {
    cursor = j * 4
    var read = await file.readInt32(position = cursor)
    addresses.push(read)
  }
  out_spline.addresses = addresses
  out_spline.splines = []
  for (let j = 0; j < addresses.length; j++) {
    cursor = addresses[j]
    var spline = {}
    spline.offset = cursor
    var header = {}
    for (let i = 0; i < 8; i++) {
      if (i == 6) {
        var read = await file.readInt32(position = cursor)
        header["unknown_address"] = read
        cursor += 4
        i++
      } else {
        var read = await file.readInt16(position = cursor)
        header["unknown_" + i] = read
        cursor += 2
      }
    }
    spline.header = header
    spline.points = []
    var points_string = ""
    for (let i = cursor; i < addresses[j + 1]; i += 84) {
      cursor = i
      var point = {}
      point.offset = cursor
      point.splits = await file.readInt16(position = cursor)
      cursor += 2
      point.joins = await file.readInt16(position = cursor)
      cursor += 2
      point.next1 = await file.readInt16(position = cursor)
      cursor += 2
      point.next2 = await file.readInt16(position = cursor)
      cursor += 2
      point.previous1 = await file.readInt16(position = cursor)
      cursor += 2
      point.previous2 = await file.readInt16(position = cursor)
      cursor += 2
      point.unknown1 = await file.readInt16(position = cursor)
      cursor += 2
      point.unknown2 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_x = await file.readFloat(position = cursor)
      cursor += 4
      point.point_y = await file.readFloat(position = cursor)
      cursor += 4
      point.point_z = await file.readFloat(position = cursor)
      cursor += 4
      point.unknown_x = await file.readFloat(position = cursor)
      cursor += 4
      point.unknown_y = await file.readFloat(position = cursor)
      cursor += 4
      point.unknown_z = await file.readFloat(position = cursor)
      cursor += 4
      point.handle1_x = await file.readFloat(position = cursor)
      cursor += 4
      point.handle1_y = await file.readFloat(position = cursor)
      cursor += 4
      point.handle1_z = await file.readFloat(position = cursor)
      cursor += 4
      point.handle2_x = await file.readFloat(position = cursor)
      cursor += 4
      point.handle2_y = await file.readFloat(position = cursor)
      cursor += 4
      point.handle2_z = await file.readFloat(position = cursor)
      cursor += 4
      point.point_num0 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num1 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num2 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num3 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num4 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num5 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num6 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num7 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_num8 = await file.readInt16(position = cursor)
      cursor += 2
      point.point_unk = await file.readInt16(position = cursor)

      spline.points.push(point)
      points_string += Object.values(point).join(", ") + "\n"
    }
    out_spline.splines.push(spline)
    var titles = []
    if (spline.points[0] !== undefined) {
      titles = Object.keys(spline.points[0])
    }
    fs.writeFile("splines/" + spline.offset + ".txt",
      "HEADER:\nunk_0, unk_1, unk_2, unk_3, unk_4, unk_5, unk_pointer\n" + Object.values(spline.header).join(", ") +
      "\nPOINTS:\n" + titles + "\n" +
      points_string, (err) => {
        if (err) console.error(err)
      });
  }
  fs.writeFile("out_splineblock.json", JSON.stringify(out_spline), (err) => {
    if (err) console.error(err)
  });

  return out_spline
}).then(function (string) {
  
  cursor = 0
  myWrittenFile.open().then(function () {
    console.log('Writing file...');
    return myWrittenFile
  }).then(async function (file) {
    await file.writeInt32(out_spline.spline_count, position = cursor)
    cursor += 4
    for (let j = 0; j < 92; j++) {
      await file.writeInt32(out_spline.addresses[j], position = cursor)
      cursor += 4
    }
    for (let j = 0; j < out_spline.addresses.length - 1; j++) { //out_spline.addresses.length - 1
      var points_string = ""
      cursor = out_spline.addresses[j]
      var header_stuff = Object.values(out_spline.splines[j].header)
      console.log(out_spline.splines[j].offset)
      for (let i = 0; i < 7; i++) {
        if (i == 6) {
          await file.writeInt32(header_stuff[i], position = cursor)
          cursor += 4
        } else {
          await file.writeInt16(header_stuff[i], position = cursor)
          cursor += 2
        }
      }
      function invertSpline(index) {
        var inverted_points = []
        var offset = out_spline.splines[index].points[0].offset
        var doublecount = 0
        var biggest_num0 = 0
        for (var i = 0; i < out_spline.splines[index].points.length; i++) { //scan to find largest num0 value
          if(out_spline.splines[index].points[i].point_num0 > biggest_num0){
            biggest_num0 = out_spline.splines[index].points[i].point_num0
          }
        }
        
        for (var i = 0; i < out_spline.splines[index].points.length; i++) {
          var point = {}
          point.offset = offset
          point.splits = out_spline.splines[index].points[i].joins //swap join/splits
          point.joins = out_spline.splines[index].points[i].splits //swap join/splits
          point.next1 = out_spline.splines[index].points[i].previous1
          point.next2 = out_spline.splines[index].points[i].previous2
          point.previous1 = out_spline.splines[index].points[i].next1
          point.previous2 = out_spline.splines[index].points[i].next2
          point.unknown1 = out_spline.splines[index].points[i].unknown1
          point.unknown2 = out_spline.splines[index].points[i].unknown2
          point.point_x = out_spline.splines[index].points[i].point_x
          point.point_y = out_spline.splines[index].points[i].point_y
          point.point_z = out_spline.splines[index].points[i].point_z
          point.unknown_x = out_spline.splines[index].points[i].unknown_x //always 0
          point.unknown_y = out_spline.splines[index].points[i].unknown_y //always 0
          point.unknown_z = out_spline.splines[index].points[i].unknown_z //always 1
          point.handle1_x = out_spline.splines[index].points[i].handle2_x //swap handles
          point.handle1_y = out_spline.splines[index].points[i].handle2_y //swap handles
          point.handle1_z = out_spline.splines[index].points[i].handle2_z //swap handles
          point.handle2_x = out_spline.splines[index].points[i].handle1_x //swap handles 
          point.handle2_y = out_spline.splines[index].points[i].handle1_y //swap handles
          point.handle2_z = out_spline.splines[index].points[i].handle1_z //swap handles
          point.point_num0 = (out_spline.splines[index].points[i].point_num0 == 0) ? 0 : biggest_num0 - out_spline.splines[index].points[i].point_num0 + 1;
          point.point_num1 = i
          if (point.splits == 2) {
            point.point_num2 = out_spline.splines[index].points.length + doublecount
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
          point.point_unk = out_spline.splines[index].points[i].point_unk
          inverted_points.push(point)
          offset += 84
        }
        console.log(inverted_points)
        out_spline.splines[index].points = [...inverted_points]
      }
      titles = []
      invertSpline(j)
      
      for(i = 0; i < out_spline.splines[j].points.length; i++){
        points_string += [Object.values(out_spline.splines[j].points[i])].join(", ") + "\n"
      }
      if (out_spline.splines[j].points[0] !== undefined) {
        titles = Object.keys(out_spline.splines[j].points[0])
      }
      fs.writeFile("splines_modified/" + out_spline.splines[j].offset + ".txt",
        "HEADER:\nunk_0, unk_1, unk_2, unk_3, unk_4, unk_5, unk_pointer\n" + Object.values(out_spline.splines[j].header).join(", ") +
        "\nPOINTS:\n" + titles + "\n" +
        points_string, (err) => {
          if (err) console.error(err)
        });
      for (let i = 0; i < out_spline.splines[j].points.length; i++) { //out_spline.splines[j].points.length
        cursor = out_spline.splines[j].points[i].offset
        await file.writeInt16(out_spline.splines[j].points[i].splits, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].joins, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].next1, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].next2, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].previous1, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].previous2, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].unknown1, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].unknown2, position = cursor)
        cursor += 2
        await file.writeFloat(out_spline.splines[j].points[i].point_x, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].point_y, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].point_z, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].unknown_x, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].unknown_y, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].unknown_z, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle1_x, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle1_y, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle1_z, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle2_x, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle2_y, position = cursor)
        cursor += 4
        await file.writeFloat(out_spline.splines[j].points[i].handle2_z, position = cursor)
        cursor += 4
        await file.writeInt16(out_spline.splines[j].points[i].point_num0, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num1, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num2, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num3, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num4, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num5, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num6, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num7, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_num8, position = cursor)
        cursor += 2
        await file.writeInt16(out_spline.splines[j].points[i].point_unk, position = cursor)
      }
    }
  })
  //console.log(`File read: ${string}`);
  return myBinaryFile.close();
}).then(function () {
  //console.log('File closed');
}).catch(function (err) {
  console.log(`There was an error: ${err}`);
});