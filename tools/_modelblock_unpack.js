const fs = require('fs');
const filePath = 'in/out_modelblock.bin'

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
    fs.writeFileSync(`models/${i}.bin`, buffer);
    const model = read_model({ buffer, i })
    fs.writeFile(("models/" + i + ".json"), JSON.stringify(model), (err) => {
        if (err) console.error(err)
    })
}

console.log(`Successfully unpacked ${model_buffers.length} models to models/`)