const fs = require('fs');
const filePath = './in/out_spriteblock.bin'

if (!fs.existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_block, read_sprite } = require('../block');

let [sprite_buffers] = read_block({ file, arr: [[]] })

for (let i = 0; i < sprite_buffers.length; i++) {
  let buffer = sprite_buffers[i]
  let sprite = read_sprite({ buffer, index: i })
  fs.writeFile(`sprites/${i}.json`, JSON.stringify(sprite), (err) => {
    if (err) console.error(err)
  });
}

console.log(`successfully unpacked ${sprite_buffers.length} textures to sprites/`)
