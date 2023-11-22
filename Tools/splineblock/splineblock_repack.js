const fs = require('fs');
const { write_block, write_spline } = require('../block');

//gather spline jsons from folder (output by splineblock_unpack.js)
let replacements = []
for (r = 0; r < 91; r++) {
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

Promise.all(replacements).then((replacements) => {
    console.log(replacements.length)
    let file = write_block({ asset_buffers: replacements.map((r, index) => write_spline({ spline: r, index })) })
    fs.writeFileSync('out/out_splineblock.bin', file);
    console.log(`successfully repacked ${replacements.length} splines to out/splineblock.bin`)
})