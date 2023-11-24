const fs = require('fs');
const { write_model, write_block } = require('./_block');
let splineblock = {}

if (fs.existsSync('../splineblock/out_splineblock.json')) {
    splineblock = require('../splineblock/out_splineblock.json') //we'll need splineblock if we want to update splines for any track mods
}
//gather model jsons from folder (output by modelblock_unpack.js)
let replacements = []
for (r = 0; r < 323; r++) {
    if (fs.existsSync('models/rep/' + r + '.json')) {
        console.log("found " + r + " replacement")
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile('rep/' + r + '.json', async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });

    } else if (fs.existsSync('models/' + r + '.json')) {
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile('models/' + r + '.json', async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });
    }
}


//some basic parameters for modifying track mesh/collision
const slope = 0
const xStretch = 1
const yStretch = 1
const zStretch = 1
const xOffset = 0
const yOffset = 0
const zOffset = 0
const xSplineOffset = 0
const ySplineOffset = 0
const zSplineOffset = 0
Promise.all(replacements).then(models => {
    let offset_buffers = []
    let model_buffers = []

    for (let i = 0; i < models.length; i++) {
        console.log(i)
        const [offset, model] = write_model({ model: models[i] })
        offset_buffers.push(offset)
        model_buffers.push(model)
        fs.writeFileSync(`out/model_${i}.bin`, model);
    }

    let file = write_block({ arr: [offset_buffers, model_buffers] })
    fs.writeFileSync('out/out_modelblock.bin', file);
    console.log(`successfully repacked ${models.length} models to out/modelblock.bin`)

})

