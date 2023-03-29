const BinaryFile = require('binary-file');
const fs = require('fs');
const Jimp = require('jimp');

const myBinaryFile = new BinaryFile('./out_spriteblock.bin', 'r');

let out_sprite = {}
myBinaryFile.open().then(function () {
  console.log('reading out_spriteblock.bin...');
  return myBinaryFile
}).then(async function (file) { //step one: read through out_spriteblock.bin and parse data to json

  let cursor = 0

  //get sprite count
  out_sprite.spline_count = await file.readInt32(position = cursor)

  //get offsets
  out_sprite.addresses = []
  for (let j = 1; j < out_sprite.spline_count + 1; j++) {
    cursor = j * 4
    let read = await file.readInt32(position = cursor)
    out_sprite.addresses.push(read)
  }

  //get sprites
  out_sprite.sprites = []
  for (let j = 0; j < out_sprite.addresses.length; j++) {
    console.log("getting sprite " + (j + 1) + " of " + out_sprite.addresses.length)
    cursor = out_sprite.addresses[j]
    let sprite = {}
    sprite.offset = cursor
    sprite.width = await file.readInt16(position = cursor) //width in pixels 1-640
    cursor += 2
    sprite.height = await file.readInt16(position = cursor) //height in pixels 1-256
    cursor += 2
    sprite.format = await file.readInt16(position = cursor) //sprite format 3, 512, 513, 1024, 1025
    /*
      Format 3 / 0x3: 
        No palette
        pixel data consists of tuple of R G B A values (each 2 byte integer)
        used for lens flares and suns
      Format 512 / 0x200:
        Palette
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
    cursor += 4
    sprite.palette_offset = await file.readInt32(position = cursor) //start of palette data
    cursor += 4
    sprite.page_count = await file.readInt16(position = cursor) //number of pages the image is split into
    cursor += 2
    sprite.unk_0 = await file.readInt16(position = cursor) //always 32
    cursor += 2
    sprite.unk_1 = await file.readInt32(position = cursor) //always 20
    cursor += 4

    //get pages
    sprite.pages = []
    for (i = 0; i < sprite.page_count; i++) {
      let page = {}
      page.width = await file.readInt16(position = cursor)

      //with some odd sprite widths, page widths need to be corrected to line up pixels
      /*
      if ([513, 1025].includes(sprite.format)) {
        page.width = (page.width + 0x7) & 0xFFFFFFF8
      } else if ([512, 1024].includes(sprite.format)) {
        page.width = (page.width + 0xF) & 0xFFFFFFF0
      } */

      cursor += 2
      page.height = await file.readInt16(position = cursor)
      cursor += 2
      page.offset = await file.readInt32(position = cursor) //offset to start of pixel data for page
      cursor += 4
      sprite.pages.push(page)
    }

    //get palette
    sprite.palette = []
    if (sprite.palette_offset) {
      for (let i = sprite.offset + sprite.palette_offset; i < sprite.offset + sprite.pages[0].offset; i += 2) {
        let color = await file.readUInt16(position = i)
        let a = (color >> 0) & 0x1
        let b = ((color >> 1) & 0x1F) / 0x1F
        let g = ((color >> 6) & 0x1F) / 0x1F
        let r = ((color >> 11) & 0x1F) / 0x1F
        sprite.palette.push([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a * 0xFF])
      }
    }

    //get pixels
    for (let k = 0; k < sprite.page_count; k++) {
      sprite.pages[k].pixels = []
      for (let i = sprite.offset + sprite.pages[k].offset; i < sprite.offset + sprite.pages[k].offset + sprite.pages[k].width * sprite.pages[k].height || (sprite.format == 3 && i < sprite.offset + sprite.pages[k].offset + sprite.pages[k].width * sprite.pages[k].height * 4); i++) {
        let pixel = await file.readUInt8(position = i)
        if ([513, 1025].includes(sprite.format)) {
          sprite.pages[k].pixels.push(pixel)
        } else if ([512, 1024].includes(sprite.format)) {
          pixel_0 = (pixel >> 4) & 0xF
          pixel_1 = pixel & 0xF
          if(sprite.format == 1024){
            pixel_0 *= 0x11
            pixel_1 *= 0x11
          }
          sprite.pages[k].pixels.push(pixel_0, pixel_1)
        } else if (sprite.format == 3) {
          let r = pixel
          let g = await file.readUInt8(position = i + 1)
          let b = await file.readUInt8(position = i + 2)
          let a = await file.readUInt8(position = i + 3)
          pixel = [r, g, b, a]
          sprite.pages[k].pixels.push(pixel)
          i += 3
        }
      }
    }
    out_sprite.sprites.push(sprite)
  }
  fs.writeFile("out_spriteblock.json", JSON.stringify(out_sprite), (err) => {
    if (err) console.error(err)
  });

  return out_sprite
}).then(async function (out_sprite) { //step two: interpret parsed data as images
  console.log("drawing images...")
  out_sprite.sprites.forEach((sprite, ind) => {
    let img = new Jimp(sprite.width, sprite.height, (err, image) => {
      console.log("drawing sprite " + (ind + 1) + " of " + out_sprite.sprites.length)
      let x_offset = 0
      let y_offset = 0
      for (k = 0; k < sprite.page_count; k++) { //for every page
        let page_width = sprite.pages[k].width
        let page_height = sprite.pages[k].height
        for (i = 0; i < page_height; i++) { //for every page row
          for (j = 0; j < page_width; j++) { //for every page column
            let index  = i * page_width + j
            let p = null
            let color = null
            if ([512, 513].includes(sprite.format)) {
              p = sprite.palette[sprite.pages[k].pixels[index]]
              color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
            } else if ([1024, 1025].includes(sprite.format)) {
              p = sprite.pages[k].pixels[index]
              color = Jimp.rgbaToInt(p, p, p, 255)
            } else if (sprite.format == 3) {
              p = sprite.pages[k].pixels[index]
              color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
            }
            if (x_offset + j < sprite.width && (y_offset + page_height - i - 1) < sprite.height) {
              image.setPixelColor(color, x_offset + j, (y_offset + page_height - i - 1));
            } else {
              console.log('pixel exceeded sprite limits')
            }
          }
        }
        x_offset += page_width
        if (x_offset >= sprite.width) {
          x_offset = 0
          y_offset += page_height
        }
      }
      img.write('sprites/' +sprite.format + "_" + ind + '.png', (err) => {
        if (err) throw err;
      });
    })


  })
  return out_sprite
}).catch(function (err) {
  console.log(`There was an error: ${err}`);
});