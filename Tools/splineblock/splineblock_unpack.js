const fs = require('fs');
const filePath = 'in/out_splineblock.bin'

if (!fs.existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_spline, read_block } = require('../block');
let [spline_buffers] = read_block({ file, arr: [[]] })

for (let i = 0; i < spline_buffers.length; i++) {
  let spline = read_spline({ buffer: spline_buffers[i], index: i })
  fs.writeFile(`splines/${i}.json`, JSON.stringify(spline), (err) => {
    if (err) console.error(err)
  })
}

console.log(`Successfully unpacked ${spline_buffers.length} splines from in/out_splineblock.bin`)


