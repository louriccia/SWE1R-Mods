const fs = require('fs');
const filePath = 'in/out_modelblock.bin'

if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_block, read_model } = require('./modelblock_functions')

let model_buffers = read_block({ file, map: true })
for (let i = 1; i < 2; i++) {
    let buffer = model_buffers[i]
    const model = read_model({ buffer, i })
    fs.writeFile(("test/" + i + ".json"), JSON.stringify(model), (err) => {
        if (err) console.error(err)
    })
}


