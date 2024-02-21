const fs = require('fs');
const filePath = './in/out_spriteblock.bin'

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}\nPlease provide the out_spriteblock.bin file from your game's data/lev01/ folder in the ./in folder`)
  return
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_block, read_sprite, draw_sprite } = require('./block');

let [sprite_buffers] = read_block({ file, arr: [[]] })

if (!fs.existsSync('./sprites/')) {
  fs.mkdirSync('./sprites/');
  fs.mkdirSync('./sprites/rep');
}

let sprites = []

for (let i = 0; i < sprite_buffers.length; i++) {
  let buffer = sprite_buffers[i]

  let sprite = read_sprite({ buffer, index: i })

  draw_sprite(sprite)

  fs.writeFile(`sprites/${i}.json`, JSON.stringify(sprite), (err) => {
    if (err) console.error(err)
  });
  sprites.push(sprite)
}

console.log(`successfully unpacked ${sprite_buffers.length} sprites to sprites/`)
