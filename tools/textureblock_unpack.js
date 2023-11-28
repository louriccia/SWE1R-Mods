const fs = require('fs');
const filePath = './in/out_textureblock.bin'

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}\nPlease provide the out_textureblock.bin file from your game's data/lev01/ folder in the ./in folder`)
  return
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_pixels, read_palette, draw_texture, read_block } = require('./block');
const { textures } = require('./_textures')
let [pixel_buffers, palette_buffers] = read_block({ file, arr: [[], []] })

if (!fs.existsSync('./textures/')) {
  fs.mkdirSync('./textures/');
  fs.mkdirSync('./textures/rep');
}

for (let i = 0; i < pixel_buffers.length; i++) {
  let texture = {
    ...textures[i],
    pixels: read_pixels({ buffer: pixel_buffers[i], format: textures[i].format, pixel_count: textures[i].width * textures[i].height }),
    palette: read_palette({ buffer: palette_buffers[i], format: textures[i].format }),
    index: i
  }

  draw_texture(
    {
      ...texture,
      path: `textures/${i}.png`,
      index: i
    }
  )



  fs.writeFile(`textures/${i}.json`, JSON.stringify(texture), (err) => {
    if (err) console.error(err)
  })
}

console.log(`successfully unpacked ${pixel_buffers.length} textures to textures/`)


/*
      Format 3 / 0x3: 
        No palette
        pixel data consists of tuple of R G B A values (each 2 byte integer)
        used for lens flares and suns
      Format 512 / 0x200:
        Palette
        16
        each pixel (2 byte integer) points to a color in the palette
        used for flags and engines
      Format 513 / 0x201:
        Palette
        each pixel (1 byte integer) points to a color in the palette 
        used for boost bar, position flags, racer/planet portraits, and logos
      Format 1024 / 0x400
        No palette
        Only contains one channel (2 byte integer) (greyscale), acts as alpha
        used for menu element borders and fills which are later tinted in-game
      Format 1025 / 0x401
        No palette
        Only contains one channel (1 byte integer) (greyscale), acts as alpha
        Only used for one sprite (168)
*/
