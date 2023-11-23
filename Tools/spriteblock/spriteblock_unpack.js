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
  read_sprite({ buffer })
}


// fs.writeFile("out_spriteblock.json", JSON.stringify(out_sprite), (err) => {
//   if (err) console.error(err)
// });
// console.log("drawing images...")
// out_sprite.sprites.forEach((sprite, ind) => {
//   let img = new Jimp(sprite.width, sprite.height, (err, image) => {
//     console.log("drawing sprite " + (ind + 1) + " of " + out_sprite.sprites.length)
//     let x_offset = 0
//     let y_offset = 0
//     for (k = 0; k < sprite.page_count; k++) { //for every page
//       let page_width = sprite.pages[k].width
//       let page_height = sprite.pages[k].height
//       for (i = 0; i < page_height; i++) { //for every page row
//         for (j = 0; j < page_width; j++) { //for every page column
//           let index = i * page_width + j
//           let p = null
//           let color = null
//           if ([512, 513].includes(sprite.format)) {
//             p = sprite.palette[sprite.pages[k].pixels[index]]
//             color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
//           } else if ([1024, 1025].includes(sprite.format)) {
//             p = sprite.pages[k].pixels[index]
//             color = Jimp.rgbaToInt(p, p, p, 255)
//           } else if (sprite.format == 3) {
//             p = sprite.pages[k].pixels[index]
//             color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
//           }
//           if (x_offset + j < sprite.width && (y_offset + page_height - i - 1) < sprite.height) {
//             image.setPixelColor(color, x_offset + j, (y_offset + page_height - i - 1));
//           } else {
//             console.log('pixel exceeded sprite limits')
//           }
//         }
//       }
//       x_offset += page_width
//       if (x_offset >= sprite.width) {
//         x_offset = 0
//         y_offset += page_height
//       }
//     }
//     img.write('sprites/' + sprite.format + "_" + ind + '.png', (err) => {
//       if (err) throw err;
//     });
//   })
// })