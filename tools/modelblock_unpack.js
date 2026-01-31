const fs = require('fs');
const filePath = 'in/out_modelblock.bin'

const { write_triggers, write_shaders } = require('./block');

if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
}

const file = fs.readFileSync(filePath)
const { read_block, read_model } = require('./block')

if (!fs.existsSync('./models/')) {
    fs.mkdirSync('./models/');
    fs.mkdirSync('./models/rep/');
}

let [offset_buffers, model_buffers] = read_block({ file, arr: [[], []] })
for (let i = 0; i < 323; i++) {

    let buffer = model_buffers[i]

    //get debug
    let cursor = 0
    let data = {}
    let local_offset = 0
    let debug = []
    let header_string = "string, float, int32, int16_1, int16_2, int8_1, int8_2, int8_3, int8_4, offset"
    debug.push(header_string)
    for (let j = cursor; j < buffer.length; j += 4) {
        data[j] = {}
        cursor = j
        data[j].string = buffer.toString('utf8', cursor, cursor + 4)
        data[j].string = data[j].string.replace(/\t/g, "").replace(/\n/g, "").replace(/\r/g, "").replace(/,/g, "").replace(/=/g, "")
        data[j].float = buffer.readFloatBE(cursor)
        data[j].int32 = buffer.readInt32BE(cursor)
        data[j].int16_1 = buffer.readInt16BE(cursor)
        cursor += 2
        data[j].int16_2 = buffer.readInt16BE(cursor)
        cursor -= 2
        data[j].int8_1 = buffer.readUInt8(cursor)
        cursor++
        data[j].int8_2 = buffer.readUInt8(cursor)
        cursor++
        data[j].int8_3 = buffer.readUInt8(cursor)
        cursor++
        data[j].int8_4 = buffer.readUInt8(cursor)
        data[j].offset = local_offset
        cursor++
        local_offset += 4
        //debug.push([data[j].string, data[j].float, data[j].int32, data[j].int16_1, data[j].int16_2, data[j].int8_1, data[j].int8_2, data[j].int8_3, data[j].int8_4, data[j].offset].join(", "))

        // fs.writeFileSync("models/dump/" + i + ".csv", debug.join('\n'), (err) => {
        //     if (err) console.error(err)
        // })
    }
    fs.writeFileSync(`models/${i}.bin`, buffer);
    const model = read_model({ buffer, index: i })
    fs.writeFile(("models/" + i + ".json"), JSON.stringify(model), (err) => {
        if (err) console.error(err)
    })

    write_triggers()
    write_shaders()

    console.log(`Successfully unpacked ${model_buffers.length} models to models/`)
}